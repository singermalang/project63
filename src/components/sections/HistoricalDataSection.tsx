import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Typography, 
  Box, 
  Divider, 
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import { BarChart3, Calendar, Download } from 'lucide-react';
import { DataType } from '../../types';
import TemperatureChart from '../charts/TemperatureChart';
import HumidityChart from '../charts/HumidityChart';
import ElectricalChart from '../charts/ElectricalChart';
import { format } from 'date-fns';

interface HistoricalDataSectionProps {
  data: DataType;
  loading: boolean;
  isMobile: boolean;
}

const HistoricalDataSection = ({ data, loading, isMobile }: HistoricalDataSectionProps) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState(0);

  const handleTimeRangeChange = (
    _: React.MouseEvent<HTMLElement>,
    newTimeRange: string | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    // Get current date for filename
    const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');

    switch (activeTab) {
      case 0: // Temperature
        csvContent = 'Timestamp,NOC Temperature (°C),UPS Temperature (°C)\n';
        data.historical.temperature?.noc.forEach((item, index) => {
          csvContent += `${item.timestamp},${item.value},${data.historical.temperature?.ups[index]?.value || ''}\n`;
        });
        filename = `temperature_data_${dateStr}.csv`;
        break;

      case 1: // Humidity
        csvContent = 'Timestamp,NOC Humidity (%),UPS Humidity (%)\n';
        data.historical.humidity?.noc.forEach((item, index) => {
          csvContent += `${item.timestamp},${item.value},${data.historical.humidity?.ups[index]?.value || ''}\n`;
        });
        filename = `humidity_data_${dateStr}.csv`;
        break;

      case 2: // Electrical
        csvContent = 'Timestamp,Phase R (V),Phase S (V),Phase T (V)\n';
        data.historical.electrical?.forEach(item => {
          csvContent += `${item.timestamp},${item.phase_r},${item.phase_s},${item.phase_t}\n`;
        });
        filename = `electrical_data_${dateStr}.csv`;
        break;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card 
      sx={{ 
        backgroundImage: 'linear-gradient(to bottom right, rgba(30, 30, 60, 0.4), rgba(30, 30, 60, 0.1))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      className="card"
    >
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChart3 size={24} color="#3f88f2" />
            <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
              Historical Data
            </Typography>
          </Box>
        } 
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} size="small" sx={{ mr: 1 }}>
                <Download size={20} />
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup
              size="small"
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              aria-label="time range"
              sx={{ 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '.MuiToggleButton-root': {
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(63, 136, 242, 0.1)',
                  }
                } 
              }}
            >
              <ToggleButton value="24h" aria-label="24 hours">
                24h
              </ToggleButton>
              <ToggleButton value="7d" aria-label="7 days">
                7d
              </ToggleButton>
              <ToggleButton value="30d" aria-label="30 days">
                30d
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ 
            '.MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 500,
              minHeight: '48px',
            } 
          }}
        >
          <Tab 
            label="Temperature" 
            icon={<Calendar size={16} />} 
            iconPosition="start"
          />
          <Tab 
            label="Humidity" 
            icon={<Calendar size={16} />} 
            iconPosition="start"
          />
          <Tab 
            label="Electrical" 
            icon={<Calendar size={16} />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular\" height={300} width="100%" />
        ) : (
          <Box sx={{ mt: 1 }}>
            {/* Temperature Chart */}
            {activeTab === 0 && (
              <TemperatureChart 
                nocData={data.historical.temperature?.noc || []} 
                upsData={data.historical.temperature?.ups || []} 
                timeRange={timeRange}
              />
            )}
            
            {/* Humidity Chart */}
            {activeTab === 1 && (
              <HumidityChart 
                nocData={data.historical.humidity?.noc || []} 
                upsData={data.historical.humidity?.ups || []} 
                timeRange={timeRange}
              />
            )}
            
            {/* Electrical Chart */}
            {activeTab === 2 && (
              <ElectricalChart 
                data={data.historical.electrical || []} 
                timeRange={timeRange}
              />
            )}
          </Box>
        )}
        
        <Box 
          sx={{ 
            mt: 2, 
            p: 1, 
            borderRadius: 1, 
            bgcolor: 'rgba(63, 136, 242, 0.1)', 
            border: '1px solid rgba(63, 136, 242, 0.2)' 
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', color: 'primary.light' }}>
            <strong>Time Range:</strong> {timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'primary.light' }}>
            <strong>Data Points:</strong> {timeRange === '24h' ? '144 samples (10 min intervals)' : timeRange === '7d' ? '168 samples (1 hour intervals)' : '120 samples (6 hour intervals)'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HistoricalDataSection;