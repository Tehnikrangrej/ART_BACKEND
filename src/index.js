const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const artWorkRoutes = require('./routes/ArtWorkRoutes');
const enquiryRoutes = require('./routes/EnquiryRoutes');
const representativeRoutes = require('./routes/representativeRoutes');
const shareLinkRoutes = require('./routes/shareLinkRoutes');
const searchRoutes = require('./routes/SearchRoutes');
const favoriteRoutes = require('./routes/FavoriteRoutes');
const shortlistRoutes = require('./routes/ShortlistRoutes');
const relatedArtWorkRoutes = require('./routes/RelatedArtWorkRoutes');
const artworkVisibilityRoutes = require('./routes/ArtworkVisibilityRoutes');
const auditLogRoutes = require('./routes/AuditLogRoutes');
const loanRoutes = require('./routes/LoanRoutes');
const resourceRoutes = require('./routes/ResourceRoutes');
const collectionRoutes = require('./routes/CollectionRoutes');
const initCronJobs = require('./utils/cronJobs');

// ─── Middleware ───────────────────────────────────────────────────────────────
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const auditLogMiddleware = require('./middlewares/auditMiddleware');

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Audit Logger
app.use(auditLogMiddleware);

// Initialize background jobs
initCronJobs();

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkVisibilityRoutes);
app.use('/api/artworks', relatedArtWorkRoutes);
app.use('/api/artworks', artWorkRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/external-resources', resourceRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/representatives', representativeRoutes);
app.use('/api/share-links', shareLinkRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/shortlists', shortlistRoutes);


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

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
  });
}

module.exports = app;
