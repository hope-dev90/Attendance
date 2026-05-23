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
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

// Socket.io — StaffNet will connect here for real-time updates
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

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(generalLimiter);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/classes', require('./src/routes/classes'));
app.use('/api/students', require('./src/routes/students'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/lesson-reports', require('./src/routes/lessonReports'));
app.use('/api/routes', require('./src/routes/devGuide'));
app.use('/api/dev-guide', require('./src/routes/devGuide'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
