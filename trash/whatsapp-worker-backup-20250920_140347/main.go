package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// Estruturas seguindo padrão UzAPI
type Session struct {
	ID          string                    `json:"session"`
	SessionKey  string                    `json:"sessionKey"`
	Token       string                    `json:"token"`
	Status      string                    `json:"status"` // "disconnected", "connecting", "qr_required", "connected"
	QRCode      string                    `json:"qrCode,omitempty"`
	PhoneNumber string                    `json:"phoneNumber,omitempty"`
	Client      *whatsmeow.Client         `json:"-"`
	Store       *sqlstore.Container      `json:"-"`
	WebSockets  map[string]*websocket.Conn `json:"-"`
	LastSync    time.Time                 `json:"-"`
	CreatedAt   time.Time                 `json:"createdAt"`
	UpdatedAt   time.Time                 `json:"updatedAt"`
	mutex       sync.RWMutex              `json:"-"`
}

type WhatsAppWorker struct {
	db        *sql.DB
	sessions  map[string]*Session
	upgrader  websocket.Upgrader
	logger    waLog.Logger
	mutex     sync.RWMutex
}

// Requests seguindo padrão UzAPI
type StartRequest struct {
	Session     string `json:"session"`
	SessionKey  string `json:"sessionKey"`
	Token       string `json:"token"`
	WebhookUrl  string `json:"webhookUrl,omitempty"`
}

type StatusRequest struct {
	Session    string `json:"session"`
	SessionKey string `json:"sessionKey"`
	Token      string `json:"token"`
}

type QRCodeRequest struct {
	Session    string `json:"session"`
	SessionKey string `json:"sessionKey"`
	Token      string `json:"token"`
}

type MessageRequest struct {
	Session    string `json:"session"`
	SessionKey string `json:"sessionKey"`
	Token      string `json:"token"`
	Phone      string `json:"phone"`
	Message    string `json:"message"`
}

// Responses seguindo padrão UzAPI
type UzAPIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type SessionData struct {
	Session     string    `json:"session"`
	Status      string    `json:"status"`
	QRCode      string    `json:"qrCode,omitempty"`
	PhoneNumber string    `json:"phoneNumber,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func main() {
	// Carregar variáveis de ambiente
	envFiles := []string{"../.env.local", "../.env"}
	var err error
	loaded := false
	
	for _, envFile := range envFiles {
		err = godotenv.Load(envFile)
		if err == nil {
			log.Printf("Configurações carregadas de: %s", envFile)
			loaded = true
			break
		}
	}
	
	if !loaded {
		log.Printf("Aviso: nenhum arquivo de configuração encontrado (.env.local ou .env)")
	}

	// Configurar worker
	worker := &WhatsAppWorker{
		sessions: make(map[string]*Session),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		logger: waLog.Stdout("WhatsApp", "INFO", true),
	}

	// Conectar ao banco de dados
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL não definida")
	}

	worker.db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Erro ao conectar ao banco:", err)
	}
	defer worker.db.Close()

	// Configurar rotas seguindo padrão UzAPI
	mux := http.NewServeMux()
	mux.HandleFunc("/start", worker.handleStart)
	mux.HandleFunc("/status", worker.handleStatus)
	mux.HandleFunc("/qrcode", worker.handleQRCode)
	mux.HandleFunc("/disconnect", worker.handleDisconnect)
	mux.HandleFunc("/send-text", worker.handleSendText)
	mux.HandleFunc("/health", worker.handleHealth)
	mux.HandleFunc("/ws", worker.handleWebSocket)

	// Configurar graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("Encerrando worker...")
		worker.cleanup()
		os.Exit(0)
	}()

	// Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Worker UzAPI iniciado na porta %s", port)
	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Fatal(server.ListenAndServe())
}

func (w *WhatsAppWorker) handleStart(rw http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.sendError(rw, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req StartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.sendError(rw, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Session == "" || req.SessionKey == "" || req.Token == "" {
		w.sendError(rw, "Campos obrigatórios: session, sessionKey, token", http.StatusBadRequest)
		return
	}

	log.Printf("Iniciando sessão: %s", req.Session)

	w.mutex.Lock()
	defer w.mutex.Unlock()

	// Verificar se sessão já existe
	if session, exists := w.sessions[req.Session]; exists {
		session.mutex.RLock()
		if session.Status == "connected" && session.Client != nil && session.Client.IsConnected() {
			data := SessionData{
				Session:     session.ID,
				Status:      session.Status,
				PhoneNumber: session.PhoneNumber,
				CreatedAt:   session.CreatedAt,
				UpdatedAt:   session.UpdatedAt,
			}
			session.mutex.RUnlock()
			w.sendSuccess(rw, "Sessão já conectada", data)
			return
		}
		session.mutex.RUnlock()
	}

	// Criar nova sessão
	session := &Session{
		ID:         req.Session,
		SessionKey: req.SessionKey,
		Token:      req.Token,
		Status:     "connecting",
		WebSockets: make(map[string]*websocket.Conn),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Configurar store do banco de dados
	sessionPath := filepath.Join(os.Getenv("WHATSAPP_SESSION_PATH"), req.Session)
	os.MkdirAll(sessionPath, 0755)

	session.Store = sqlstore.NewWithDB(w.db, "postgres", waLog.Noop)
	err := session.Store.Upgrade(context.Background())
	if err != nil {
		w.sendError(rw, fmt.Sprintf("Erro ao configurar store: %v", err), http.StatusInternalServerError)
		return
	}

	// Criar device store
	deviceStore := session.Store.NewDevice()
	if deviceStore == nil {
		w.sendError(rw, "Erro ao criar device store", http.StatusInternalServerError)
		return
	}

	// Criar cliente WhatsApp
	session.Client = whatsmeow.NewClient(deviceStore, w.logger)
	if session.Client == nil {
		w.sendError(rw, "Erro ao criar cliente WhatsApp", http.StatusInternalServerError)
		return
	}

	// Configurar event handlers
	session.Client.AddEventHandler(w.eventHandler(req.Session))

	// Armazenar sessão no mapa ANTES de liberar o mutex
	w.sessions[req.Session] = session
	log.Printf("Sessão %s armazenada no mapa. Total de sessões: %d", req.Session, len(w.sessions))

	// Conectar de forma assíncrona (mas não liberar o mutex ainda)
	go w.connectSession(req.Session)

	data := SessionData{
		Session:   session.ID,
		Status:    session.Status,
		CreatedAt: session.CreatedAt,
		UpdatedAt: session.UpdatedAt,
	}

	w.sendSuccess(rw, "Sessão iniciada", data)
}

func (w *WhatsAppWorker) connectSession(sessionID string) {
	w.mutex.RLock()
	session, exists := w.sessions[sessionID]
	w.mutex.RUnlock()

	if !exists {
		return
	}

	// Verificar se já está conectado sem lock
	session.mutex.RLock()
	if session.Status == "connected" {
		session.mutex.RUnlock()
		return
	}
	isFirstConnection := session.Client.Store.ID == nil
	session.mutex.RUnlock()

	if isFirstConnection {
		// Primeira conexão - gerar QR code
		qrChan, _ := session.Client.GetQRChannel(context.Background())
		err := session.Client.Connect()
		if err != nil {
			log.Printf("Erro ao conectar sessão %s: %v", sessionID, err)
			session.mutex.Lock()
			session.Status = "disconnected"
			session.mutex.Unlock()
			return
		}

		// Aguardar QR code com timeout reduzido
		select {
		case evt := <-qrChan:
			if evt.Event == "code" {
				session.mutex.Lock()
				session.QRCode = evt.Code
				session.Status = "qr_required"
				session.UpdatedAt = time.Now()
				session.mutex.Unlock()
				log.Printf("QR Code gerado para sessão %s", sessionID)
				
				// Notificar via WebSocket
				w.notifyWebSockets(sessionID, map[string]interface{}{
					"type": "qr_code",
					"data": map[string]interface{}{
						"session": sessionID,
						"qrCode":  evt.Code,
						"status":  "qr_required",
					},
				})
			} else if evt.Event == "success" {
				session.mutex.Lock()
				session.Status = "connected"
				session.PhoneNumber = session.Client.Store.ID.User
				session.UpdatedAt = time.Now()
				session.mutex.Unlock()
				log.Printf("Sessão %s conectada com sucesso", sessionID)
				
				// Notificar via WebSocket
				w.notifyWebSockets(sessionID, map[string]interface{}{
					"type": "session_connected",
					"data": map[string]interface{}{
						"session":     sessionID,
						"status":      "connected",
						"phoneNumber": session.PhoneNumber,
					},
				})
			}
		case <-time.After(30 * time.Second):
			log.Printf("Timeout aguardando QR code para sessão %s", sessionID)
			session.mutex.Lock()
			session.Status = "disconnected"
			session.mutex.Unlock()
			w.mutex.Lock()
			log.Printf("Removendo sessão %s do mapa devido a timeout. Total antes: %d", sessionID, len(w.sessions))
			delete(w.sessions, sessionID)
			log.Printf("Total de sessões após remoção: %d", len(w.sessions))
			w.mutex.Unlock()
		}
	} else {
		// Reconexão
		err := session.Client.Connect()
		if err != nil {
			log.Printf("Erro ao reconectar sessão %s: %v", sessionID, err)
			session.mutex.Lock()
			session.Status = "disconnected"
			session.mutex.Unlock()
			return
		}
		
		session.mutex.Lock()
		session.Status = "connected"
		session.PhoneNumber = session.Client.Store.ID.User
		session.UpdatedAt = time.Now()
		session.mutex.Unlock()
		log.Printf("Sessão %s reconectada", sessionID)
	}
}

func (w *WhatsAppWorker) handleStatus(rw http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.sendError(rw, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req StatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.sendError(rw, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Session == "" {
		w.sendError(rw, "Campo obrigatório: session", http.StatusBadRequest)
		return
	}

	w.mutex.RLock()
	session, exists := w.sessions[req.Session]
	sessionCount := len(w.sessions)
	
	// Log detalhado para debug
	log.Printf("=== DEBUG STATUS ===")
	log.Printf("Sessão solicitada: %s", req.Session)
	log.Printf("Sessão existe: %v", exists)
	log.Printf("Total de sessões: %d", sessionCount)
	
	// Listar todas as sessões para debug
	if sessionCount > 0 {
		log.Printf("Sessões disponíveis:")
		for sessionId := range w.sessions {
			log.Printf("  - %s", sessionId)
		}
	}
	
	w.mutex.RUnlock()

	if !exists {
		log.Printf("ERRO: Sessão %s não encontrada no mapa", req.Session)
		w.sendError(rw, "Sessão não encontrada", http.StatusNotFound)
		return
	}

	session.mutex.RLock()
	data := SessionData{
		Session:     session.ID,
		Status:      session.Status,
		QRCode:      session.QRCode,
		PhoneNumber: session.PhoneNumber,
		CreatedAt:   session.CreatedAt,
		UpdatedAt:   session.UpdatedAt,
	}
	session.mutex.RUnlock()

	log.Printf("Status da sessão %s: %s", req.Session, session.Status)
	w.sendSuccess(rw, "Status da sessão", data)
}

func (w *WhatsAppWorker) handleQRCode(rw http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.sendError(rw, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req QRCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.sendError(rw, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Session == "" {
		w.sendError(rw, "Campo obrigatório: session", http.StatusBadRequest)
		return
	}

	w.mutex.RLock()
	session, exists := w.sessions[req.Session]
	w.mutex.RUnlock()

	if !exists {
		w.sendError(rw, "Sessão não encontrada", http.StatusNotFound)
		return
	}

	// Aguardar QR Code ser gerado (máximo 30 segundos)
	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			w.sendError(rw, "Timeout aguardando QR Code", http.StatusRequestTimeout)
			return
		case <-ticker.C:
			session.mutex.RLock()
			if session.Status == "qr_required" && session.QRCode != "" {
				data := map[string]interface{}{
					"session": session.ID,
					"qrCode":  session.QRCode,
					"status":  session.Status,
				}
				session.mutex.RUnlock()
				w.sendSuccess(rw, "QR Code obtido", data)
				return
			} else if session.Status == "connected" {
				session.mutex.RUnlock()
				w.sendError(rw, "Sessão já conectada", http.StatusBadRequest)
				return
			} else if session.Status == "disconnected" {
				session.mutex.RUnlock()
				w.sendError(rw, "Sessão desconectada", http.StatusBadRequest)
				return
			}
			session.mutex.RUnlock()
		}
	}
}

func (w *WhatsAppWorker) handleDisconnect(rw http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.sendError(rw, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req StatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.sendError(rw, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Session == "" {
		w.sendError(rw, "Campo obrigatório: session", http.StatusBadRequest)
		return
	}

	w.mutex.Lock()
	defer w.mutex.Unlock()

	session, exists := w.sessions[req.Session]
	if !exists {
		w.sendError(rw, "Sessão não encontrada", http.StatusNotFound)
		return
	}

	session.mutex.Lock()
	if session.Client != nil {
		session.Client.Disconnect()
	}
	session.Status = "disconnected"
	
	// Fechar WebSockets
	for _, conn := range session.WebSockets {
		conn.Close()
	}
	session.mutex.Unlock()

	delete(w.sessions, req.Session)

	data := map[string]interface{}{
		"session": req.Session,
		"status":  "disconnected",
	}

	w.sendSuccess(rw, "Sessão desconectada", data)
}

func (w *WhatsAppWorker) handleSendText(rw http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.sendError(rw, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req MessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.sendError(rw, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Session == "" || req.Phone == "" || req.Message == "" {
		w.sendError(rw, "Campos obrigatórios: session, phone, message", http.StatusBadRequest)
		return
	}

	w.mutex.RLock()
	session, exists := w.sessions[req.Session]
	w.mutex.RUnlock()

	if !exists {
		w.sendError(rw, "Sessão não encontrada", http.StatusNotFound)
		return
	}

	session.mutex.RLock()
	if session.Status != "connected" || session.Client == nil || !session.Client.IsConnected() {
		session.mutex.RUnlock()
		w.sendError(rw, "Sessão não conectada", http.StatusBadRequest)
		return
	}

	// Parsear número de telefone
	jid, err := types.ParseJID(req.Phone)
	if err != nil {
		session.mutex.RUnlock()
		w.sendError(rw, "Número de telefone inválido", http.StatusBadRequest)
		return
	}

	// Enviar mensagem
	msgInfo, err := session.Client.SendMessage(context.Background(), jid, &waE2E.Message{
		Conversation: &req.Message,
	})
	session.mutex.RUnlock()

	if err != nil {
		w.sendError(rw, fmt.Sprintf("Erro ao enviar mensagem: %v", err), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"messageId": msgInfo.ID,
		"phone":     req.Phone,
		"message":   req.Message,
		"timestamp": msgInfo.Timestamp,
		"status":    "sent",
	}

	w.sendSuccess(rw, "Mensagem enviada", data)
}

func (w *WhatsAppWorker) handleHealth(rw http.ResponseWriter, r *http.Request) {
	w.mutex.RLock()
	connectedSessions := 0
	for _, session := range w.sessions {
		session.mutex.RLock()
		if session.Status == "connected" {
			connectedSessions++
		}
		session.mutex.RUnlock()
	}
	totalSessions := len(w.sessions)
	w.mutex.RUnlock()

	data := map[string]interface{}{
		"status":    "ok",
		"sessions":  totalSessions,
		"timestamp": time.Now().Format(time.RFC3339),
	}

	w.sendSuccess(rw, "Worker saudável", data)
}

func (w *WhatsAppWorker) handleWebSocket(rw http.ResponseWriter, r *http.Request) {
	conn, err := w.upgrader.Upgrade(rw, r, nil)
	if err != nil {
		log.Printf("Erro ao fazer upgrade WebSocket: %v", err)
		return
	}
	defer conn.Close()

	sessionID := r.URL.Query().Get("session")
	if sessionID == "" {
		log.Printf("Session não fornecido na conexão WebSocket")
		return
	}

	w.mutex.RLock()
	session, exists := w.sessions[sessionID]
	w.mutex.RUnlock()

	if exists {
		session.mutex.Lock()
		connID := fmt.Sprintf("%p", conn)
		session.WebSockets[connID] = conn
		session.mutex.Unlock()

		defer func() {
			session.mutex.Lock()
			delete(session.WebSockets, connID)
			session.mutex.Unlock()
		}()
	}

	// Manter conexão viva
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (w *WhatsAppWorker) eventHandler(sessionID string) func(interface{}) {
	return func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			w.handleIncomingMessage(sessionID, v)
		case *events.Connected:
			log.Printf("Sessão %s conectada", sessionID)
			w.notifyWebSockets(sessionID, map[string]interface{}{
				"type": "session_connected",
				"data": map[string]interface{}{
					"session": sessionID,
					"status":  "connected",
				},
			})
		case *events.Disconnected:
			log.Printf("Sessão %s desconectada", sessionID)
			w.mutex.RLock()
			if session, exists := w.sessions[sessionID]; exists {
				session.mutex.Lock()
				session.Status = "disconnected"
				session.mutex.Unlock()
			}
			w.mutex.RUnlock()
			
			w.notifyWebSockets(sessionID, map[string]interface{}{
				"type": "session_disconnected",
				"data": map[string]interface{}{
					"session": sessionID,
					"status":  "disconnected",
				},
			})
		}
	}
}

func (w *WhatsAppWorker) handleIncomingMessage(sessionID string, evt *events.Message) {
	content := evt.Message.GetConversation()
	if content == "" {
		content = "[Mensagem não suportada]"
	}

	log.Printf("Mensagem recebida para %s de %s: %s", sessionID, evt.Info.Sender, content)

	w.notifyWebSockets(sessionID, map[string]interface{}{
		"type": "message_received",
		"data": map[string]interface{}{
			"messageId": evt.Info.ID,
			"chatId":    evt.Info.Chat.String(),
			"content":   content,
			"sender":    evt.Info.Sender.String(),
			"timestamp": evt.Info.Timestamp,
		},
	})
}

func (w *WhatsAppWorker) notifyWebSockets(sessionID string, data map[string]interface{}) {
	w.mutex.RLock()
	session, exists := w.sessions[sessionID]
	w.mutex.RUnlock()

	if !exists {
		return
	}

	session.mutex.RLock()
	defer session.mutex.RUnlock()

	message, _ := json.Marshal(data)
	for _, conn := range session.WebSockets {
		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Erro ao enviar WebSocket: %v", err)
		}
	}
}

func (w *WhatsAppWorker) sendSuccess(rw http.ResponseWriter, message string, data interface{}) {
	response := UzAPIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
	
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)
	json.NewEncoder(rw).Encode(response)
}

func (w *WhatsAppWorker) sendError(rw http.ResponseWriter, message string, statusCode int) {
	response := UzAPIResponse{
		Success: false,
		Message: message,
		Error:   message,
	}
	
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(statusCode)
	json.NewEncoder(rw).Encode(response)
}

func (w *WhatsAppWorker) cleanup() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	for sessionID, session := range w.sessions {
		log.Printf("Desconectando sessão %s", sessionID)
		session.mutex.Lock()
		if session.Client != nil {
			session.Client.Disconnect()
		}
		for _, conn := range session.WebSockets {
			conn.Close()
		}
		session.mutex.Unlock()
	}
}