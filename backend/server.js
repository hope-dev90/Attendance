require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const httpServer = http.createServer(app);
const clientOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

// Allow any device on the local network (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
const isLocalNetwork = (origin) => {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch { return false; }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin) || isLocalNetwork(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(generalLimiter);

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/classes', require('./src/routes/classes'));
app.use('/api/students', require('./src/routes/students'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/lesson-reports', require('./src/routes/lessonReports'));
app.use('/api/timetable', require('./src/routes/timetable'));
app.use('/api/routes', require('./src/routes/devGuide'));
app.use('/api/dev-guide', require('./src/routes/devGuide'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (accessible on all network interfaces)`);
});
