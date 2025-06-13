import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ChatMessage } from './types';

// Create Express app
const app = express();
const server = http.createServer(app);

// ✅ Allowed Frontend URLs
const allowedOrigins = [
  'https://chat-front-git-main-deekshithas-projects-ea8c1bc7.vercel.app',
  'https://chat-front-black.vercel.app'
];

// ✅ CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// ✅ Socket.IO Server with CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e7 // 10MB
});

// User Type
interface ConnectedUser {
  id: string;
  username: string;
}

const connectedUsers: ConnectedUser[] = [];

// Socket Connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Register user
  socket.on('register user', (username: string) => {
    const user: ConnectedUser = {
      id: socket.id,
      username
    };

    connectedUsers.push(user);
    console.log(`User registered: ${username} (${socket.id})`);

    io.emit('user list', connectedUsers.map(u => ({ id: u.id, username: u.username })));
  });

  // Handle chat messages
  socket.on('chat message', (msg: ChatMessage) => {
    console.log(`Message received (${msg.type}):`, msg.type === 'text' ? msg.text : '[Image data]');

    if (msg.type === 'image' && msg.imageData) {
      if (!msg.imageData.startsWith('data:image/')) {
        console.log('Invalid image data received');
        return;
      }

      const sizeInKB = Math.round(msg.imageData.length / 1024);
      console.log(`Image size: ~${sizeInKB}KB`);
    }

    io.emit('chat message', msg);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    const index = connectedUsers.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      console.log(`User ${connectedUsers[index].username} disconnected`);
      connectedUsers.splice(index, 1);
      io.emit('user list', connectedUsers.map(u => ({ id: u.id, username: u.username })));
    }
  });
});

// Health route
app.get('/', (req, res) => {
  res.send('Chat Server is running');
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
