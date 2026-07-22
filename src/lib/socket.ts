/**
 * Tharwah Capital — Socket.io Client (Production-Ready)
 * يتصل بـ VITE_SOCKET_URL من .env فقط — لا هاردكود نهائياً
 */
import { io, Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;

  const socketUrl = (import.meta.env.VITE_SOCKET_URL as string) || env.apiUrl || (import.meta.env.PROD ? 'https://api.your-domain.com' : 'http://localhost:3000');
  
  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.info('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('admin_update', (data: any) => {
    console.info('[Socket] Admin update received:', data);
    // هنا يمكن إرسال حدث لتحديث البيانات في TanStack Query أو Context
    window.dispatchEvent(new CustomEvent('tharwah_admin_update', { detail: data }));
  });

  socket.on('client_update', (data: any) => {
    console.info('[Socket] Client update received:', data);
    window.dispatchEvent(new CustomEvent('tharwah_client_update', { detail: data }));
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function subscribeToAdminUpdates() {
  if (socket && socket.connected) {
    socket.emit('subscribe:admin_updates');
  }
}

export function subscribeToClientUpdates(clientId: string) {
  if (socket && socket.connected) {
    socket.emit('subscribe:client_updates', clientId);
  }
}
