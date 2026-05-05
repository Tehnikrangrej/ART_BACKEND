const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// @desc    Search and filter artworks via query params (schema fields only)
// @route   GET /api/search
// @access  Public
//
// Supported query params (all from ArtWork schema):
//   title      → partial, case-insensitive
//   artist     → partial, case-insensitive
//   medium     → partial, case-insensitive
//   dimensions → partial, case-insensitive
//   provenance → partial, case-insensitive
//   location   → partial, case-insensitive
//   year       → exact year  e.g. ?year=2026
//   minYear    → from year   e.g. ?minYear=2000
//   maxYear    → to year     e.g. ?maxYear=2026
//   minPrice   → e.g. ?minPrice=1000
//   maxPrice   → e.g. ?maxPrice=500000
//   sortBy     → createdAt | price | year | title | artist (default: createdAt)
//   order      → asc | desc (default: desc)

const searchArtWorks = asyncHandler(async (req, res) => {
  const {
    title,
    artist,
    medium,
    dimensions,
    provenance,
    location,
    year,
    minYear,
    maxYear,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  const AND = [];

  // --- Text field filters (partial, case-insensitive) ---
  if (title)      AND.push({ title:      { contains: title,      mode: 'insensitive' } });
  if (artist)     AND.push({ artist:     { contains: artist,     mode: 'insensitive' } });
  if (medium)     AND.push({ medium:     { contains: medium,     mode: 'insensitive' } });
  if (dimensions) AND.push({ dimensions: { contains: dimensions, mode: 'insensitive' } });
  if (provenance) AND.push({ provenance: { contains: provenance, mode: 'insensitive' } });
  if (location)   AND.push({ location:   { contains: location,   mode: 'insensitive' } });

  // --- Year filters ---
  if (year) {
    const y = parseInt(year);
    AND.push({
      year: {
        gte: new Date(`${y}-01-01T00:00:00.000Z`),
        lte: new Date(`${y}-12-31T23:59:59.999Z`),
      },
    });
  } else {
    if (minYear) AND.push({ year: { gte: new Date(`${parseInt(minYear)}-01-01T00:00:00.000Z`) } });
    if (maxYear) AND.push({ year: { lte: new Date(`${parseInt(maxYear)}-12-31T23:59:59.999Z`) } });
  }

  // --- Price filters ---
  if (minPrice) AND.push({ price: { gte: parseFloat(minPrice) } });
  if (maxPrice) AND.push({ price: { lte: parseFloat(maxPrice) } });

  // --- Validate sort ---
  const allowedSortFields = ['createdAt', 'price', 'year', 'title', 'artist'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  const artWorks = await prisma.artWork.findMany({
    where: AND.length > 0 ? { AND } : {},
    orderBy: { [sortField]: sortOrder },
  });

  res.json({
    success: true,
    count: artWorks.length,
    appliedFilters: req.query,
    data: artWorks,
  });
});

module.exports = { searchArtWorks };
