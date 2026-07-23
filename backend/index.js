// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import passport from 'passport';
// import mongoose from 'mongoose';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import compression from 'compression';

// import authRoutes from './routes/auth.js';
// import productRoutes from './routes/products.js';
// import categoryRoutes from './routes/categories.js';
// import searchRoutes from './routes/search.js';
// import siteImageRoutes, { adminRouter as adminSiteImages } from './routes/siteImages.js';
// import orderRoutes, { adminRouter as adminOrders } from './routes/orders.js';
// import questionRoutes, { adminRouter as adminQuestions } from './routes/questions.js';
// import chatRoutes, { adminRouter as adminChat } from './routes/chat.js';
// import notificationRoutes from './routes/notifications.js';
// import userRoutes, { adminRouter as adminUsers } from './routes/users.js';
// import statsRoutes from './routes/stats.js';
// import faqRoutes from './routes/faqs.js';
// import reviewRoutes from './routes/reviews.js';
// import shippingRoutes from './routes/shipping.js';
// import { verifyTokenString } from './utils/jwt.js';
// import { isEmailEnabled } from './utils/email.js';

// const app = express();
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: [
//       'http://localhost:5173',
//       'http://localhost:5000',
//       'https://dierashop.com',
//       'https://www.dierashop.com'
//     ],
//     credentials: true
//   },
// });

// app.set('io', io);

// // CORS configuration - supports both localhost and production
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:5000',
//   'https://dierashop.com',
//   'https://www.dierashop.com'
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps, curl, Postman)
//       if (!origin) return callback(null, true);
      
//       if (allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.warn('⚠️  CORS blocked origin:', origin);
//         // Allow anyway for development - in production you may want to reject
//         callback(null, true);
//       }
//     },
//     credentials: true,
//   })
// );
// app.use(compression()); // Enable gzip compression for faster data transfer
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(passport.initialize());

// app.get('/api/health', (_req, res) => res.json({ ok: true }));

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/site-images', siteImageRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/questions', questionRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/faqs', faqRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/shipping-rates', shippingRoutes);

// app.use('/api/admin/site-images', adminSiteImages);
// app.use('/api/admin/orders', adminOrders);
// app.use('/api/admin/questions', adminQuestions);
// app.use('/api/admin/chat', adminChat);
// app.use('/api/admin/users', adminUsers);
// app.use('/api/admin/stats', statsRoutes);

// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(500).json({ error: err.message || 'Internal server error' });
// });

// io.on('connection', (socket) => {
//   const token = socket.handshake.auth?.token;
//   if (token) {
//     try {
//       const user = verifyTokenString(token);
//       socket.join(`user:${user.id}`);
//       socket.data.user = user;
//     } catch {
//       /* guest */
//     }
//   }

//   socket.on('join_conversation', (conversationId) => {
//     socket.join(`conversation:${conversationId}`);
//   });

//   socket.on('leave_conversation', (conversationId) => {
//     socket.leave(`conversation:${conversationId}`);
//   });

//   socket.on('disconnect', () => {});
// });

// const PORT = process.env.PORT || 5000;

// const shutdown = (signal) => {
//   console.log(`${signal} received — closing server…`);
//   httpServer.close(() => {
//     mongoose.connection.close(false).then(() => process.exit(0));
//   });
//   setTimeout(() => process.exit(1), 5000).unref();
// };

// process.on('SIGTERM', () => shutdown('SIGTERM'));
// process.on('SIGINT', () => shutdown('SIGINT'));

// mongoose
//   .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dierashop', {
//     dbName: 'dierashop',
//     // Performance optimizations
//     maxPoolSize: 20, // Increase pool size for better concurrent handling
//     minPoolSize: 5,  // Keep more idle connections ready
//     socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
//     serverSelectionTimeoutMS: 5000, // Timeout after 5s trying to pick a server
//     compressors: 'zlib', // Enable wire protocol compression
//     // Additional Atlas optimizations
//     retryWrites: true,
//     w: 'majority',
//     readPreference: 'primaryPreferred', // Allow reads from secondaries if primary is slow
//   })
//   .then(() => {
//     console.log('MongoDB connected');
//     httpServer.on('error', (err) => {
//       if (err.code === 'EADDRINUSE') {
//         console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value in backend/.env`);
//         console.error(`Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
//       } else {
//         console.error('Server error:', err.message);
//       }
//       process.exit(1);
//     });
//     httpServer.listen(PORT, () => {
//       console.log(`Diera Shop API on :${PORT}`);
//       console.log('\n🌐 CORS ALLOWED ORIGINS:');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//       allowedOrigins.forEach(origin => console.log(`  ✓ ${origin}`));
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('\n📧 EMAIL CONFIGURATION:');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log(`Provider: ${process.env.EMAIL_PROVIDER || 'NOT SET'}`);
//       console.log(`Service ID: ${process.env.EMAILJS_SERVICE_ID ? '✓ SET' : '✗ NOT SET'}`);
//       console.log(`Template ID: ${process.env.EMAILJS_TEMPLATE_ID ? '✓ SET' : '✗ NOT SET'}`);
//       console.log(`Public Key: ${process.env.EMAILJS_PUBLIC_KEY ? '✓ SET' : '✗ NOT SET'}`);
//       console.log(`Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? '✓ SET (optional)' : '✗ NOT SET (optional)'}`);
//       console.log(`Status: ${isEmailEnabled() ? '✅ EmailJS ENABLED - Emails will be sent' : '⚠️  CONSOLE MODE - OTP codes print in terminal'}`);
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
//     });
//   })
//   .catch((err) => {
//     console.error('MongoDB connection failed:', err.message);
//     process.exit(1);
//   });


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import searchRoutes from './routes/search.js';
import siteImageRoutes, { adminRouter as adminSiteImages } from './routes/siteImages.js';
import orderRoutes, { adminRouter as adminOrders } from './routes/orders.js';
import questionRoutes, { adminRouter as adminQuestions } from './routes/questions.js';
import chatRoutes, { adminRouter as adminChat } from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes, { adminRouter as adminUsers } from './routes/users.js';
import statsRoutes from './routes/stats.js';
import faqRoutes from './routes/faqs.js';
import reviewRoutes from './routes/reviews.js';
import shippingRoutes from './routes/shipping.js';
import uploadRoutes from './routes/upload.js';
import { verifyTokenString } from './utils/jwt.js';
import { isEmailEnabled } from './utils/email.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5000',
      'https://dierashop.com',
      'https://www.dierashop.com'
    ],
    credentials: true
  },
});

app.set('io', io);

// CORS configuration - supports both localhost and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://dierashop.com',
  'https://www.dierashop.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS blocked origin:', origin);
        // Allow anyway for development - in production you may want to reject
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(compression()); // Enable gzip compression for faster data transfer
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/site-images', siteImageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/shipping-rates', shippingRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/api/admin/site-images', adminSiteImages);
app.use('/api/admin/orders', adminOrders);
app.use('/api/admin/questions', adminQuestions);
app.use('/api/admin/chat', adminChat);
app.use('/api/admin/users', adminUsers);
app.use('/api/admin/stats', statsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const user = verifyTokenString(token);
      socket.join(`user:${user.id}`);
      socket.data.user = user;
    } catch {
      /* guest */
    }
  }

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;

const shutdown = (signal) => {
  console.log(`${signal} received — closing server…`);
  httpServer.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dierashop', {
    dbName: 'dierashop',
    // Performance optimizations
    maxPoolSize: 20, // Increase pool size for better concurrent handling
    minPoolSize: 5,  // Keep more idle connections ready
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    serverSelectionTimeoutMS: 5000, // Timeout after 5s trying to pick a server
    compressors: 'zlib', // Enable wire protocol compression
    // Additional Atlas optimizations
    retryWrites: true,
    w: 'majority',
    readPreference: 'primaryPreferred', // Allow reads from secondaries if primary is slow
  })
  .then(() => {
    console.log('MongoDB connected');
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value in backend/.env`);
        console.error(`Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
    httpServer.listen(PORT, () => {
      console.log(`Diera Shop API on :${PORT}`);
      console.log('\n🌐 CORS ALLOWED ORIGINS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      allowedOrigins.forEach(origin => console.log(`  ✓ ${origin}`));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📧 EMAIL CONFIGURATION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Provider: ${process.env.EMAIL_PROVIDER || 'NOT SET'}`);
      console.log(`Service ID: ${process.env.EMAILJS_SERVICE_ID ? '✓ SET' : '✗ NOT SET'}`);
      console.log(`Template ID: ${process.env.EMAILJS_TEMPLATE_ID ? '✓ SET' : '✗ NOT SET'}`);
      console.log(`Public Key: ${process.env.EMAILJS_PUBLIC_KEY ? '✓ SET' : '✗ NOT SET'}`);
      console.log(`Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? '✓ SET (optional)' : '✗ NOT SET (optional)'}`);
      console.log(`Status: ${isEmailEnabled() ? '✅ EmailJS ENABLED - Emails will be sent' : '⚠️  CONSOLE MODE - OTP codes print in terminal'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
