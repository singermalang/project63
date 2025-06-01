import { useEffect, useState } from 'react';
import { Box, CssBaseline, useMediaQuery } from '@mui/material';
import { useTheme } from './contexts/ThemeContext';
import { useSocket } from './contexts/SocketContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import useAlarmSound from './hooks/useAlarmSound';
import { AlertBanner } from './components/AlertBanner';

function App() {
  const { theme } = useTheme();
  const { socket, connected } = useSocket();
  const [alerts, setAlerts] = useState<string[]>([]);
  const isMobile = useMediaQuery('(max-width:600px)');
  const { playAlarm } = useAlarmSound();

  // Function to add alerts
  const addAlert = (message: string) => {
    setAlerts((prev) => {
      // Don't add duplicate alerts
      if (prev.includes(message)) return prev;
      // Play alarm sound when adding a new alert
      playAlarm();
      return [...prev, message];
    });
  };

  // Function to remove alerts
  const removeAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  useEffect(() => {
    if (!socket) return;

    // Handle connection status
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      addAlert('Koneksi ke server terputus. Mencoba menghubungkan kembali...');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      addAlert(`Error koneksi: ${error.message}`);
    });

    // Clean up
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <CssBaseline />
      <Header 
        connected={connected} 
        isMobile={isMobile}
        alertCount={alerts.length}
        clearAlerts={clearAlerts}
      />
      
      {alerts.length > 0 && (
        <Box sx={{ mt: 2, px: 2 }}>
          {alerts.map((alert, index) => (
            <AlertBanner 
              key={`${alert}-${index}`}
              message={alert}
              onClose={() => removeAlert(index)}
            />
          ))}
        </Box>
      )}
      
      <Dashboard 
        addAlert={addAlert}
        isMobile={isMobile}
      />
    </Box>
  );
}

export default App;