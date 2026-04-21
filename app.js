require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const User = require("./models/User");
const Movie = require("./models/Movie");
const Booking = require("./models/Booking");

const app = express();
const PORT = 5000;
const JWT_SECRET = "cinemapro-secret-key-2026";
const MONGO_URI =
  "mongodb://movie-ticketing:hnqB8drowHuphovh@ac-ld4tn1l-shard-00-00.fk0tuga.mongodb.net:27017,ac-ld4tn1l-shard-00-01.fk0tuga.mongodb.net:27017,ac-ld4tn1l-shard-00-02.fk0tuga.mongodb.net:27017/movie-ticketing?ssl=true&replicaSet=atlas-fuz2k5-shard-0&authSource=admin&appName=Cluster0";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const SEAT_PRICE_INR = 250;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

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
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
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

app.get("/login", (req, res) => {
  if (res.locals.user) return res.redirect("/");
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !(await user.comparePassword(password))) {
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

  const existingUser = await User.findOne({
    email: email.trim().toLowerCase(),
  });
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
  res.render("booking", {
    movie,
    bookedSeats: movie.bookedSeats || [],
    razorpayKeyId: RAZORPAY_KEY_ID,
    seatPrice: SEAT_PRICE_INR,
  });
});

// create a Razorpay order
app.post("/create-order", requireAuth, async (req, res) => {
  const { movieId, seatIds } = req.body;

  if (!Array.isArray(seatIds) || seatIds.length === 0)
    return res
      .status(400)
      .json({ success: false, message: "No seats selected" });

  const movie = await Movie.findById(movieId).catch(() => null);
  if (!movie)
    return res.status(400).json({ success: false, message: "Movie not found" });

  const bookedSet = new Set(movie.bookedSeats || []);
  const unavailableSeats = seatIds.filter((id) => bookedSet.has(id));
  if (unavailableSeats.length > 0)
    return res.status(400).json({
      success: false,
      message:
        "Some seats are no longer available. Please select different seats.",
    });

  const amount = seatIds.length * SEAT_PRICE_INR * 100; // Convert to paise

  try {
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `cp_${Date.now()}`,
      notes: {
        movieId: movieId,
        movieTitle: movie.title,
        seatIds: seatIds.join(","),
        userId: res.locals.user.id,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
});

// book seat
app.post("/verify-payment", requireAuth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    movieId,
    seatIds,
  } = req.body;
  const user = res.locals.user;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Missing payment details" });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No seats selected" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Payment verification failed. Invalid signature.",
    });
  }

  const movie = await Movie.findById(movieId).catch(() => null);
  if (!movie)
    return res.status(400).json({ success: false, message: "Movie not found" });

  const bookedSet = new Set(movie.bookedSeats || []);
  const unavailableSeats = seatIds.filter((id) => bookedSet.has(id));
  if (unavailableSeats.length > 0)
    return res.status(400).json({
      success: false,
      message:
        "Some seats are no longer available. Payment received — please contact support for a refund.",
    });

  const updateResult = await Movie.findByIdAndUpdate(
    movieId,
    { $addToSet: { bookedSeats: { $each: seatIds } } },
    { new: true },
  );

  const newBookedSet = new Set(updateResult.bookedSeats || []);
  const allSeatsBooked = seatIds.every((id) => newBookedSet.has(id));
  if (!allSeatsBooked) {
    await Movie.findByIdAndUpdate(movieId, {
      $pullAll: { bookedSeats: seatIds },
    });
    return res.status(400).json({
      success: false,
      message:
        "Some seats were just booked by another user. Payment received — please contact support for a refund.",
    });
  }

  const totalPrice = seatIds.length * SEAT_PRICE_INR;
  const booking = await Booking.create({
    movieId: movie._id,
    movieTitle: movie.title,
    userId: user.id,
    name: user.name,
    email: user.email,
    seats: seatIds.length,
    seatIds: seatIds,
    totalPrice: totalPrice,
    bookingDate: new Date().toLocaleDateString(),
    bookingTime: new Date().toLocaleTimeString(),
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    paymentStatus: "paid",
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

  res.render("ticket", { booking, seatPrice: SEAT_PRICE_INR });
});

app.get("/admin", requireAdmin, async (req, res) => {
  const movies = await Movie.find();
  const bookings = await Booking.find();
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice * 1.1, 0);
  res.render("admin", { movies, bookings, totalRevenue });
});

app.post("/api/movie", requireAdmin, async (req, res) => {
  const { title, genre, duration, rating, image } = req.body;
  if (!title || !genre || !duration || !rating)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const newMovie = await Movie.create({
    title,
    genre,
    duration,
    rating,
    image: image || "",
  });
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
