import { Box, Typography, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface ValueDisplayProps {
  value: string | number;
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
  icon?: ReactNode;
  subtitle?: string;
  timestamp?: string;
}

const ValueDisplay = ({ value, unit, status, icon, subtitle, timestamp }: ValueDisplayProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return '#ff5252';
      case 'warning': return '#ffb74d';
      default: return '#4caf50';
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'critical': return 'rgba(255, 82, 82, 0.1)';
      case 'warning': return 'rgba(255, 183, 77, 0.1)';
      default: return 'rgba(76, 175, 80, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'critical': return 'rgba(255, 82, 82, 0.3)';
      case 'warning': return 'rgba(255, 183, 77, 0.3)';
      default: return 'rgba(76, 175, 80, 0.3)';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Value */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
        {icon && <Box sx={{ mr: 1, color: getStatusColor() }}>{icon}</Box>}
        <Typography 
          variant="h4" 
          component="div"
          sx={{ 
            fontWeight: 600,
            color: getStatusColor(),
            lineHeight: 1.2,
          }}
          className="value-change"
        >
          {value}
          {unit && (
            <Typography 
              component="span" 
              sx={{ 
                fontSize: '1rem', 
                verticalAlign: 'middle',
                ml: 0.5,
                color: getStatusColor(),
                opacity: 0.7
              }}
            >
              {unit}
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Subtitle or timestamp */}
      {(subtitle || timestamp) && (
        <Box sx={{ mt: 'auto' }}>
          {subtitle && (
            <Typography variant="body2\" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {timestamp}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ValueDisplay;