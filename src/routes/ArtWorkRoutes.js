const express = require('express');
const router = express.Router();

const {
  createArtWork,
  getAllArtWorks,
  getArtWorkById,
  updateArtWork,
  deleteArtWork,
  assignArtworkToClient,
  revokeArtworkFromClient,
  assignArtworkToRepresentative,
  revokeArtworkFromRepresentative,
} = require('../controllers/ArtWorkController');

const { getArtworkResources } = require('../controllers/ResourceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles, requireVerified } = require('../middlewares/roleMiddleware');


// ─── SUPERADMIN / ADMIN — artwork management ──────────────────────────────────
router.post('/',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  createArtWork
);

// Get all artworks (Role-aware)
router.get('/',
  protect,
  requireVerified,
  getAllArtWorks
);

router.put('/:id',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  updateArtWork
);

router.delete('/:id',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  deleteArtWork
);

// ─── SUPERADMIN / ADMIN — client access management ───────────────────────────
router.post('/:id/assign-to-client',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  assignArtworkToClient
);

router.delete('/:id/revoke-from-client/:clientId',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  revokeArtworkFromClient
);



router.post('/:id/assign-to-representative',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN', 'CLIENT'),
  assignArtworkToRepresentative
);

router.delete('/:id/revoke-from-representative/:representativeId',
  protect,
  requireVerified,
  authorizeRoles('SUPERADMIN', 'ADMIN', 'CLIENT'),
  revokeArtworkFromRepresentative
);

// ─── Single artwork — role-aware (controller handles per-role access check) ───
router.get('/:id',
  protect,
  requireVerified,
  getArtWorkById
);

module.exports = router;
