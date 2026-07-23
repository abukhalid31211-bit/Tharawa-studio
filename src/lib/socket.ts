/**
 * Tharwah Capital — Socket.io Client (Production-Ready)
 * يتصل بـ VITE_SOCKET_URL من .env فقط — لا هاردكود نهائياً
 */
import { io, Socket } from 'socket.io-client';
import { env } from './env';
import { getClientSession, getAdminSession, getJwtToken } from './auth';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;

  socket = io(env.socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
    auth: { token: getJwtToken() },
  });

  socket.on('connect', () => {
    console.info('[Socket] Connected:', socket?.id);
    authenticateSocket();
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('admin_update', (data: any) => {
    console.info('[Socket] Admin update received:', data);
    window.dispatchEvent(new CustomEvent('tharwah_admin_update', { detail: data }));
  });

  socket.on('client_update', (data: any) => {
    console.info('[Socket] Client update received:', data);
    window.dispatchEvent(new CustomEvent('tharwah_client_update', { detail: data }));
  });

  socket.on('content_updated', (data: any) => {
    console.info('[Socket] Content update received:', data);
    window.dispatchEvent(new CustomEvent('tharwah_content_updated', { detail: data }));
  });

  socket.on('settings_updated', (data: any) => {
    console.info('[Socket] Settings update received:', data);
    window.dispatchEvent(new CustomEvent('tharwah_settings_updated', { detail: data }));
  });

  return socket;
}

export function authenticateSocket(): void {
  if (!socket) return;

  const token = getJwtToken();
  const currentToken = (socket.auth as { token?: string })?.token;
  if (token && token !== currentToken) {
    socket.auth = { token };
    socket.disconnect().connect();
    return;
  }

  const clientSession = getClientSession();
  const adminSession = getAdminSession();

  if (clientSession) {
    socket.emit('subscribe:client_updates');
  } else if (adminSession) {
    socket.emit('subscribe:admin_updates');
  }
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
