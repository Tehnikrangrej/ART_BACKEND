const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');
const { filterArtworkFields } = require('../utils/artworkFilter');

// @desc    Add artwork to shortlist
// @route   POST /api/shortlists/:artworkId
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const addToShortlist = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const userId = req.user.id;

  // 1. Verify artwork existence
  const artwork = await prisma.artWork.findUnique({
    where: { id: artworkId },
  });

  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }

  // 2. Verify user has access to the artwork
  const hasAccess = await prisma.artWorkAccess.findUnique({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  if (!hasAccess) {
    res.status(403);
    throw new Error('You do not have access to this artwork');
  }

  // 3. Check if already shortlisted
  const existingShortlist = await prisma.shortlistedArtwork.findUnique({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  if (existingShortlist) {
    res.status(400);
    throw new Error('Artwork already shortlisted');
  }

  // 4. Create shortlist entry
  await prisma.shortlistedArtwork.create({
    data: {
      userId,
      artworkId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Artwork added to shortlist',
  });
});

// @desc    Remove artwork from shortlist
// @route   DELETE /api/shortlists/:artworkId
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const removeFromShortlist = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const userId = req.user.id;

  const shortlist = await prisma.shortlistedArtwork.findUnique({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  if (!shortlist) {
    res.status(404);
    throw new Error('Shortlist record not found');
  }

  await prisma.shortlistedArtwork.delete({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  res.json({
    success: true,
    message: 'Artwork removed from shortlist',
  });
});

// @desc    Get all shortlisted artworks for user
// @route   GET /api/shortlists
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const getShortlistedArtworks = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, skip } = getPagination(req.query);

  const [shortlists, total] = await Promise.all([
    prisma.shortlistedArtwork.findMany({
      where: { userId },
      include: {
        artwork: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.shortlistedArtwork.count({ where: { userId } }),
  ]);

  const artworks = shortlists.map((s) => s.artwork);
  const filteredArtworks = await filterArtworkFields(artworks, req.user.role);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: filteredArtworks,
  });
});

module.exports = {
  addToShortlist,
  removeFromShortlist,
  getShortlistedArtworks,
};
