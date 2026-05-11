const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// @desc    Record a new artwork loan
// @route   POST /api/loans
// @access  Private (SUPERADMIN, ADMIN)
const createLoan = asyncHandler(async (req, res) => {
  const { artworkId, borrowerName, borrowerContact, location, dueDate, notes } = req.body;

  // Verify artwork exists
  const artwork = await prisma.artWork.findUnique({ where: { id: artworkId } });
  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  // Check if artwork is already on loan
  const activeLoan = await prisma.artworkLoan.findFirst({
    where: { artworkId, status: 'ON_LOAN' },
  });

  if (activeLoan) {
    res.status(400);
    throw new Error('This artwork is already on an active loan.');
  }

  const loan = await prisma.artworkLoan.create({
    data: {
      artworkId,
      borrowerName,
      borrowerContact,
      location,
      dueDate: new Date(dueDate),
      notes,
      status: 'ON_LOAN',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Artwork loan recorded successfully.',
    data: loan,
  });
});

// @desc    Get all loans with filtering
// @route   GET /api/loans
// @access  Private (SUPERADMIN, ADMIN)
const getAllLoans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, artworkId } = req.query;

  const where = {
    ...(status && { status }),
    ...(artworkId && { artworkId }),
  };

  const [loans, total] = await Promise.all([
    prisma.artworkLoan.findMany({
      where,
      include: { artwork: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.artworkLoan.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: loans,
  });
});

// @desc    Update loan details
// @route   PUT /api/loans/:id
// @access  Private (SUPERADMIN, ADMIN)
const updateLoan = asyncHandler(async (req, res) => {
  const { borrowerName, borrowerContact, location, dueDate, returnDate, notes, status } = req.body;

  const loan = await prisma.artworkLoan.findUnique({ where: { id: req.params.id } });
  if (!loan) {
    res.status(404);
    throw new Error('Loan record not found.');
  }

  const updated = await prisma.artworkLoan.update({
    where: { id: req.params.id },
    data: {
      ...(borrowerName && { borrowerName }),
      ...(borrowerContact !== undefined && { borrowerContact }),
      ...(location && { location }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(returnDate && { returnDate: new Date(returnDate) }),
      ...(notes !== undefined && { notes }),
      ...(status && { status }),
    },
  });

  res.json({
    success: true,
    message: 'Loan record updated successfully.',
    data: updated,
  });
});

// @desc    Mark loan as returned
// @route   PATCH /api/loans/:id/return
// @access  Private (SUPERADMIN, ADMIN)
const closeLoan = asyncHandler(async (req, res) => {
  const loan = await prisma.artworkLoan.findUnique({ where: { id: req.params.id } });
  if (!loan) {
    res.status(404);
    throw new Error('Loan record not found.');
  }

  if (loan.status === 'RETURNED') {
    res.status(400);
    throw new Error('This loan is already closed.');
  }

  const updated = await prisma.artworkLoan.update({
    where: { id: req.params.id },
    data: {
      status: 'RETURNED',
      returnDate: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Artwork marked as returned. Loan closed.',
    data: updated,
  });
});

module.exports = {
  createLoan,
  getAllLoans,
  updateLoan,
  closeLoan,
};
