import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = import.meta.env.VITE_SOCKET_URL;

export const newSocket = io(URL, {
  autoConnect: false,
  auth: {},
});