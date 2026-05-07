const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// ─── Create Representative Request ───────────────────────────────────────────
// @route   POST /api/representatives/request
// @access  CLIENT
const createRepresentativeRequest = asyncHandler(async (req, res) => {
  const { requestedName, requestedEmail } = req.body;

  if (!requestedName || !requestedEmail) {
    res.status(400);
    throw new Error('requestedName and requestedEmail are required.');
  }

  if (!EMAIL_REGEX.test(requestedEmail)) {
    res.status(400);
    throw new Error('Invalid email format for the representative.');
  }

  // Prevent submitting for an email that already has an account
  const existingUser = await prisma.user.findUnique({
    where: { email: requestedEmail },
  });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists.');
  }

  // Prevent duplicate pending requests for the same email by the same client
  const existingRequest = await prisma.representativeRequest.findFirst({
    where: {
      clientId: req.user.id,
      requestedEmail,
      status: 'PENDING',
    },
  });
  if (existingRequest) {
    res.status(400);
    throw new Error('A pending request for this email already exists.');
  }

  const request = await prisma.representativeRequest.create({
    data: {
      clientId: req.user.id,
      requestedName,
      requestedEmail,
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({
    success: true,
    message:
      'Representative request submitted. An administrator will review and respond shortly.',
    data: request,
  });
});

// ─── Get My Representative Requests ──────────────────────────────────────────
// @route   GET /api/representatives/my-requests
// @access  CLIENT
const getMyRepresentativeRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const where = {
    clientId: req.user.id,
    ...(status && validStatuses.includes(status) && { status }),
  };

  const [requests, total] = await Promise.all([
    prisma.representativeRequest.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.representativeRequest.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: requests,
  });
});

// ─── Get My Representatives ───────────────────────────────────────────────────
// @route   GET /api/representatives/my-team
// @access  CLIENT
const getMyRepresentatives = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [reps, total] = await Promise.all([
    prisma.user.findMany({
      where: { parentId: req.user.id, role: 'CLIENT_REPRESENTATIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true,
        artworkAccess: {
          include: { artwork: { select: { id: true, title: true, artist: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { parentId: req.user.id, role: 'CLIENT_REPRESENTATIVE' } }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: reps,
  });
});

// ─── Get All Representative Requests (Admin/Superadmin) ───────────────────────
// @route   GET /api/representatives/requests
// @access  SUPERADMIN, ADMIN
const getAllRepresentativeRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const where = {
    ...(status && validStatuses.includes(status) && { status }),
  };

  const [requests, total] = await Promise.all([
    prisma.representativeRequest.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.representativeRequest.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: requests,
  });
});

// ─── Approve Representative Request ───────────────────────────────────────────
// @route   PUT /api/representatives/requests/:id/approve
// @access  SUPERADMIN, ADMIN
const approveRepresentativeRequest = asyncHandler(async (req, res) => {
  const request = await prisma.representativeRequest.findUnique({
    where: { id: req.params.id },
    include: { client: true },
  });

  if (!request) {
    res.status(404);
    throw new Error('Representative request not found.');
  }

  if (request.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Request has already been ${request.status.toLowerCase()}.`);
  }

  // Double-check the email is still available
  const emailTaken = await prisma.user.findUnique({
    where: { email: request.requestedEmail },
  });
  if (emailTaken) {
    res.status(400);
    throw new Error(
      'Cannot approve — an account with this email already exists. Please reject this request.'
    );
  }

  // Generate a secure temporary password
  const tempPassword = crypto.randomBytes(10).toString('base64url');
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Create the CLIENT_REPRESENTATIVE account in a transaction
  const [updatedRequest, newRep] = await prisma.$transaction([
    prisma.representativeRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', reviewedBy: req.user.id },
    }),
    prisma.user.create({
      data: {
        name: request.requestedName,
        email: request.requestedEmail,
        password: hashedPassword,
        role: 'CLIENT_REPRESENTATIVE',
        parentId: request.clientId,
        isVerified: true,
        twoFactorAuth: false,
      },
    }),
  ]);

  // Send onboarding email to the new representative
  try {
    await sendEmail({
      email: newRep.email,
      subject: 'Welcome to Art Portal — Your Account is Ready',
      message: `Your representative account has been created. Temporary password: ${tempPassword}`,
      html: `
        <div style="font-family:sans-serif;padding:24px;border:1px solid #eee;border-radius:12px;max-width:520px">
          <h2 style="color:#1a1a2e">Welcome to Art Portal</h2>
          <p>Hello <strong>${newRep.name}</strong>,</p>
          <p>
            Your account has been created as a <strong>Client Representative</strong> for
            <strong>${request.client.name || request.client.email}</strong>.
          </p>
          <p>Please use the credentials below to log in:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0"><strong>Email:</strong> ${newRep.email}</p>
            <p style="margin:8px 0 0"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color:#e53e3e;font-size:13px">
            ⚠ Please change your password after your first login.
          </p>
          <p>If you have any questions, contact your client manager.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to send onboarding email:', err.message);
  }

  // Notify the client
  try {
    await sendEmail({
      email: request.client.email,
      subject: 'Representative Request Approved — Art Portal',
      message: `Your request to add ${request.requestedName} as a representative has been approved.`,
      html: `
        <div style="font-family:sans-serif;padding:24px;border:1px solid #eee;border-radius:12px;max-width:480px">
          <h2 style="color:#1a1a2e">Representative Request Approved</h2>
          <p>Your representative <strong>${request.requestedName}</strong> (${request.requestedEmail}) has been approved and their account is now active.</p>
          <p>You can now assign artworks to them from your portal.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify client:', err.message);
  }

  res.json({
    success: true,
    message: `Request approved. ${newRep.name}'s account has been created and onboarding email sent.`,
    data: {
      request: updatedRequest,
      representative: {
        id: newRep.id,
        name: newRep.name,
        email: newRep.email,
        role: newRep.role,
        parentId: newRep.parentId,
      },
    },
  });
});

// ─── Reject Representative Request ────────────────────────────────────────────
// @route   PUT /api/representatives/requests/:id/reject
// @access  SUPERADMIN, ADMIN
const rejectRepresentativeRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const request = await prisma.representativeRequest.findUnique({
    where: { id: req.params.id },
    include: { client: true },
  });

  if (!request) {
    res.status(404);
    throw new Error('Representative request not found.');
  }

  if (request.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Request has already been ${request.status.toLowerCase()}.`);
  }

  const updated = await prisma.representativeRequest.update({
    where: { id: request.id },
    data: { status: 'REJECTED', reviewedBy: req.user.id },
  });

  // Notify the client of the rejection
  try {
    await sendEmail({
      email: request.client.email,
      subject: 'Representative Request Update — Art Portal',
      message: `Your request to add ${request.requestedName} as a representative has been declined.`,
      html: `
        <div style="font-family:sans-serif;padding:24px;border:1px solid #eee;border-radius:12px;max-width:480px">
          <h2 style="color:#1a1a2e">Representative Request Declined</h2>
          <p>Your request to add <strong>${request.requestedName}</strong> (${request.requestedEmail}) as a representative has been declined.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Please contact your account manager if you have questions.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify client of rejection:', err.message);
  }

  res.json({
    success: true,
    message: 'Representative request rejected.',
    data: updated,
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  createRepresentativeRequest,
  getMyRepresentativeRequests,
  getMyRepresentatives,
  getAllRepresentativeRequests,
  approveRepresentativeRequest,
  rejectRepresentativeRequest,
};
