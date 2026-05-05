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
const checkPermission = require('../middlewares/permissionMiddleware');



// Public routes
router.get('/', getAllArtWorks);
router.get('/:id', getArtWorkById);

// Protected routes
router.post('/', protect, checkPermission('CREATE_ARTWORKS'), createArtWork);
router.put('/:id', protect, checkPermission('UPDATE_ARTWORKS'), updateArtWork);
router.delete('/:id', protect, checkPermission('DELETE_ARTWORKS'), deleteArtWork);



module.exports = router;

