import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ChatMessage } from './types';

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Create Socket.IO server with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL instead of *
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB - Set outside the CORS config
});

// Store connected users
interface ConnectedUser {
  id: string;
  username: string;
}

const connectedUsers: ConnectedUser[] = [];

// Listen for socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user registration
  socket.on('register user', (username: string) => {
    const user: ConnectedUser = {
      id: socket.id,
      username
    };
    
    connectedUsers.push(user);
    console.log(`User registered: ${username} (${socket.id})`);
    
    // Broadcast the updated user list
    io.emit('user list', connectedUsers.map(u => ({ id: u.id, username: u.username })));
  });

  // Handle chat messages
  socket.on('chat message', (msg: ChatMessage) => {
    console.log(`Message received (${msg.type}):`, 
                msg.type === 'text' ? msg.text : '[Image data]');
    
    // For images, validate the data before broadcasting
    if (msg.type === 'image' && msg.imageData) {
      // Basic validation - ensure it starts with a data URL prefix
      if (!msg.imageData.startsWith('data:image/')) {
        console.log('Invalid image data received');
        return;
      }
      
      // Log image size for monitoring
      const sizeInKB = Math.round(msg.imageData.length / 1024);
      console.log(`Image size: ~${sizeInKB}KB`);
    }
    
    // Broadcast message to all connected clients
    io.emit('chat message', msg);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from connected users
    const index = connectedUsers.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      console.log(`User ${connectedUsers[index].username} disconnected`);
      connectedUsers.splice(index, 1);
      
      // Broadcast the updated user list
      io.emit('user list', connectedUsers.map(u => ({ id: u.id, username: u.username })));
    }
  });
});

// Define port
const PORT = process.env.PORT || 3001;

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Chat Server is running');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 