import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setIo(io: Server) {
  ioInstance = io;
}

export function getIo(): Server {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

export function broadcastAdminUpdate(data: any) {
  if (!ioInstance) return;
  ioInstance.to('admin_updates').emit('admin_update', {
    timestamp: new Date().toISOString(),
    type: 'data_changed',
    data,
  });
}

export function broadcastClientUpdate(clientId: string, data: any) {
  if (!ioInstance) return;
  ioInstance.to(`client:${clientId}`).emit('client_update', {
    timestamp: new Date().toISOString(),
    type: 'data_changed',
    data,
  });
  ioInstance.to(`user:${clientId}`).emit('client_update', {
    timestamp: new Date().toISOString(),
    type: 'data_changed',
    data,
  });
}

export function broadcastPublicUpdate(event: string, data: any) {
  if (!ioInstance) return;
  ioInstance.emit(event, {
    timestamp: new Date().toISOString(),
    type: 'public_update',
    data,
  });
}
