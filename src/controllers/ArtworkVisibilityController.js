const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get global artwork visibility settings
// @route   GET /api/artworks/visibility-settings
// @access  Private (SUPERADMIN, ADMIN)
const getVisibilitySettings = asyncHandler(async (req, res) => {
  let settings = await prisma.artworkVisibilitySettings.findUnique({
    where: { id: 'global-visibility' },
  });

  if (!settings) {
    // Create default if it doesn't exist
    settings = await prisma.artworkVisibilitySettings.create({
      data: { id: 'global-visibility' },
    });
  }

  res.json({
    success: true,
    data: settings,
  });
});

// @desc    Update global artwork visibility settings
// @route   POST /api/artworks/visibility-settings
// @access  Private (SUPERADMIN, ADMIN)
const updateVisibilitySettings = asyncHandler(async (req, res) => {
  const {
    showTitle,
    showArtist,
    showYear,
    showMedium,
    showDimensions,
    showProvenance,
    showLocation,
    showPeriod,
    showPrice,
    showPictures,
  } = req.body;

  const settings = await prisma.artworkVisibilitySettings.upsert({
    where: { id: 'global-visibility' },
    update: {
      ...(showTitle !== undefined && { showTitle }),
      ...(showArtist !== undefined && { showArtist }),
      ...(showYear !== undefined && { showYear }),
      ...(showMedium !== undefined && { showMedium }),
      ...(showDimensions !== undefined && { showDimensions }),
      ...(showProvenance !== undefined && { showProvenance }),
      ...(showLocation !== undefined && { showLocation }),
      ...(showPeriod !== undefined && { showPeriod }),
      ...(showPrice !== undefined && { showPrice }),
      ...(showPictures !== undefined && { showPictures }),
    },
    create: {
      id: 'global-visibility',
      showTitle: showTitle ?? true,
      showArtist: showArtist ?? true,
      showYear: showYear ?? true,
      showMedium: showMedium ?? true,
      showDimensions: showDimensions ?? true,
      showProvenance: showProvenance ?? true,
      showLocation: showLocation ?? true,
      showPeriod: showPeriod ?? true,
      showPrice: showPrice ?? true,
      showPictures: showPictures ?? true,
    },
  });

  res.json({
    success: true,
    message: 'Artwork visibility settings updated successfully.',
    data: settings,
  });
});

module.exports = {
  getVisibilitySettings,
  updateVisibilitySettings,
};
