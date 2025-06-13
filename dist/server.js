"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
// Create Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// ✅ CORS Configuration
const FRONTEND_ORIGIN = 'https://chat-front-git-main-deekshithas-projects-ea8c1bc7.vercel.app';
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
}));
// ✅ Socket.IO Server with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true
    },
    maxHttpBufferSize: 1e7 // 10MB
});
const connectedUsers = [];
// Socket Connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Register user
    socket.on('register user', (username) => {
        const user = {
            id: socket.id,
            username
        };
        connectedUsers.push(user);
        console.log(`User registered: ${username} (${socket.id})`);
        io.emit('user list', connectedUsers.map(u => ({ id: u.id, username: u.username })));
    });
    // Handle chat messages
    socket.on('chat message', (msg) => {
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
