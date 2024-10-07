// Ensure you include the correct connection for Socket.IO
const socket = io('http://127.0.0.1:3000'); // Correctly connect to the socket server

// DOM elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const chatContainer = document.getElementById('chatContainer');
const roomContainer = document.getElementById('roomContainer');
const messageInput = document.getElementById('messageInput');
const messageForm = document.getElementById('messageForm');
const roomForm = document.getElementById('roomForm');
const messagesList = document.getElementById('messagesList');

// Handle login
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (result.success) {
        alert('Login successful!');
        loadRooms();
        chatContainer.style.display = 'block';
    } else {
        alert(result.message);
    }
});

// Handle signup
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = signupForm.username.value;
    const password = signupForm.password.value;

    const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (result.success) {
        alert('Signup successful! You can log in now.');
    } else {
        alert(result.message);
    }
});

// Handle room creation
roomForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const roomName = roomForm.roomName.value;

    const response = await fetch('/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
    });

    const result = await response.json();
    if (result.success) {
        alert('Room created successfully!');
        loadRooms();
    } else {
        alert(result.message);
    }
});

// Load chat rooms
async function loadRooms() {
    const response = await fetch('/rooms');
    const result = await response.json();

    roomContainer.innerHTML = '';
    result.rooms.forEach((room) => {
        const roomDiv = document.createElement('div');
        roomDiv.textContent = room;
        roomDiv.addEventListener('click', () => {
            loadMessages(room);
        });
        roomContainer.appendChild(roomDiv);
    });
}

// Load messages for a specific room
async function loadMessages(room) {
    const response = await fetch(`/messages/${room}`);
    const result = await response.json();

    messagesList.innerHTML = '';
    result.messages.forEach((msg) => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${msg.username}: ${msg.message}`;
        messagesList.appendChild(messageDiv);
    });

    // Join the room in Socket.IO
    socket.emit('joinRoom', room);
}

// Send message
messageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageInput.value;
    const room = roomContainer.querySelector('.active-room')?.textContent;

    if (room) {
        const response = await fetch('/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room, message }),
        });

        const result = await response.json();
        if (result.success) {
            messageInput.value = ''; // Clear input
        } else {
            alert(result.message);
        }
    } else {
        alert('Please select a room to send a message.');
    }
});

// Socket.io event handlers
socket.on('roomCreated', (roomName) => {
    const roomDiv = document.createElement('div');
    roomDiv.textContent = roomName;
    roomDiv.addEventListener('click', () => {
        loadMessages(roomName);
    });
    roomContainer.appendChild(roomDiv);
});

socket.on('receiveMessage', (msg) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${msg.username}: ${msg.message}`;
    messagesList.appendChild(messageDiv);
});

// Event to highlight selected room
roomContainer.addEventListener('click', (event) => {
    const rooms = roomContainer.children;
    for (let room of rooms) {
        room.classList.remove('active-room');
    }
    event.target.classList.add('active-room');
});
