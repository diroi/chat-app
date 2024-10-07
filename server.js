const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

// Helper function to read JSON files
const readJsonFile = (filePath) => {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
};

// Helper function to write JSON files
const writeJsonFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readJsonFile(path.join(__dirname, 'data', 'users.json'));

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.userId = user.username; // Store username in session
    req.session.isAdmin = user.isAdmin || false; // Store admin status
    res.json({ success: true });
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const users = readJsonFile(path.join(__dirname, 'data', 'users.json'));

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, isAdmin: false };
    users.push(newUser);
    writeJsonFile(path.join(__dirname, 'data', 'users.json'), users);
    res.json({ success: true });
});

// Create room route
app.post('/create-room', (req, res) => {
    const { roomName } = req.body;
    const rooms = readJsonFile(path.join(__dirname, 'data', 'rooms.json'));

    if (!req.session.userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (rooms.find(r => r.name === roomName)) {
        return res.status(400).json({ success: false, message: 'Room already exists' });
    }

    rooms.push({ name: roomName });
    writeJsonFile(path.join(__dirname, 'data', 'rooms.json'), rooms);

    // Emit room creation to all clients
    io.emit('roomCreated', roomName);
    res.json({ success: true });
});

// Send message route
app.post('/send-message', async (req, res) => {
    const { room, message } = req.body;
    const messages = readJsonFile(path.join(__dirname, 'data', 'messages.json'));

    if (!req.session.userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const newMessage = { username: req.session.userId, message, room };
    messages.push(newMessage);
    writeJsonFile(path.join(__dirname, 'data', 'messages.json'), messages);

    // Emit the message to the specific room
    io.to(room).emit('receiveMessage', newMessage);
    res.json({ success: true });
});

// Get rooms route
app.get('/rooms', (req, res) => {
    const rooms = readJsonFile(path.join(__dirname, 'data', 'rooms.json'));
    res.json({ rooms: rooms.map(r => r.name) });
});

// Get messages route
app.get('/messages/:room', (req, res) => {
    const { room } = req.params;
    const messages = readJsonFile(path.join(__dirname, 'data', 'messages.json'));
    const roomMessages = messages.filter(msg => msg.room === room);
    res.json({ messages: roomMessages });
});

// Admin delete message route
app.post('/delete-message', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { messageId } = req.body;
    let messages = readJsonFile(path.join(__dirname, 'data', 'messages.json'));

    messages = messages.filter(msg => msg.id !== messageId);
    writeJsonFile(path.join(__dirname, 'data', 'messages.json'), messages);
    res.json({ success: true });
});

// Start the server
server.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on http://localhost:3000');
});
