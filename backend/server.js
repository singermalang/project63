import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS with environment variable
const corsOrigin = process.env.CORS_ORIGIN || 'http://10.10.1.25';

// Configure CORS
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8
});

// Create MySQL connection pool
const pool = createPool({
  host: process.env.MYSQL_HOST || '10.10.11.27',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'bismillah123',
  database: process.env.MYSQL_DATABASE || 'suhu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Check database connection
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// API routes
app.get('/', (req, res) => {
  res.send('NOC Monitoring Backend is running');
});

app.get('/api/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Access logs endpoint
app.get('/api/access-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM access_logs ORDER BY access_time DESC LIMIT 5'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

// Fetch and emit data every 5 seconds
async function fetchAndEmitData() {
  try {
    // Fetch NOC temperature and humidity data
    const [nocData] = await pool.query('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1');
    if (nocData.length > 0) {
      io.emit('noc_temperature', { 
        suhu: parseFloat(nocData[0].suhu),
        waktu: nocData[0].waktu
      });
      
      io.emit('noc_humidity', { 
        kelembapan: parseFloat(nocData[0].kelembapan),
        waktu: nocData[0].waktu
      });
    }

    // Fetch UPS temperature and humidity data
    const [upsData] = await pool.query('SELECT * FROM sensor_data1 ORDER BY id DESC LIMIT 1');
    if (upsData.length > 0) {
      io.emit('ups_temperature', { 
        suhu: parseFloat(upsData[0].suhu),
        waktu: upsData[0].waktu
      });
      
      io.emit('ups_humidity', { 
        kelembapan: parseFloat(upsData[0].kelembapan),
        waktu: upsData[0].waktu
      });
    }

    // Fetch electrical data
    const [electricalData] = await pool.query('SELECT * FROM listrik_noc ORDER BY id DESC LIMIT 1');
    if (electricalData.length > 0) {
      io.emit('electrical_data', electricalData[0]);
    }

    // Fetch fire and smoke detection data
    const [fireSmokeData] = await pool.query('SELECT * FROM api_asap_data ORDER BY id DESC LIMIT 1');
    if (fireSmokeData.length > 0) {
      io.emit('fire_smoke_data', fireSmokeData[0]);
    }

    // Fetch access logs
    const [accessLogs] = await pool.query(
      'SELECT * FROM access_logs ORDER BY access_time DESC LIMIT 5'
    );
    if (accessLogs.length > 0) {
      io.emit('access_logs', accessLogs);
    }

  } catch (error) {
    console.error('Error fetching or emitting data:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start data emission interval
setInterval(fetchAndEmitData, 5000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  checkDatabaseConnection();
});