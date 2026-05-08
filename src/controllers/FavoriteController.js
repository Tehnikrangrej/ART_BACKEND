const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Add artwork to favorites
// @route   POST /api/favorites/:artworkId
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const addFavorite = asyncHandler(async (req, res) => {
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

  // 3. Check if already favorited
  const existingFavorite = await prisma.favoriteArtwork.findUnique({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  if (existingFavorite) {
    res.status(400);
    throw new Error('Artwork already favorited');
  }

  // 4. Create favorite
  await prisma.favoriteArtwork.create({
    data: {
      userId,
      artworkId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Artwork added to favorites',
  });
});

// @desc    Remove artwork from favorites
// @route   DELETE /api/favorites/:artworkId
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const removeFavorite = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const userId = req.user.id;

  const favorite = await prisma.favoriteArtwork.findUnique({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  if (!favorite) {
    res.status(404);
    throw new Error('Favorite not found');
  }

  await prisma.favoriteArtwork.delete({
    where: {
      userId_artworkId: {
        userId,
        artworkId,
      },
    },
  });

  res.json({
    success: true,
    message: 'Artwork removed from favorites',
  });
});

// @desc    Get all favorite artworks for user
// @route   GET /api/favorites
// @access  Private (CLIENT, CLIENT_REPRESENTATIVE)
const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const favorites = await prisma.favoriteArtwork.findMany({
    where: { userId },
    include: {
      artwork: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    count: favorites.length,
    data: favorites.map((f) => f.artwork),
  });
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
