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
const checkPermission = require('../middlewares/permissionMiddleware');

// Submit enquiry - Available to authorized users (Client/Rep)
router.post('/', protect, checkPermission('CREATE_ENQUIRIES'), createEnquiry);

// Get my enquiries - Available to any logged in user
router.get('/my', protect, getMyEnquiries);

// Admin/Team management routes
router.get('/', protect, checkPermission('READ_ENQUIRIES'), getAllEnquiries);
router.get('/:id', protect, checkPermission('READ_ENQUIRIES'), getEnquiryById);
router.put('/:id/status', protect, checkPermission('UPDATE_ENQUIRIES'), updateEnquiryStatus);
router.put('/:id/assign', protect, checkPermission('UPDATE_ENQUIRIES'), assignEnquiry);

module.exports = router;
