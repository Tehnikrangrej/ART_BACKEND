const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const sendEmail = require('../utils/sendEmail');
const enquiryTemplate = require('../utils/enquiryTemplate');

// @desc    Submit a new enquiry
// @route   POST /api/enquiries
const createEnquiry = asyncHandler(async (req, res) => {
  const { artworkId, message } = req.body;

  if (!artworkId || !message) {
    res.status(400);
    throw new Error('Artwork ID and message are required.');
  }

  // Ensure user is verified
  if (!req.user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email/account before submitting enquiries.');
  }

  // Verify artwork exists
  const artwork = await prisma.artWork.findUnique({
    where: { id: artworkId }
  });

  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found.');
  }

  // Create Enquiry
  const enquiry = await prisma.enquiry.create({
    data: {
      artworkId,
      message,
      userId: req.user.id,
    },
    include: {
      user: true,
      artwork: true
    }
  });

  // Create Audit History
  await prisma.enquiryHistory.create({
    data: {
      enquiryId: enquiry.id,
      action: 'Enquiry submitted by client.',
      doneBy: req.user.name || req.user.email
    }
  });

  // Send Email Notification to Admin/Team
  // In a real app, you'd fetch admin emails from the DB or config
  try {
    await sendEmail({
      email: process.env.ADMIN_EMAIL || 'admin@artportal.com',
      subject: `New Enquiry: ${artwork.title}`,
      message: `New enquiry from ${req.user.name || req.user.email} regarding "${artwork.title}"`,
      html: enquiryTemplate({
        artworkTitle: artwork.title,
        artist: artwork.artist,
        clientName: req.user.name || 'N/A',
        clientEmail: req.user.email,
        message: message
      })
    });
  } catch (error) {
    console.error('Failed to send enquiry email notification:', error.message);
    // We don't throw here to ensure the user gets their success response
  }

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been submitted successfully. Our team will contact you soon.',
    data: enquiry
  });
});

// @desc    Get all enquiries (Admin/Staff only)
// @route   GET /api/enquiries
const getAllEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    include: {
      user: { select: { name: true, email: true } },
      artwork: { select: { title: true, artist: true } },
      assignee: { select: { name: true, email: true } },
      history: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: enquiries
  });
});

// @desc    Get logged in user's enquiries
// @route   GET /api/enquiries/my
const getMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    where: { userId: req.user.id },
    include: {
      artwork: { select: { title: true, artist: true, Pictures: true } },
      history: { orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: enquiries
  });
});

// @desc    Get single enquiry details (Admin/Staff only)
// @route   GET /api/enquiries/:id
const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true } },
      artwork: { select: { title: true, artist: true } },
      assignee: { select: { name: true, email: true } },
      history: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found.');
  }

  res.json({
    success: true,
    data: enquiry
  });
});

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id/status
const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status.');
  }

  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found.');
  }

  const updatedEnquiry = await prisma.enquiry.update({
    where: { id },
    data: { status },
  });

  // Audit Log
  await prisma.enquiryHistory.create({
    data: {
      enquiryId: id,
      action: `Status changed from ${enquiry.status} to ${status}`,
      doneBy: req.user.name || req.user.email
    }
  });

  res.json({
    success: true,
    message: `Enquiry status updated to ${status}`,
    data: updatedEnquiry
  });
});

// @desc    Assign enquiry to staff/admin
// @route   PUT /api/enquiries/:id/assign
const assignEnquiry = asyncHandler(async (req, res) => {
  const { userId } = req.body; // User ID of the staff member
  const { id } = req.params;

  const staff = await prisma.user.findUnique({ where: { id: userId } });
  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found.');
  }

  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: { assignedTo: userId },
    include: { assignee: true }
  });

  // Audit Log
  await prisma.enquiryHistory.create({
    data: {
      enquiryId: id,
      action: `Enquiry assigned to ${staff.name || staff.email}`,
      doneBy: req.user.name || req.user.email
    }
  });

  // Notify the assigned staff member
  try {
    await sendEmail({
      email: staff.email,
      subject: `New Task Assigned: Enquiry #${id}`,
      message: `You have been assigned to handle an enquiry regarding "${enquiry.artwork.title}" from ${enquiry.user.name || enquiry.user.email}.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Enquiry Assignment</h2>
          <p>You have been assigned to follow up on the following enquiry:</p>
          <ul>
            <li><strong>Enquiry ID:</strong> ${id}</li>
            <li><strong>Artwork:</strong> ${enquiry.artwork.title}</li>
            <li><strong>Client:</strong> ${enquiry.user.name || enquiry.user.email}</li>
          </ul>
          <p>Please log in to the portal to manage this request.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send assignment email:', error.message);
  }

  res.json({
    success: true,
    message: `Enquiry assigned to ${staff.name || staff.email}`,
    data: enquiry
  });
});

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  getMyEnquiries,
  updateEnquiryStatus,
  assignEnquiry
};
