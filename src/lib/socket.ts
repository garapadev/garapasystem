import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join user to their own room for personalized notifications
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Handle CRM entity updates
    socket.on('entity-updated', (data: {
      entityType: 'cliente' | 'colaborador' | 'grupo' | 'usuario' | 'perfil';
      action: 'created' | 'updated' | 'deleted';
      entityId: string;
      entityName?: string;
      userId: string;
    }) => {
      // Broadcast to all connected clients except sender
      socket.broadcast.emit('entity-notification', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle real-time notifications
    socket.on('send-notification', (data: {
      targetUserId?: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      senderId: string;
    }) => {
      if (data.targetUserId) {
        // Send to specific user
        socket.to(`user-${data.targetUserId}`).emit('notification', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Broadcast to all users
        socket.broadcast.emit('notification', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('notification', {
      message: 'Conectado ao sistema em tempo real!',
      type: 'success',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};