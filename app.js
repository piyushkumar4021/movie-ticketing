const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.set('view engine', 'ejs');

let movies = [
  {
    id: 1,
    title: "The Matrix Reloaded",
    genre: "Sci-Fi",
    duration: "138 min",
    rating: "8.0/10",
    image: "https://m.media-amazon.com/images/M/MV5BNjAxYjkxNjktYTU0YS00NjFhLWIyMDEtMzEzMTJjMzRkMzQ1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
  },
  {
    id: 2,
    title: "Inception",
    genre: "Sci-Fi/Thriller",
    duration: "148 min",
    rating: "8.8/10",
    image: "https://m.media-amazon.com/images/M/MV5BZjhkNjM0ZTMtNGM5MC00ZTQ3LTk3YmYtZTkzYzdiNWE0ZTA2XkEyXkFqcGc@._V1_.jpg"
  },
  {
    id: 3,
    title: "The Dark Knight",
    genre: "Action/Crime",
    duration: "152 min",
    rating: "9.0/10",
    image: "https://i.redd.it/z19ndjd7m2ac1.jpeg"
  },
  {
    id: 4,
    title: "Interstellar",
    genre: "Sci-Fi/Drama",
    duration: "169 min",
    rating: "8.6/10",
    image: "https://m.media-amazon.com/images/I/81pbgU7wG-L._AC_UF1000,1000_QL80_.jpg"
  }
];

let bookings = [];

let movieIdCounter = 5;

let bookingIdCounter = 1;

app.get('/', (req, res) => {
  res.render('index', { movies: movies });
});

app.get('/movie/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) {
    return res.status(404).render('404', { message: 'Movie not found' });
  }
  res.render('booking', { movie: movie });
});

app.post('/book', (req, res) => {
  const { movieId, name, email, seats } = req.body;
  const movie = movies.find(m => m.id === parseInt(movieId));
  
  if (!movie) {
    return res.status(400).json({ success: false, message: 'Movie not found' });
  }

  const booking = {
    id: bookingIdCounter++,
    movieId: parseInt(movieId),
    movieTitle: movie.title,
    name: name,
    email: email,
    seats: parseInt(seats),
    totalPrice: parseInt(seats) * 12, // $12 per seat
    bookingDate: new Date().toLocaleDateString(),
    bookingTime: new Date().toLocaleTimeString()
  };

  bookings.push(booking);
  res.json({ success: true, bookingId: booking.id });
});

app.get('/ticket/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  if (!booking) {
    return res.status(404).render('404', { message: 'Booking not found' });
  }
  res.render('ticket', { booking: booking });
});


app.get('/admin', (req, res) => {
  res.render('admin', { movies: movies, bookings: bookings });
});

app.post('/api/movie', (req, res) => {
  const { title, genre, duration, rating } = req.body;

  if (!title || !genre || !duration || !rating) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const newMovie = {
    id: movieIdCounter++,
    title: title,
    genre: genre,
    duration: duration,
    rating: rating,
    image: `https://via.placeholder.com/300x450/1a1a1a/aaaaaa?text=${encodeURIComponent(title)}`
  };

  movies.push(newMovie);
  res.json({ success: true, message: 'Movie added successfully', movie: newMovie });
});

app.delete('/api/movie/:id', (req, res) => {
  const movieId = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === movieId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const deletedMovie = movies.splice(index, 1)[0];
  res.json({ success: true, message: 'Movie deleted successfully', movie: deletedMovie });
});

app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found' });
});


app.listen(PORT, () => {
  console.log(`Movie Ticketing System running on http://localhost:${PORT}`);
});
