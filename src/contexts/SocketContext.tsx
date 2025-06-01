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

  useEffect(() => {
    const socketUrl = 'http://10.10.11.27:3000';
    
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['polling', 'websocket'],
      forceNew: true,
      path: '/socket.io',
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected to:', socketUrl);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Ensure we're using polling as primary transport
      if (socketInstance.io.opts.transports[0] !== 'polling') {
        socketInstance.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socketInstance.io.on('error', (error) => {
      console.error('Transport error:', error);
      // Attempt reconnection with polling
      socketInstance.io.opts.transports = ['polling', 'websocket'];
      socketInstance.connect();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};