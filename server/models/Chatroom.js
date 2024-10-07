// Chatroom.js
const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    messages: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            content: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model("Chatroom", chatroomSchema);
