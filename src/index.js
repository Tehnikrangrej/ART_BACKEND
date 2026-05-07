const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const artWorkRoutes = require('./routes/ArtWorkRoutes');
const enquiryRoutes = require('./routes/EnquiryRoutes');
const representativeRoutes = require('./routes/representativeRoutes');

// ─── Middleware ───────────────────────────────────────────────────────────────
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artWorkRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/representatives', representativeRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Art Collection Client Portal API is running.',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
});
