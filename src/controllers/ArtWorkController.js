const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// Helper: parse pictureUrls from body (can be string or array)
const parsePictureUrls = (pictureUrls) => {
  if (!pictureUrls) return [];
  const urls = Array.isArray(pictureUrls) ? pictureUrls : [pictureUrls];
  return urls.filter((url) => url && url.trim() !== '');
};

// @desc    Create a new ArtWork
// @route   POST /api/artworks
// @access  Private
const createArtWork = asyncHandler(async (req, res) => {
  const { artist, title, year, medium, dimensions, provenance, location, pictureUrls, price } = req.body;

  if (!artist || !title || !year || !medium || !price) {
    res.status(400);
    throw new Error('Please provide all required fields (artist, title, year, medium, price).');
  }

  const artWork = await prisma.artWork.create({
    data: {
      artist,
      title,
      year: new Date(year),
      medium,
      dimensions,
      provenance,
      location,
      Pictures: parsePictureUrls(pictureUrls),
      price: parseFloat(price),
    },
  });

  res.status(201).json({
    success: true,
    message: 'ArtWork created successfully.',
    data: artWork,
  });
});

// @desc    Get all ArtWorks
// @route   GET /api/artworks
// @access  Public
const getAllArtWorks = asyncHandler(async (req, res) => {
  const artWorks = await prisma.artWork.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    count: artWorks.length,
    data: artWorks,
  });
});

// @desc    Get single ArtWork by ID
// @route   GET /api/artworks/:id
// @access  Public
const getArtWorkById = asyncHandler(async (req, res) => {
  const artWork = await prisma.artWork.findUnique({
    where: { id: req.params.id },
  });

  if (!artWork) {
    res.status(404);
    throw new Error('ArtWork not found.');
  }

  res.json({
    success: true,
    data: artWork,
  });
});

// @desc    Update an ArtWork
// @route   PUT /api/artworks/:id
// @access  Private
const updateArtWork = asyncHandler(async (req, res) => {
  const { artist, title, year, medium, dimensions, provenance, location, pictureUrls, price } = req.body;

  const artWorkExists = await prisma.artWork.findUnique({
    where: { id: req.params.id },
  });

  if (!artWorkExists) {
    res.status(404);
    throw new Error('ArtWork not found.');
  }

  // If pictureUrls are provided, replace existing. Otherwise keep existing.
  const updatedPictures = pictureUrls !== undefined
    ? parsePictureUrls(pictureUrls)
    : artWorkExists.Pictures;

  const updatedArtWork = await prisma.artWork.update({
    where: { id: req.params.id },
    data: {
      artist,
      title,
      year: year ? new Date(year) : undefined,
      medium,
      dimensions,
      provenance,
      location,
      Pictures: updatedPictures,
      price: price ? parseFloat(price) : undefined,
    },
  });

  res.json({
    success: true,
    message: 'ArtWork updated successfully.',
    data: updatedArtWork,
  });
});

// @desc    Delete an ArtWork
// @route   DELETE /api/artworks/:id
// @access  Private
const deleteArtWork = asyncHandler(async (req, res) => {
  const artWorkExists = await prisma.artWork.findUnique({
    where: { id: req.params.id },
  });

  if (!artWorkExists) {
    res.status(404);
    throw new Error('ArtWork not found.');
  }

  await prisma.artWork.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'ArtWork removed successfully.',
  });
});

module.exports = {
  createArtWork,
  getAllArtWorks,
  getArtWorkById,
  updateArtWork,
  deleteArtWork,
};
