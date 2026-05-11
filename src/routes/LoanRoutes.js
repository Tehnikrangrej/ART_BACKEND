const express = require('express');
const router = express.Router();
const {
  createLoan,
  getAllLoans,
  updateLoan,
  closeLoan,
} = require('../controllers/LoanController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// All loan routes are restricted to Admins and Superadmins
router.use(protect);
router.use(authorizeRoles('SUPERADMIN', 'ADMIN'));

// @route   POST /api/loans
router.post('/', createLoan);

// @route   GET /api/loans
router.get('/', getAllLoans);

// @route   PUT /api/loans/:id
router.put('/:id', updateLoan);

// @route   PATCH /api/loans/:id/return
router.patch('/:id/return', closeLoan);

module.exports = router;
