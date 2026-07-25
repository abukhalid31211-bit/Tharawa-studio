import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt, { JwtPayload } from 'jsonwebtoken';
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
import platformDataRoutes from './routes/platform-data.routes.js';
import contactRoutes from './routes/contact.routes.js';
import homeRoutes from './routes/home.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const server = http.createServer(app);

// Socket.io — بدون هاردكود للدومين
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token;
  if (!rawToken) {
    socket.data.authenticated = false;
    return next();
  }
  try {
    const payload = jwt.verify(String(rawToken), config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithms: ['HS256'],
    }) as JwtPayload;
    if (!payload.sub || typeof payload.role !== 'string') return next(new Error('Unauthorized'));
    socket.data.authenticated = true;
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    return next();
  } catch {
    return next(new Error('Unauthorized'));
  }
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
    if (config.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return config.nodeEnv === 'production' ? callback(new Error('Origin not allowed'), false) : callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'],
}));

// Authentication endpoints use a stricter limiter than regular API traffic.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.maxLoginAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'TooManyAttempts', message: 'تم تجاوز عدد محاولات الدخول المسموح' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

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

// Health check includes the database, so deployment systems do not route traffic to a broken API.
app.get('/health', async (_req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      message: 'Tharwah Capital API is running',
      messageAr: 'واجهة برمجة تطبيقات ثروة كابيتال تعمل',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: { auth: true, database: true, socketIO: true },
    });
  } catch {
    return res.status(503).json({ status: 'unavailable', message: 'Database is unavailable' });
  }
});

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/home', homeRoutes);
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
app.use('/api/platform-data', platformDataRoutes);
app.use('/api/stats', statsRoutes);

// Socket.io rooms are assigned from the verified access token only.
io.on('connection', (socket) => {
  const userId = socket.data.authenticated ? String(socket.data.userId) : '';
  const role = socket.data.authenticated ? String(socket.data.role) : '';

  if (userId) {
    const existing = userSockets.get(userId) || [];
    existing.push(socket.id);
    userSockets.set(userId, existing);
    socket.join(`user:${userId}`);
    socket.join(`client:${userId}`);
  }
  if (['super', 'admin', 'sub'].includes(role)) socket.join('admin_updates');

  // Kept for compatibility with the current UI; client supplied identities are ignored.
  socket.on('authenticate', () => undefined);
  socket.on('subscribe:admin_updates', () => {
    if (['super', 'admin', 'sub'].includes(role)) socket.join('admin_updates');
  });
  socket.on('subscribe:client_updates', () => {
    if (userId) socket.join(`client:${userId}`);
  });

  socket.on('disconnect', () => {
    if (!userId) return;
    const updated = (userSockets.get(userId) || []).filter((id) => id !== socket.id);
    if (updated.length) userSockets.set(userId, updated);
    else userSockets.delete(userId);
  });
});

app.use((_req, res) => res.status(404).json({ error: 'NotFound', message: 'المسار غير موجود' }));

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  const publicMessage = config.nodeEnv === 'production' ? 'حدث خطأ غير متوقع' : (err.message || 'حدث خطأ غير متوقع');
  return res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: publicMessage,
    messageEn: config.nodeEnv === 'production' ? 'An unexpected error occurred' : publicMessage,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
});

// Start server
server.listen(config.port, () => {
  console.info(`[Server] Tharwah Capital API running on port ${config.port}`);
  console.info(`[Server] Environment: ${config.nodeEnv}`);
  console.info(`[Server] CORS allowed origins: ${config.allowedOrigins.join(', ') || '(development defaults)'}`);
  console.info(`[Server] Database: ${config.databaseUrl ? 'configured' : 'NOT CONFIGURED'}`);
});

async function shutdown(signal: string) {
  console.info(`[Server] ${signal} received; shutting down`);
  const { prisma } = await import('./lib/prisma.js');
  io.close();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app, server, io };
