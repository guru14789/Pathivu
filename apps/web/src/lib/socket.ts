import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  auth: (cb) => {
    cb({ token: localStorage.getItem('bewell_token') });
  },
  autoConnect: false,
  reconnection: true,
});
