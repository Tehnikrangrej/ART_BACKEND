const ResourceService = require('../services/resourceService');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// @desc    Add external resource
// @route   POST /api/external-resources
// @access  Private (ADMIN, SUPERADMIN)
const addResource = asyncHandler(async (req, res) => {
  const resource = await ResourceService.createResource(req.body, req.user.id);
  
  res.status(201).json({
    success: true,
    message: 'External resource added successfully.',
    data: resource,
  });
});

// @desc    Get resources (general, or filtered by artwork/collection)
// @route   GET /api/external-resources
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = {
    artworkId: req.query.artworkId,
    collectionId: req.query.collectionId,
    type: req.query.type,
    isActive: req.query.isActive,
  };

  const { resources, total } = await ResourceService.getResources(filters, { skip, take: limit });

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: resources,
  });
});

// @desc    Get resources for specific artwork
// @route   GET /api/artworks/:id/external-resources
const getArtworkResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = { artworkId: req.params.id, isActive: 'true' };
  
  const { resources, total } = await ResourceService.getResources(filters, { skip, take: limit });

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: resources,
  });
});

// @desc    Get resources for specific collection
// @route   GET /api/collections/:id/external-resources
const getCollectionResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = { collectionId: req.params.id, isActive: 'true' };
  
  const { resources, total } = await ResourceService.getResources(filters, { skip, take: limit });

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: resources,
  });
});

// @desc    Update resource
// @route   PUT /api/external-resources/:id
const updateResource = asyncHandler(async (req, res) => {
  const resource = await ResourceService.updateResource(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Resource updated successfully.',
    data: resource,
  });
});

// @desc    Delete resource
// @route   DELETE /api/external-resources/:id
const deleteResource = asyncHandler(async (req, res) => {
  await ResourceService.deleteResource(req.params.id);
  
  res.json({
    success: true,
    message: 'Resource deleted successfully.',
  });
});

module.exports = {
  addResource,
  getResources,
  getArtworkResources,
  getCollectionResources,
  updateResource,
  deleteResource,
};
