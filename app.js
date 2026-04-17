const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const User = require("./models/User");
const Movie = require("./models/Movie");
const Booking = require("./models/Booking");

const app = express();
const PORT = 3000;
const JWT_SECRET = "cinemapro-secret-key-2026";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cinemapro";

app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");

// ── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Seed default admin user if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        name: "Admin User",
        email: "admin@cinema.com",
        password: "admin123",
        role: "admin",
      });
      await User.create({
        name: "John Doe",
        email: "john@example.com",
        password: "john123",
        role: "user",
      });
      console.log("🌱 Seeded default users (admin@cinema.com / admin123)");
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Auth Middleware ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, JWT_SECRET);
    } catch {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
  );
}

function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  if (res.locals.user) return next();
  res.cookie("returnTo", req.originalUrl, { httpOnly: true });
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  const user = res.locals.user;
  if (user && user.role === "admin") return next();
  if (!user) {
    res.cookie("returnTo", req.originalUrl, { httpOnly: true });
    return res.redirect("/login");
  }
  return res
    .status(403)
    .render("404", { message: "Access denied. Admin privileges required." });
}

// ── Auth Routes ──────────────────────────────────────────────────────────────
app.get("/login", (req, res) => {
  if (res.locals.user) return res.redirect("/");
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) {
    return res.render("login", { error: "Invalid email or password" });
  }

  setTokenCookie(res, signToken(user));

  const returnTo = req.cookies.returnTo || "/";
  res.clearCookie("returnTo");
  res.redirect(returnTo);
});

app.get("/register", (req, res) => {
  if (res.locals.user) return res.redirect("/");
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password)
    return res.render("register", { error: "All fields are required" });
  if (password !== confirmPassword)
    return res.render("register", { error: "Passwords do not match" });
  if (password.length < 4)
    return res.render("register", {
      error: "Password must be at least 4 characters",
    });

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser)
    return res.render("register", { error: "Email already registered" });

  const newUser = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: "user",
  });

  setTokenCookie(res, signToken(newUser));

  const returnTo = req.cookies.returnTo || "/";
  res.clearCookie("returnTo");
  res.redirect(returnTo);
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// ── Page Routes ──────────────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  const movies = await Movie.find();
  const genres = [...new Set(movies.map((m) => m.genre))];
  res.render("index", { movies, genres });
});

app.get("/movie/:id", requireAuth, async (req, res) => {
  const movie = await Movie.findById(req.params.id).catch(() => null);
  if (!movie)
    return res.status(404).render("404", { message: "Movie not found" });
  res.render("booking", { movie });
});

app.post("/book", requireAuth, async (req, res) => {
  const { movieId, seats } = req.body;
  const movie = await Movie.findById(movieId).catch(() => null);
  const user = res.locals.user;

  if (!movie)
    return res.status(400).json({ success: false, message: "Movie not found" });

  const booking = await Booking.create({
    movieId: movie._id,
    movieTitle: movie.title,
    userId: user.id,
    name: user.name,
    email: user.email,
    seats: parseInt(seats),
    totalPrice: parseInt(seats) * 12,
    bookingDate: new Date().toLocaleDateString(),
    bookingTime: new Date().toLocaleTimeString(),
  });

  res.json({ success: true, bookingId: booking._id });
});

app.get("/ticket/:id", requireAuth, async (req, res) => {
  const booking = await Booking.findById(req.params.id).catch(() => null);
  if (!booking)
    return res.status(404).render("404", { message: "Booking not found" });

  const user = res.locals.user;
  if (user.role !== "admin" && booking.userId.toString() !== user.id)
    return res
      .status(403)
      .render("404", { message: "Access denied. This is not your ticket." });

  res.render("ticket", { booking });
});

// ── Admin Routes ─────────────────────────────────────────────────────────────
app.get("/admin", requireAdmin, async (req, res) => {
  const movies = await Movie.find();
  const bookings = await Booking.find();
  const totalRevenue = bookings.reduce((sum, b) => sum + b.seats * 12 * 1.1, 0);
  res.render("admin", { movies, bookings, totalRevenue });
});

app.post("/api/movie", requireAdmin, async (req, res) => {
  const { title, genre, duration, rating } = req.body;
  if (!title || !genre || !duration || !rating)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const newMovie = await Movie.create({ title, genre, duration, rating });
  res.json({
    success: true,
    message: "Movie added successfully",
    movie: newMovie,
  });
});

app.delete("/api/movie/:id", requireAdmin, async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id).catch(() => null);
  if (!movie)
    return res.status(404).json({ success: false, message: "Movie not found" });

  res.json({
    success: true,
    message: "Movie deleted successfully",
    movie,
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

app.listen(PORT, () => {
  console.log(`🎬 CinemaPro running on http://localhost:${PORT}`);
});
