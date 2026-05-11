const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getPagination } = require('../utils/pagination');
const { filterArtworkFields } = require('../utils/artworkFilter');

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

  const { role, id: userId } = req.user;
  const AND = [];

  // --- Role-Aware Filtering ---
  // If CLIENT or REPRESENTATIVE, only show artworks they have access to
  if (role === 'CLIENT' || role === 'CLIENT_REPRESENTATIVE') {
    AND.push({
      userAccess: {
        some: {
          userId: userId,
        },
      },
    });
  }

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

  // --- Pagination ---
  const { page, limit, skip } = getPagination(req.query);

  const [artWorks, total] = await Promise.all([
    prisma.artWork.findMany({
      where: AND.length > 0 ? { AND } : {},
      orderBy: { [sortField]: sortOrder },
      include: {
        userAccess: {
          select: { userId: true }
        }
      },
      skip,
      take: limit,
    }),
    prisma.artWork.count({
      where: AND.length > 0 ? { AND } : {},
    }),
  ]);

  const filteredArtWorks = await filterArtworkFields(artWorks, role);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    appliedFilters: req.query,
    data: filteredArtWorks,
  });
});

// @desc    Find user by email (Global lookup)
// @route   GET /api/search/users
// @access  SUPERADMIN, ADMIN, CLIENT, CLIENT_REPRESENTATIVE
const searchUsers = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email to search.');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      parentId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.json({
      success: true,
      message: 'No user found with this email.',
      data: null,
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

module.exports = { searchArtWorks, searchUsers };
