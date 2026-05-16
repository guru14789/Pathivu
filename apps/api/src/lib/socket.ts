import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    
    if (user.role === 'super_admin') {
      socket.join('super_admin');
      logger.info(`Super Admin ${user.user_id} connected and joined super_admin room`);
    } else if (user.hospital_id) {
      socket.join(`hospital:${user.hospital_id}`);
      logger.info(`User ${user.user_id} connected and joined room: hospital:${user.hospital_id}`);
    }

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.user_id}`);
    });
  });

  return io;
}

export function emitToHospital(hospitalId: string, event: string, data: any) {
  if (!io) return;
  io.to(`hospital:${hospitalId}`).to('super_admin').emit(event, data);
}

export function emitToAll(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}
