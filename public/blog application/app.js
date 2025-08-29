const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Session + Flash
app.use(session({
  secret: "blogSecret",
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

// Pass flash messages globally to all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// In-memory storage
let posts = [];
let idCounter = 1;

// Routes

// Home page
app.get("/", (req, res) => {
  res.render("index", { posts });
});

// New post form
app.get("/posts/new", (req, res) => {
  res.render("new");
});

// Create post
app.post("/posts", (req, res) => {
  const { title, content, category, tags } = req.body;
  if (!title || !content) {
    req.flash("error", "Title and Content are required!");
    return res.redirect("/posts/new");
  }
  posts.push({
    id: idCounter++,
    title,
    content,
    category,
    tags: tags ? tags.split(",").map(t => t.trim()) : [],
    comments: []
  });
  req.flash("success", "Post created successfully!");
  res.redirect("/");
});

// View single post
app.get("/posts/:id", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id == id);
  if (!post) {
    req.flash("error", "Post not found!");
    return res.redirect("/");
  }
  res.render("show", { post });
});

// Edit post form
app.get("/posts/:id/edit", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id == id);
  if (!post) {
    req.flash("error", "Post not found!");
    return res.redirect("/");
  }
  res.render("edit", { post });
});

// Update post
app.put("/posts/:id", (req, res) => {
  const { id } = req.params;
  const { title, content, category, tags } = req.body;
  const post = posts.find(p => p.id == id);
  if (!post) {
    req.flash("error", "Post not found!");
    return res.redirect("/");
  }
  post.title = title;
  post.content = content;
  post.category = category;
  post.tags = tags ? tags.split(",").map(t => t.trim()) : [];
  req.flash("success", "Post updated successfully!");
  res.redirect("/");
});

// Delete post
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  const lengthBefore = posts.length;
  posts = posts.filter(p => p.id != id);
  if (posts.length === lengthBefore) {
    req.flash("error", "Post not found!");
  } else {
    req.flash("success", "Post deleted successfully!");
  }
  res.redirect("/");
});

// Add comment to a post
app.post("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { name, text } = req.body;
  const post = posts.find(p => p.id == id);
  if (!post) {
    req.flash("error", "Post not found!");
    return res.redirect("/");
  }
  if (!name || !text) {
    req.flash("error", "Both name and comment are required!");
    return res.redirect(`/posts/${id}`);
  }
  post.comments.push({ name, text });
  req.flash("success", "Comment added!");
  res.redirect(`/posts/${id}`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("404");
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});