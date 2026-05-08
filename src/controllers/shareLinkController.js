const prisma = require('../prismaClient');
const crypto = require('crypto');

/**
 * @desc    Create a new artwork share link
 * @route   POST /api/share-links
 * @access  Private (CLIENT & CLIENT_REPRESENTATIVE)
 */
const createShareLink = async (req, res, next) => {
  try {
    const { artworkIds, expiresInHours, userIds } = req.body;

    // 1. Validation
    if (!artworkIds || !Array.isArray(artworkIds) || artworkIds.length === 0) {
      res.status(400);
      return next(new Error('Please provide at least one artwork ID.'));
    }

    if (!expiresInHours || typeof expiresInHours !== 'number' || expiresInHours <= 0) {
      res.status(400);
      return next(new Error('Please provide a valid expiry time in hours.'));
    }

    // 2. Verify User access to ALL requested artworks
    const { role: userRole, id: userId } = req.user;

    // SUPERADMIN and ADMIN can share any artwork
    if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      const userAccess = await prisma.artWorkAccess.findMany({
        where: {
          userId,
          artworkId: { in: artworkIds },
        },
        select: { artworkId: true },
      });

      const accessedIds = userAccess.map((access) => access.artworkId);
      const unauthorizedIds = artworkIds.filter((id) => !accessedIds.includes(id));

      if (unauthorizedIds.length > 0) {
        res.status(403);
        return next(
          new Error(
            `Unauthorized access. You do not have permission to share these artworks: ${unauthorizedIds.join(', ')}`
          )
        );
      }
    }

    // 2.5. Validate Recipients (userIds) if provided
    if (userIds) {
      if (!Array.isArray(userIds)) {
        res.status(400);
        return next(new Error('userIds must be an array of user IDs.'));
      }

      const validUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });

      if (validUsers.length !== userIds.length) {
        res.status(400);
        return next(new Error('One or more recipient user IDs are invalid.'));
      }
    }

    // 3. Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // 4. Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 5. Create share link record
    const shareLink = await prisma.artworkShareLink.create({
      data: {
        token,
        createdById: userId,
        expiresAt,
        artworks: {
          connect: artworkIds.map((id) => ({ id })),
        },
        sharedWith: userIds && userIds.length > 0 ? {
          connect: userIds.map((id) => ({ id })),
        } : undefined,
      },
    });

    // 6. Construct relative share link
    const shareUrl = `/api/share-links/share/${token}`;

    res.status(201).json({
      success: true,
      message: 'Share link generated successfully.',
      data: {
        token,
        shareUrl,
        expiresAt,
        artworkCount: artworkIds.length,
        recipientCount: userIds ? userIds.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Access shared artworks using public token
 * @route   GET /share/:token
 * @access  Public
 */
const getSharedLinkArtworks = async (req, res, next) => {
  try {
    const { token } = req.params;

    // 1. Fetch share link with artworks
    const shareLink = await prisma.artworkShareLink.findUnique({
      where: { token },
      include: {
        artworks: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          select: { id: true },
        },
      },
    });

    // 2. Validation
    if (!shareLink) {
      res.status(404);
      return next(new Error('Invalid share link.'));
    }

    if (!shareLink.isActive) {
      res.status(403);
      return next(new Error('This share link is no longer active.'));
    }

    if (new Date() > shareLink.expiresAt) {
      // Lazy deletion: Delete it now since it's expired
      await prisma.artworkShareLink.delete({ where: { id: shareLink.id } });
      
      res.status(403);
      return next(new Error('This share link has expired and has been removed.'));
    }

    // 3. Authorization Check
    const { role: userRole, id: userId } = req.user;
    const isRecipient = shareLink.sharedWith.some((u) => u.id === userId);
    const isCreator = shareLink.createdById === userId;
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';

    if (!isRecipient && !isCreator && !isAdmin) {
      res.status(403);
      return next(new Error('You do not have permission to view this shared collection.'));
    }

    // 4. Return artworks
    res.status(200).json({
      success: true,
      data: {
        sharedBy: shareLink.createdBy.name || shareLink.createdBy.email,
        expiresAt: shareLink.expiresAt,
        artworks: shareLink.artworks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareLink,
  getSharedLinkArtworks,
};
