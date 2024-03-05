const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const http = require('http');
const cors = require('cors');
const userSocketMap = {};
const app = express();
const PORT = 3016;

// MongoDB connection
mongoose.connect('mongodb+srv://syscon:sysconLSS@cluster0.azodb4j.mongodb.net/sysconLSS');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schema definitions
const chatSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  senderId: Number,
  receiverId: Number,
  message: String,
  isSeen: String,
  messageDateTime: String,
  isDeleted: { type: Number, default: 0 },
});

const ChatHistory = mongoose.model('ChatHistory', chatSchema, 'tblChatHistory');

const chatUserSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  userId: Number,
  userName: String,
  password: String,
  emailId: String,
  isDeleted: { type: Number, default: 0 },
});

const ChatUser = mongoose.model('ChatUser', chatUserSchema, 'tblChatUsers');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.get('/api/chatHistory', async (req, res) => {
  try {
    const users = await ChatHistory.find();

    res.status(200).send({
      success: true,
      message: "Chat data fetched successfully.",
      data: users
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong....!",
      data: error.message
    });
  }
});

app.get('/api/chatUser/chatUsers', async (req, res) => {
  try {
    const users = await ChatUser.find();

    res.status(200).send({
      success: true,
      message: "Chat users fetched successfully.",
      data: users
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong....!",
      data: error.message
    });
  }
});
// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('send message', (message) => {
    // Assuming messageData contains {senderId, receiverId, message}
    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      // Send to specific user
      io.to(receiverSocketId).emit('receive message', message);
    }
  });
});
