import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [transportType, setTransportType] = useState<'websocket' | 'polling'>('websocket');

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:3000';
    
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: [transportType],
      forceNew: true,
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Credentials': 'true'
      }
    });

    socketInstance.on('connect', () => {
      console.log(`Socket connected successfully using ${transportType}`);
      setConnected(true);
      setRetryCount(0);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);

      if (reason === 'transport error' && transportType === 'websocket') {
        console.log('Falling back to polling transport');
        setTransportType('polling');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setRetryCount((prev) => prev + 1);
      
      if (retryCount >= 3 && transportType === 'websocket') {
        console.log('Falling back to polling after multiple websocket failures');
        setTransportType('polling');
      }
    });

    socketInstance.io.on('ping', () => {
      console.log('Ping received');
    });

    socketInstance.io.on('pong', (latency) => {
      console.log('Pong received, latency:', latency, 'ms');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [transportType, retryCount]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};