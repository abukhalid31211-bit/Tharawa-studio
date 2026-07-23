import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket, authenticateSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      authenticateSocket();
    };
    const onDisconnect = () => setIsConnected(false);

    if (s.connected) {
      setIsConnected(true);
      authenticateSocket();
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
