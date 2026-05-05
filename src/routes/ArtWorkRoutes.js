const express = require('express');
const router = express.Router();
const {
    createArtWork,
    getAllArtWorks,
    getArtWorkById,
    updateArtWork,
    deleteArtWork,
} = require('../controllers/ArtWorkController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getAllArtWorks);
router.get('/:id', getArtWorkById);

// Protected routes
router.post('/', protect, createArtWork);
router.put('/:id', protect, updateArtWork);
router.delete('/:id', protect, deleteArtWork);

module.exports = router;

