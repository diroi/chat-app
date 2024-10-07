const API_URL = "http://localhost:5000/api";

// Login function
document.getElementById("login").onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        document.getElementById("auth").style.display = "none";
        document.getElementById("chatroom").style.display = "block";
        loadChatrooms();  // Load chatrooms after login
    } else {
        alert(data.message);
    }
};

// Load chatrooms
async function loadChatrooms() {
    const response = await fetch(`${API_URL}/chatrooms`, {
        headers: {
            Authorization: localStorage.getItem("token"),
        },
    });

    const chatrooms = await response.json();
    const chatroomsList = document.getElementById("chatroomsList");
    chatroomsList.innerHTML = ""; // Clear the current list

    chatrooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room.name;
        li.onclick = () => enterChatroom(room._id); // Click to enter chatroom
        chatroomsList.appendChild(li);
    });
}

// Enter a specific chatroom
async function enterChatroom(chatroomId) {
    const response = await fetch(`${API_URL}/chatrooms/${chatroomId}`, {
        headers: {
            Authorization: localStorage.getItem("token"),
        },
    });

    const chatroom = await response.json();
    const chatContainer = document.createElement("div");
    chatContainer.innerHTML = `<h3>${chatroom.name}</h3>`;

    chatroom.messages.forEach((message) => {
        const messageElement = document.createElement("p");
        messageElement.innerText = `${message.user.username}: ${message.content}`;
        chatContainer.appendChild(messageElement);
    });

    const messageInput = document.createElement("input");
    messageInput.placeholder = "Type a message";
    const sendButton = document.createElement("button");
    sendButton.innerText = "Send";

    sendButton.onclick = async () => {
        const content = messageInput.value;
        await fetch(`${API_URL}/chatrooms/${chatroomId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: localStorage.getItem("token"),
            },
            body: JSON.stringify({ content }),
        });
        messageInput.value = ""; // Clear input
        loadChatrooms(); // Reload messages
    };

    chatContainer.appendChild(messageInput);
    chatContainer.appendChild(sendButton);
    document.body.appendChild(chatContainer);
}

// Create chatroom function
document.getElementById("createChatroom").onclick = async () => {
    const chatroomName = document.getElementById("chatroomName").value;

    const response = await fetch(`${API_URL}/chatrooms`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ name: chatroomName, users: [] }), // You can add selected users later
    });

    const data = await response.json();
    if (data) {
        alert("Chatroom created successfully!");
        document.getElementById("chatroomName").value = ""; // Clear input
        loadChatrooms(); // Reload chatrooms
    }
};
