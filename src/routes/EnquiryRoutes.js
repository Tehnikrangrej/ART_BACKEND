const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  getMyEnquiries,
  updateEnquiryStatus,
  assignEnquiry
} = require('../controllers/EnquiryController');
const { protect } = require('../middlewares/authMiddleware');

// Submit enquiry - Available to authorized users (Client/Rep)
router.post('/', protect, createEnquiry);

// Get my enquiries - Available to any logged in user
router.get('/my', protect, getMyEnquiries);

// Admin/Team management routes
router.get('/', protect, getAllEnquiries);
router.get('/:id', protect, getEnquiryById);
router.put('/:id/status', protect, updateEnquiryStatus);
router.put('/:id/assign', protect, assignEnquiry);

module.exports = router;
