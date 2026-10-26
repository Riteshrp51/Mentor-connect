import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  maxHttpBufferSize: 5e7, // 50MB for media/attachments
});

// Attach io to Express app for use in routes/controllers
app.set('io', io);

// Middleware with 50MB limits for base64 file payloads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory active video call rooms: roomCode -> Map(socketId -> { user, socketId })
const videoRooms = new Map();

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  // Join a user's personal room for real-time notifications and alerts
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('leave_user', (userId) => {
    if (userId) {
      socket.leave(`user_${userId}`);
    }
  });

  // Join a specific conversation room
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`);
    }
  });

  // Leave a specific conversation room
  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
    }
  });

  // User typing indicator
  socket.on('typing', ({ conversationId, user }) => {
    if (conversationId) {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        user,
      });
    }
  });

  // User stopped typing
  socket.on('stop_typing', ({ conversationId, user }) => {
    if (conversationId) {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        user,
      });
    }
  });

  // Direct socket message sending (alternative to REST)
  socket.on('send_message', async (payload, callback) => {
    try {
      const { conversationId, senderId, text, attachments = [] } = payload;
      if (!conversationId || !senderId) return;

      const trimmedText = typeof text === 'string' ? text.trim() : '';
      if (!trimmedText && attachments.length === 0) return;

      let summaryText = trimmedText;
      if (!summaryText && attachments.length > 0) {
        const firstAtt = attachments[0];
        if (firstAtt.mediaType === 'image') summaryText = '📷 Photo';
        else if (firstAtt.mediaType === 'video') summaryText = '🎥 Video';
        else if (firstAtt.mediaType === 'pdf') summaryText = '📄 PDF Document';
        else summaryText = `📎 ${firstAtt.fileName || 'Attachment'}`;
      }

      const newMessage = await Message.create({
        conversationId,
        sender: senderId,
        text: trimmedText,
        attachments,
        readBy: [senderId],
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          text: summaryText,
          sender: senderId,
          sentAt: new Date(),
        },
      });

      const populatedMessage = await Message.findById(newMessage._id).populate(
        'sender',
        'name email role profileImage'
      );

      // Broadcast to room
      io.to(`conversation_${conversationId}`).emit('receive_message', populatedMessage);

      io.emit('conversation_updated', {
        conversationId,
        lastMessage: {
          text: summaryText,
          sender: senderId,
          sentAt: new Date(),
        },
        message: populatedMessage,
      });

      if (typeof callback === 'function') {
        callback({ status: 'success', data: populatedMessage });
      }
    } catch (err) {
      console.error('Socket message error:', err);
      if (typeof callback === 'function') {
        callback({ status: 'error', message: err.message });
      }
    }
  });

  // =========================================================================
  // WebRTC Real-Time Video Call Signaling
  // =========================================================================
  socket.on('join_video_room', ({ roomCode, user }) => {
    if (!roomCode) return;
    const formattedCode = roomCode.trim().toLowerCase();
    const roomName = `video_room_${formattedCode}`;
    socket.join(roomName);

    if (!videoRooms.has(formattedCode)) {
      videoRooms.set(formattedCode, new Map());
    }
    const roomMap = videoRooms.get(formattedCode);
    roomMap.set(socket.id, { user, socketId: socket.id });

    // Send list of existing peers in the room to newly joined user
    const existingPeers = Array.from(roomMap.values()).filter((p) => p.socketId !== socket.id);
    socket.emit('call_room_users', { peers: existingPeers });

    // Notify others in room that a peer joined
    socket.to(roomName).emit('peer_joined_call', {
      socketId: socket.id,
      user,
    });
  });

  // Relay WebRTC signaling: SDP Offer, SDP Answer, ICE Candidates
  socket.on('call_user_signal', ({ toSocketId, signal, fromUser, roomCode }) => {
    if (!toSocketId) return;
    io.to(toSocketId).emit('receive_call_signal', {
      signal,
      fromSocketId: socket.id,
      fromUser,
      roomCode,
    });
  });

  // Relay mic/camera toggles to peer
  socket.on('call_media_toggle', ({ roomCode, mediaType, enabled }) => {
    if (!roomCode) return;
    const formattedCode = roomCode.trim().toLowerCase();
    socket.to(`video_room_${formattedCode}`).emit('peer_media_toggled', {
      socketId: socket.id,
      mediaType,
      enabled,
    });
  });

  // In-call real-time text chat message
  socket.on('send_call_message', ({ roomCode, message }) => {
    if (!roomCode) return;
    const formattedCode = roomCode.trim().toLowerCase();
    io.to(`video_room_${formattedCode}`).emit('receive_call_message', message);
  });

  // User manually leaves video room
  socket.on('leave_video_room', ({ roomCode }) => {
    if (!roomCode) return;
    const formattedCode = roomCode.trim().toLowerCase();
    const roomName = `video_room_${formattedCode}`;
    socket.leave(roomName);

    if (videoRooms.has(formattedCode)) {
      const roomMap = videoRooms.get(formattedCode);
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        videoRooms.delete(formattedCode);
      }
    }

    socket.to(roomName).emit('peer_left_call', {
      socketId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    // Automatically clean up any video rooms this socket was in
    for (const [code, roomMap] of videoRooms.entries()) {
      if (roomMap.has(socket.id)) {
        roomMap.delete(socket.id);
        io.to(`video_room_${code}`).emit('peer_left_call', {
          socketId: socket.id,
        });
        if (roomMap.size === 0) {
          videoRooms.delete(code);
        }
      }
    }
  });
});

// Mount Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running healthy with WebSockets enabled',
    timestamp: new Date(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', mentorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  let error = { ...err };
  error.message = err.message;

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(409).json({
      status: 'error',
      message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message,
    });
  }

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running with WebSockets on port ${PORT}`);
});
