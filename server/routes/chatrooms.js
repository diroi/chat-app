// chatrooms.js
const express = require("express");
const Chatroom = require("../models/Chatroom");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).send("A token is required for authentication");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send("Invalid Token");
        req.user = decoded;
        next();
    });
};

// Create chatroom
router.post("/", verifyToken, async (req, res) => {
    const chatroom = new Chatroom(req.body);
    await chatroom.save();
    res.status(201).json(chatroom);
});

// Delete chatroom (admin only)
router.delete("/:id", verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send("Forbidden");
    await Chatroom.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

module.exports = router;
