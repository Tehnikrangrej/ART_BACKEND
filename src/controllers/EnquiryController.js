const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');
const sendEmail = require('../utils/sendEmail');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const enquiryFullInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  artwork: { select: { id: true, title: true, artist: true } },
  assignee: { select: { id: true, name: true, email: true } },
  history: { orderBy: { createdAt: 'desc' } },
};


// ─── Create Enquiry ───────────────────────────────────────────────────────────
// @route   POST /api/enquiries
// @access  CLIENT, CLIENT_REPRESENTATIVE
const createEnquiry = asyncHandler(async (req, res) => {
  const { artworkId, message } = req.body;

  if (!artworkId || !message) {
    res.status(400);
    throw new Error('artworkId and message are required.');
  }

  // 1. Verify user has access to this artwork
  const access = await prisma.artWorkAccess.findUnique({
    where: { userId_artworkId: { userId: req.user.id, artworkId } },
  });

  if (!access) {
    res.status(403);
    throw new Error('You Do not Have access to This Artwork');
  }

  // 2. Create the enquiry
  const enquiry = await prisma.enquiry.create({
    data: {
      userId: req.user.id,
      artworkId,
      message,
      status: 'PENDING',
    },
    include: {
      artwork: true,
      user: { select: { name: true, email: true } },
    },
  });

  // 3. Log initial history
  await prisma.enquiryHistory.create({
    data: {
      enquiryId: enquiry.id,
      action: 'Enquiry submitted by client.',
      doneBy: req.user.name || req.user.email,
    },
  });

  // 4. Notify Superadmins via email
  try {
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { email: true },
    });

    const superAdminEmails = superAdmins.map((sa) => sa.email);

    if (superAdminEmails.length > 0) {
      await sendEmail({
        email: superAdminEmails.join(','),
        subject: `New Enquiry Alert: ${enquiry.artwork.title}`,
        message: `A new enquiry has been submitted for "${enquiry.artwork.title}".`,
        html: `
          <div style="font-family:sans-serif;padding:24px;border:1px solid #eee;border-radius:12px;max-width:520px">
            <h2 style="color:#1a1a2e">New Enquiry Received</h2>
            <p><strong>Client:</strong> ${enquiry.user.name || enquiry.user.email}</p>
            <p><strong>Artwork:</strong> ${enquiry.artwork.title}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f9f9f9;padding:12px;border-left:4px solid #1a1a2e;margin:16px 0">${message}</blockquote>
            <p>Please log in to the portal to assign this enquiry to an Admin.</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error('[Email] Superadmin notification failed:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Enquiry submitted successfully. A notification has been sent to the Superadmin.',
    data: enquiry,
  });
});

// ─── Get My Enquiries ─────────────────────────────────────────────────────────
// @route   GET /api/enquiries/my
// @access  CLIENT, CLIENT_REPRESENTATIVE
const getMyEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const where = {
    userId: req.user.id,
    ...(status && VALID_STATUSES.includes(status) && { status }),
  };

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: {
        artwork: { select: { id: true, title: true, artist: true, pictures: true } },
        assignee: { select: { id: true, name: true, email: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: enquiries });
});

// ─── Get All Enquiries ────────────────────────────────────────────────────────
// @route   GET /api/enquiries
// @access  SUPERADMIN, ADMIN
const getAllEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, assignedTo } = req.query;

  const where = {
    ...(status && VALID_STATUSES.includes(status) && { status }),
    ...(assignedTo === 'unassigned' && { assignedTo: null }),
    ...(assignedTo && assignedTo !== 'unassigned' && { assignedTo }),
  };

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: enquiryFullInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: enquiries });
});

// ─── Get All Pending Enquiries ────────────────────────────────────────────────
// @route   GET /api/enquiries/pending
// @access  SUPERADMIN
const getAllPendingEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const where = { status: 'PENDING' };

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: enquiryFullInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: enquiries });
});

// ─── Get Enquiry By ID ────────────────────────────────────────────────────────
// @route   GET /api/enquiries/:id
// @access  SUPERADMIN, ADMIN; CLIENT/REP see only their own
const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
    include: enquiryFullInclude,
  });

  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found.');
  }

  const { role, id: userId } = req.user;

  if (role === 'CLIENT' || role === 'CLIENT_REPRESENTATIVE') {
    if (enquiry.userId !== userId) {
      res.status(403);
      throw new Error('Access denied. You can only view your own enquiries.');
    }
  }

  res.json({ success: true, data: enquiry });
});

// ─── Update Enquiry Status ────────────────────────────────────────────────────
// @route   PUT /api/enquiries/:id/status
// @access  ADMIN (assigned to them or SUPERADMIN)
const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}.`);
  }

  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found.');
  }

  // ADMIN can only update enquiries assigned to them
  if (req.user.role === 'ADMIN' && enquiry.assignedTo !== req.user.id) {
    res.status(403);
    throw new Error('You can only update enquiries assigned to you.');
  }

  const updated = await prisma.enquiry.update({
    where: { id },
    data: { status },
    include: enquiryFullInclude,
  });

  await prisma.enquiryHistory.create({
    data: {
      enquiryId: id,
      action: `Status changed from ${enquiry.status} to ${status}.`,
      doneBy: req.user.name || req.user.email,
    },
  });

  res.json({
    success: true,
    message: `Enquiry status updated to ${status}.`,
    data: updated,
  });
});

// ─── Assign Enquiry To Admin ──────────────────────────────────────────────────
// @route   PUT /api/enquiries/:id/assign
// @access  SUPERADMIN
const assignEnquiry = asyncHandler(async (req, res) => {
  const { adminId } = req.body;
  const { id } = req.params;

  if (!adminId) {
    res.status(400);
    throw new Error('adminId is required.');
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN') {
    res.status(400);
    throw new Error('Target user must be an existing ADMIN.');
  }

  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found.');
  }

  const updated = await prisma.enquiry.update({
    where: { id },
    data: { assignedTo: adminId, status: 'IN_PROGRESS' },
    include: enquiryFullInclude,
  });

  await prisma.enquiryHistory.create({
    data: {
      enquiryId: id,
      action: `Enquiry assigned to admin ${admin.name || admin.email}.`,
      doneBy: req.user.name || req.user.email,
    },
  });

  // Notify the assigned admin
  try {
    await sendEmail({
      email: admin.email,
      subject: `[Art Portal] New Enquiry Assigned — #${id.substring(0, 8)}`,
      message: `You have been assigned to handle enquiry #${id}.`,
      html: `
        <div style="font-family:sans-serif;padding:24px;border:1px solid #eee;border-radius:12px;max-width:480px">
          <h2 style="color:#1a1a2e">Enquiry Assigned to You</h2>
          <p>You have been assigned to handle the following enquiry:</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#555">Enquiry ID</td><td style="padding:6px 0;font-weight:600">#${id.substring(0, 8)}…</td></tr>
            <tr><td style="padding:6px 0;color:#555">Artwork</td><td style="padding:6px 0;font-weight:600">${updated.artwork?.title || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0;color:#555">Client</td><td style="padding:6px 0;font-weight:600">${updated.user?.name || updated.user?.email || 'N/A'}</td></tr>
          </table>
          <p style="margin-top:16px">Please log in to the Art Portal to manage this enquiry.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify assigned admin:', err.message);
  }

  res.json({
    success: true,
    message: `Enquiry assigned to ${admin.name || admin.email}.`,
    data: updated,
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  createEnquiry,
  getMyEnquiries,
  getAllEnquiries,
  getAllPendingEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  assignEnquiry,
};
