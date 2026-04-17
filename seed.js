const mongoose = require("mongoose");
const Movie = require("./models/Movie");

const MONGO_URI =
  "mongodb://movie-ticketing:hnqB8drowHuphovh@ac-ld4tn1l-shard-00-00.fk0tuga.mongodb.net:27017,ac-ld4tn1l-shard-00-01.fk0tuga.mongodb.net:27017,ac-ld4tn1l-shard-00-02.fk0tuga.mongodb.net:27017/movie-ticketing?ssl=true&replicaSet=atlas-fuz2k5-shard-0&authSource=admin&appName=Cluster0";

const movies = [
  // ── Action ──────────────────────────────────────────────────
  {
    title: "The Dark Knight",
    genre: "Action",
    duration: "2h 32min",
    rating: "9.0",
    image: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
  },
  {
    title: "Mad Max: Fury Road",
    genre: "Action",
    duration: "2h 0min",
    rating: "8.1",
    image: "https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
  },
  {
    title: "John Wick: Chapter 4",
    genre: "Action",
    duration: "2h 49min",
    rating: "7.7",
    image: "https://m.media-amazon.com/images/I/81J1DaRKzUL._AC_UF1000,1000_QL80_.jpg",
  },
  {
    title: "Top Gun: Maverick",
    genre: "Action",
    duration: "2h 10min",
    rating: "8.2",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7AZJLBnfncPn_k2T5E_OrazQqX8UI12SxY1KPyEKxfewCECxqeHsJ-lg6d0rmFNGm_0nxHV3Wc2GQ1-6n57ZWyMHdpeiB_BKJo4JmGyk&s=10",
  },

  // ── Sci-Fi ─────────────────────────────────────────────────
  {
    title: "Interstellar",
    genre: "Sci-Fi",
    duration: "2h 49min",
    rating: "8.7",
    image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  },
  {
    title: "Inception",
    genre: "Sci-Fi",
    duration: "2h 28min",
    rating: "8.8",
    image: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
  },
  {
    title: "Dune: Part Two",
    genre: "Sci-Fi",
    duration: "2h 46min",
    rating: "8.5",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlXYygOwUS-QqRMrcbhIZdRaDHv8T-HnDzYg&s",
  },
  {
    title: "The Matrix",
    genre: "Sci-Fi",
    duration: "2h 16min",
    rating: "8.7",
    image: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  },

  // ── Drama ──────────────────────────────────────────────────
  {
    title: "The Shawshank Redemption",
    genre: "Drama",
    duration: "2h 22min",
    rating: "9.3",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXYxegbZsXxQxur_mGoQt7iUm3silnrULg4A&s",
  },
  {
    title: "Oppenheimer",
    genre: "Drama",
    duration: "3h 0min",
    rating: "8.3",
    image: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  },
  {
    title: "The Godfather",
    genre: "Drama",
    duration: "2h 55min",
    rating: "9.2",
    image: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  },
  {
    title: "Forrest Gump",
    genre: "Drama",
    duration: "2h 22min",
    rating: "8.8",
    image: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
  },

  // ── Horror ─────────────────────────────────────────────────
  {
    title: "Get Out",
    genre: "Horror",
    duration: "1h 44min",
    rating: "7.7",
    image: "https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyNl5BMl5BanBnXkFtZTgwNzcwMzc0MTI@._V1_FMjpg_UX1000_.jpg",
  },
  {
    title: "A Quiet Place",
    genre: "Horror",
    duration: "1h 30min",
    rating: "7.5",
    image: "https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg",
  },
  {
    title: "The Conjuring",
    genre: "Horror",
    duration: "1h 52min",
    rating: "7.5",
    image: "https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg",
  },

  // ── Comedy ─────────────────────────────────────────────────
  {
    title: "The Grand Budapest Hotel",
    genre: "Comedy",
    duration: "1h 39min",
    rating: "8.1",
    image: "https://m.media-amazon.com/images/I/91tOvvGoEnL._AC_UF1000,1000_QL80_.jpg",
  },
  {
    title: "Superbad",
    genre: "Comedy",
    duration: "1h 53min",
    rating: "7.6",
    image: "https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg",
  },
  {
    title: "The Hangover",
    genre: "Comedy",
    duration: "1h 40min",
    rating: "7.7",
    image: "https://m.media-amazon.com/images/I/91Z8lOMpS+L._AC_UF1000,1000_QL80_.jpg",
  },

  // ── Animation ──────────────────────────────────────────────
  {
    title: "Spider-Man: Across the Spider-Verse",
    genre: "Animation",
    duration: "2h 20min",
    rating: "8.7",
    image: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
  },
  {
    title: "Inside Out 2",
    genre: "Animation",
    duration: "1h 36min",
    rating: "7.6",
    image: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
  },

  // ── Thriller ───────────────────────────────────────────────
  {
    title: "Parasite",
    genre: "Thriller",
    duration: "2h 12min",
    rating: "8.5",
    image: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  },
  {
    title: "Gone Girl",
    genre: "Thriller",
    duration: "2h 29min",
    rating: "8.1",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSayGefu_g2kYBpke5uyLrwN3PMj53i0En4tlqXJpkVb--4ZpoxIMzXTwCaMCtpPfgPKx7TtKOz_pSRMoARrdIxSinm5k24pDrTT3z6FsM&s=10",
  },
  {
    title: "Shutter Island",
    genre: "Thriller",
    duration: "2h 18min",
    rating: "8.2",
    image: "https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg",
  },

  // ── Romance ────────────────────────────────────────────────
  {
    title: "La La Land",
    genre: "Romance",
    duration: "2h 8min",
    rating: "8.0",
    image: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
  },
  {
    title: "The Notebook",
    genre: "Romance",
    duration: "2h 3min",
    rating: "7.8",
    image: "https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing movies
    const deleted = await Movie.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing movies`);

    // Insert seed data
    const inserted = await Movie.insertMany(movies);
    console.log(`🎬 Seeded ${inserted.length} movies successfully!\n`);

    // Print summary by genre
    const genres = {};
    inserted.forEach((m) => {
      genres[m.genre] = (genres[m.genre] || 0) + 1;
    });
    console.log("── Summary ─────────────────────────────");
    Object.entries(genres).forEach(([genre, count]) => {
      console.log(`   ${genre}: ${count} movies`);
    });
    console.log("────────────────────────────────────────\n");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
