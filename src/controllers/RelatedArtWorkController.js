const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// @desc    Get related artworks based on admin-configured settings
// @route   GET /api/artworks/:id/related
// @access  Private (Role-aware)
const getRelatedArtWorks = asyncHandler(async (req, res) => {
  const artworkId = req.params.id;
  const { id: userId, role } = req.user;

  // 1. Get current artwork
  const currentArtwork = await prisma.artWork.findUnique({
    where: { id: artworkId },
  });

  if (!currentArtwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }

  // 2. Verify logged-in user has access to this artwork (unless Admin)
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
    const access = await prisma.artWorkAccess.findUnique({
      where: {
        userId_artworkId: {
          userId,
          artworkId,
        },
      },
    });

    if (!access) {
      res.status(403);
      throw new Error('You do not have access to this artwork');
    }
  }

  // 3. Load RelatedWorkSettings (fetch the latest one or create default)
  let settings = await prisma.relatedWorkSettings.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.relatedWorkSettings.create({
      data: {
        matchArtist: true,
        matchMedium: true,
        matchPeriod: false,
      },
    });
  }

  // 4. Dynamically generate OR conditions based on enabled settings
  const orConditions = [];

  if (settings.matchArtist && currentArtwork.artist) {
    orConditions.push({ artist: currentArtwork.artist });
  }

  if (settings.matchMedium && currentArtwork.medium) {
    orConditions.push({ medium: currentArtwork.medium });
  }

  if (settings.matchPeriod && currentArtwork.period) {
    orConditions.push({ period: currentArtwork.period });
  }

  if (settings.matchLocation && currentArtwork.location) {
    orConditions.push({ location: currentArtwork.location });
  }

  if (settings.matchProvenance && currentArtwork.provenance) {
    orConditions.push({ provenance: currentArtwork.provenance });
  }

  // If no matching criteria are enabled, we might want to return nothing or most recent
  if (orConditions.length === 0) {
    return res.json({
      success: true,
      data: [],
    });
  }

  // 5. Fetch related artworks ONLY from artworks user can access
  const where = {
    AND: [
      { id: { not: artworkId } }, // Exclude current artwork
      { OR: orConditions },       // Apply dynamic matching
    ],
  };

  // Multi-tenant Access Security: Filter by ArtworkAccess for non-admins
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
    where.AND.push({
      userAccess: {
        some: {
          userId: userId,
        },
      },
    });
  }

  const relatedArtworks = await prisma.artWork.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    count: relatedArtworks.length,
    settingsUsed: {
      matchArtist: settings.matchArtist,
      matchMedium: settings.matchMedium,
      matchPeriod: settings.matchPeriod,
      matchLocation: settings.matchLocation,
      matchProvenance: settings.matchProvenance,
    },
    data: relatedArtworks,
  });
});

// @desc    Update Related Artwork Settings
// @route   POST /api/artworks/related-settings
// @access  Private (Admin only)
const updateRelatedWorkSettings = asyncHandler(async (req, res) => {
  const { matchArtist, matchMedium, matchPeriod, matchLocation, matchProvenance } = req.body;

  const settings = await prisma.relatedWorkSettings.create({
    data: {
      matchArtist: matchArtist !== undefined ? matchArtist : true,
      matchMedium: matchMedium !== undefined ? matchMedium : true,
      matchPeriod: matchPeriod !== undefined ? matchPeriod : false,
      matchLocation: matchLocation !== undefined ? matchLocation : false,
      matchProvenance: matchProvenance !== undefined ? matchProvenance : false,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Related work settings updated successfully',
    data: settings,
  });
});

module.exports = {
  getRelatedArtWorks,
  updateRelatedWorkSettings,
};
