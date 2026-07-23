import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { setIo } from './lib/socket.js';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import portfoliosRoutes from './routes/portfolios.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import meetingsRoutes from './routes/meetings.routes.js';
import subAdminsRoutes from './routes/sub-admins.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';
import contentRoutes from './routes/content.routes.js';
import marketsRoutes from './routes/markets.routes.js';

const app = express();
const server = http.createServer(app);

// Socket.io — بدون هاردكود للدومين
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : ['*'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

setIo(io);

// Track connected users/sockets
const userSockets = new Map<string, string[]>();

// Middleware
app.use(helmet());
app.use(morgan(config.logLevel === 'debug' ? 'dev' : 'combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS مرن من Environment Variables
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    return config.nodeEnv === 'production' ? callback(new Error('Origin not allowed'), false) : callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'تم تجاوز الحد المسموح من الطلبات',
    messageEn: 'Rate limit exceeded',
  },
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Tharwah Capital API is running',
    messageAr: 'واجهة برمجة تطبيقات ثروة كابيتال تعمل',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      auth: true,
      database: !!config.databaseUrl,
      socketIO: true,
      corsFlexible: true,
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/portfolios', portfoliosRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/sub-admins', subAdminsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/markets', marketsRoutes);

// Socket.io events — تحديث لحظي بدون Reload
io.on('connection', (socket) => {
  console.info(`[Socket] Client connected: ${socket.id}`);

  socket.on('authenticate', (data: { userId: string; role: string }) => {
    if (data.userId) {
      const existing = userSockets.get(data.userId) || [];
      if (!existing.includes(socket.id)) {
        existing.push(socket.id);
        userSockets.set(data.userId, existing);
      }
      socket.data.userId = data.userId;
      socket.data.role = data.role;
    }
    if (data.role === 'super' || data.role === 'admin' || data.role === 'sub') {
      socket.join('admin_updates');
    }
    socket.join(`user:${data.userId}`);
  });

  socket.on('subscribe:admin_updates', () => {
    socket.join('admin_updates');
  });

  socket.on('subscribe:client_updates', (clientId: string) => {
    socket.join(`client:${clientId}`);
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      const existing = userSockets.get(userId) || [];
      const updated = existing.filter((id) => id !== socket.id);
      if (updated.length > 0) {
        userSockets.set(userId, updated);
      } else {
        userSockets.delete(userId);
      }
    }
    console.info(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'حدث خطأ غير متوقع',
    messageEn: err.message || 'An unexpected error occurred',
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
});

// Start server
server.listen(config.port, () => {
  console.info(`[Server] Tharwah Capital API running on port ${config.port}`);
  console.info(`[Server] Environment: ${config.nodeEnv}`);
  console.info(`[Server] CORS allowed origins: ${config.allowedOrigins.join(', ') || '(none set — check ALLOWED_ORIGINS)'}`);
  console.info(`[Server] Database URL: ${config.databaseUrl ? 'configured' : 'NOT CONFIGURED'}`);
  console.info(`[Server] Socket.IO enabled: yes`);
});

export { app, server, io };
