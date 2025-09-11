/**
 * Serviço de notificações do Helpdesk - Cliente
 * Faz chamadas para a API de notificações no servidor
 */

export interface NotificationData {
  changes?: string[];
  message?: string;
  [key: string]: any;
}

export class TicketNotificationService {
  /**
   * Notifica observadores sobre atualizações no ticket
   */
  async notifyObservers(
    ticketId: string,
    type: 'ticket_updated' | 'new_message' | 'observer_added',
    data: NotificationData = {}
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/helpdesk/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          type,
          data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro ao enviar notificações:', error);
        return false;
      }

      const result = await response.json();
      console.log('Notificações enviadas:', result);
      return true;

    } catch (error) {
      console.error('Erro ao chamar API de notificações:', error);
      return false;
    }
  }

  /**
   * Notifica sobre alterações no ticket
   */
  async notifyTicketUpdate(
    ticketId: string,
    changes: string[]
  ): Promise<boolean> {
    return this.notifyObservers(ticketId, 'ticket_updated', { changes });
  }

  /**
   * Notifica sobre nova mensagem no ticket
   */
  async notifyNewMessage(
    ticketId: string,
    message: string
  ): Promise<boolean> {
    return this.notifyObservers(ticketId, 'new_message', { message });
  }

  /**
   * Notifica sobre novo observador adicionado
   */
  async notifyObserverAdded(
    ticketId: string
  ): Promise<boolean> {
    return this.notifyObservers(ticketId, 'observer_added');
  }

  /**
   * Valida se um email é válido
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Instância singleton
export const notificationService = new TicketNotificationService();