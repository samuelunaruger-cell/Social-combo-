const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect("mongodb://127.0.0.1:27017/socialapp");

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

/* ================= MODELS ================= */

const User = mongoose.model("User", {
  username: String,
  email: String,
  password: String
});

const Post = mongoose.model("Post", {
  user: String,
  text: String,
  image: String,
  video: String,
  likes: [String],
  comments: [{ user: String, text: String }]
});

/* ================= AUTH ================= */

app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: hash
  });
  res.json(user);
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.status(400).send("Invalid password");

  const token = jwt.sign({ id: user._id }, "SECRET");
  res.json({ token, username: user.username });
});

/* ================= POSTS ================= */

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});

const upload = multer({ storage });

app.post("/post", upload.single("media"), async (req, res) => {
  const post = await Post.create({
    user: req.body.user,
    text: req.body.text,
    image: req.file?.mimetype.startsWith("image") ? "/uploads/" + req.file.filename : "",
    video: req.file?.mimetype.startsWith("video") ? "/uploads/" + req.file.filename : ""
  });
  res.json(post);
});

app.get("/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

app.post("/like/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.likes.push(req.body.user);
  await post.save();
  res.json(post);
});

/* ================= CHAT ================= */

io.on("connection", socket => {
  socket.on("sendMessage", data => {
    io.emit("receiveMessage", data);
  });
});

server.listen(3000, () => console.log("Server running on 3000"));
