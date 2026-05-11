const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parsePictures = (pictureUrls) => {
  if (!pictureUrls) return [];
  const urls = Array.isArray(pictureUrls) ? pictureUrls : [pictureUrls];
  return urls.map((u) => u.trim()).filter(Boolean);
};


// ─── ADMIN / SUPERADMIN ───────────────────────────────────────────────────────

// @desc    Create a new artwork
// @route   POST /api/artworks
// @access  SUPERADMIN, ADMIN
const createArtWork = asyncHandler(async (req, res) => {
  const { title, artist, year, medium, dimensions, provenance, location, pictureUrls, price } =
    req.body;

  if (!title || !artist || !year || !medium || !price) {
    res.status(400);
    throw new Error('Required fields: title, artist, year, medium, price.');
  }

  const pictures = parsePictures(pictureUrls);

  const artwork = await prisma.artWork.create({
    data: {
      title,
      artist,
      year: new Date(year),
      medium,
      dimensions: dimensions || null,
      provenance: provenance || null,
      location: location || null,
      pictures,
      price: parseFloat(price),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Artwork created successfully.',
    data: artwork,
  });
});

// @desc    Get all artworks (Role-aware)
// @route   GET /api/artworks
// @access  SUPERADMIN, ADMIN (all); CLIENT, CLIENT_REPRESENTATIVE (assigned only)
const getAllArtWorks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { artist, title } = req.query;
  const { role, id: userId } = req.user;

  // Build the filter
  const where = {
    ...(artist && { artist: { contains: artist, mode: 'insensitive' } }),
    ...(title && { title: { contains: title, mode: 'insensitive' } }),
  };

  // If CLIENT or REPRESENTATIVE, only show artworks they have access to
  if (role === 'CLIENT' || role === 'CLIENT_REPRESENTATIVE') {
    where.userAccess = {
      some: {
        userId: userId
      }
    };
  }

  const [artworks, total] = await Promise.all([
    prisma.artWork.findMany({
      where,
      include: {
        userAccess: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.artWork.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: artworks,
  });
});

// @desc    Get single artwork by ID
// @route   GET /api/artworks/:id
// @access  SUPERADMIN, ADMIN (full); CLIENT/REP (only if they have access)
const getArtWorkById = asyncHandler(async (req, res) => {
  const artwork = await prisma.artWork.findUnique({
    where: { id: req.params.id },
    include: {
      userAccess: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    }
  });

  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  const { role, id: userId } = req.user;

  // SUPERADMIN and ADMIN see all
  if (role === 'SUPERADMIN' || role === 'ADMIN') {
    return res.json({ success: true, data: artwork });
  }

  // CLIENT / CLIENT_REPRESENTATIVE — verify access
  const access = await prisma.artWorkAccess.findUnique({
    where: { userId_artworkId: { userId, artworkId: req.params.id } },
  });

  if (!access) {
    res.status(403);
    throw new Error('You Do not Have access to This Artwork');
  }

  res.json({ success: true, data: artwork });
});

// @desc    Update an artwork
// @route   PUT /api/artworks/:id
// @access  SUPERADMIN, ADMIN
const updateArtWork = asyncHandler(async (req, res) => {
  const { title, artist, year, medium, dimensions, provenance, location, pictureUrls, price } =
    req.body;

  const existing = await prisma.artWork.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  const pictures = pictureUrls !== undefined
    ? parsePictures(pictureUrls)
    : existing.pictures;

  const updated = await prisma.artWork.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(artist && { artist }),
      ...(year && { year: new Date(year) }),
      ...(medium && { medium }),
      ...(dimensions !== undefined && { dimensions }),
      ...(provenance !== undefined && { provenance }),
      ...(location !== undefined && { location }),
      pictures,
      ...(price && { price: parseFloat(price) }),
    },
  });

  res.json({
    success: true,
    message: 'Artwork updated successfully.',
    data: updated,
  });
});

// @desc    Delete an artwork
// @route   DELETE /api/artworks/:id
// @access  SUPERADMIN, ADMIN
const deleteArtWork = asyncHandler(async (req, res) => {
  const existing = await prisma.artWork.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  await prisma.artWork.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: 'Artwork deleted successfully.' });
});

// @desc    Assign artwork access to a CLIENT
// @route   POST /api/artworks/:id/assign-to-client
// @access  SUPERADMIN, ADMIN
const assignArtworkToClient = asyncHandler(async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('clientId is required.');
  }

  const [artwork, client] = await Promise.all([
    prisma.artWork.findUnique({ where: { id: req.params.id } }),
    prisma.user.findUnique({ where: { id: clientId } }),
  ]);

  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  if (!client || (client.role !== 'CLIENT' && client.role !== 'CLIENT_REPRESENTATIVE')) {
    res.status(400);
    throw new Error('Target user must be an existing CLIENT or CLIENT_REPRESENTATIVE.');
  }

  // Upsert — idempotent
  const access = await prisma.artWorkAccess.upsert({
    where: { userId_artworkId: { userId: clientId, artworkId: req.params.id } },
    create: { userId: clientId, artworkId: req.params.id, grantedBy: req.user.id },
    update: { grantedBy: req.user.id },
  });

  res.status(201).json({
    success: true,
    message: `Artwork "${artwork.title}" assigned to user ${client.name || client.email}.`,
    data: access,
  });
});

// @desc    Revoke artwork access from a CLIENT (and all their representatives)
// @route   DELETE /api/artworks/:id/revoke-from-client/:clientId
// @access  SUPERADMIN, ADMIN
const revokeArtworkFromClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const artworkId = req.params.id;

  const access = await prisma.artWorkAccess.findUnique({
    where: { userId_artworkId: { userId: clientId, artworkId } },
  });

  if (!access) {
    res.status(404);
    throw new Error('No access record found for this client and artwork.');
  }

  // Find all representatives belonging to this client
  const reps = await prisma.user.findMany({
    where: { parentId: clientId, role: 'CLIENT_REPRESENTATIVE' },
    select: { id: true },
  });

  const repIds = reps.map((r) => r.id);

  // Perform revocation in a transaction
  await prisma.$transaction([
    // 1. Revoke from the Client
    prisma.artWorkAccess.delete({
      where: { userId_artworkId: { userId: clientId, artworkId } },
    }),
    // 2. Revoke from all their representatives
    prisma.artWorkAccess.deleteMany({
      where: {
        artworkId,
        userId: { in: repIds },
      },
    }),
  ]);

  res.json({
    success: true,
    message: 'Artwork access revoked from client and all their representatives.'
  });
});

// ─── CLIENT ───────────────────────────────────────────────────────────────────

// @desc    Assign one of CLIENT's accessible artworks to their representative
// @route   POST /api/artworks/:id/assign-to-representative
// @access  CLIENT
const assignArtworkToRepresentative = asyncHandler(async (req, res) => {
  const { representativeId } = req.body;
  const artworkId = req.params.id;
  const clientId = req.user.id;

  if (!representativeId) {
    res.status(400);
    throw new Error('representativeId is required.');
  }

  // 1. Verify access (Clients must have access to assign; Admins are checked against the parent Client)
  const rep = await prisma.user.findUnique({ where: { id: representativeId } });

  if (!rep || rep.role !== 'CLIENT_REPRESENTATIVE') {
    res.status(400);
    throw new Error('Target user must be a CLIENT_REPRESENTATIVE.');
  }

  const parentClientId = rep.parentId;
  if (!parentClientId) {
    res.status(400);
    throw new Error('This representative does not have an associated parent Client.');
  }

  // Check if the parent Client has access to this artwork
  const parentAccess = await prisma.artWorkAccess.findUnique({
    where: { userId_artworkId: { userId: parentClientId, artworkId } },
  });

  if (!parentAccess) {
    res.status(403);
    throw new Error('The parent Client does not have access to this artwork. Assign it to the Client first.');
  }

  // 2. If requester is a CLIENT, verify they are the parent of this representative
  if (req.user.role === 'CLIENT' && req.user.id !== parentClientId) {
    res.status(403);
    throw new Error('You can only manage access for your own representatives.');
  }

  // 3. Grant access (idempotent upsert)
  const access = await prisma.artWorkAccess.upsert({
    where: { userId_artworkId: { userId: representativeId, artworkId } },
    create: { userId: representativeId, artworkId, grantedBy: clientId },
    update: { grantedBy: clientId },
  });

  res.status(201).json({
    success: true,
    message: `Artwork assigned to representative ${rep.name || rep.email}.`,
    data: access,
  });
});

// @desc    Revoke artwork access from a representative
// @route   DELETE /api/artworks/:id/revoke-from-representative/:representativeId
// @access  CLIENT
const revokeArtworkFromRepresentative = asyncHandler(async (req, res) => {
  const { representativeId } = req.params;
  const artworkId = req.params.id;
  const clientId = req.user.id;

  // Confirm rep exists and is a representative
  const rep = await prisma.user.findUnique({ where: { id: representativeId } });

  if (!rep || rep.role !== 'CLIENT_REPRESENTATIVE') {
    res.status(400);
    throw new Error('Target user must be a CLIENT_REPRESENTATIVE.');
  }

  // If not Admin, verify the representative belongs to this CLIENT
  if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
    if (rep.parentId !== clientId) {
      res.status(403);
      throw new Error('You can only manage access for your own representatives.');
    }
  }

  const access = await prisma.artWorkAccess.findUnique({
    where: { userId_artworkId: { userId: representativeId, artworkId } },
  });

  if (!access) {
    res.status(404);
    throw new Error('No access record found for this representative and artwork.');
  }

  await prisma.artWorkAccess.delete({
    where: { userId_artworkId: { userId: representativeId, artworkId } },
  });

  res.json({ success: true, message: 'Artwork access revoked from representative.' });
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createArtWork,
  getAllArtWorks,
  getArtWorkById,
  updateArtWork,
  deleteArtWork,
  assignArtworkToClient,
  revokeArtworkFromClient,
  assignArtworkToRepresentative,
  revokeArtworkFromRepresentative,
};
