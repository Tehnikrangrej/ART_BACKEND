const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private/Admin
const createRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Role name is required.');
  }

  const roleExists = await prisma.role.findUnique({
    where: { name: name.toUpperCase() }
  });

  if (roleExists) {
    res.status(400);
    throw new Error('Role already exists.');
  }

  const role = await prisma.role.create({
    data: {
      name: name.toUpperCase(),
      description
    }
  });

  res.status(201).json({
    success: true,
    data: role
  });
});

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
const getRoles = asyncHandler(async (req, res) => {
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true, permissions: true }
      }
    }
  });

  res.json({
    success: true,
    data: roles
  });
});

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private/Admin
const getRoleById = asyncHandler(async (req, res) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  if (!role) {
    res.status(404);
    throw new Error('Role not found.');
  }

  res.json({
    success: true,
    data: role
  });
});

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const role = await prisma.role.findUnique({
    where: { id: req.params.id }
  });

  if (!role) {
    res.status(404);
    throw new Error('Role not found.');
  }

  const updatedRole = await prisma.role.update({
    where: { id: req.params.id },
    data: {
      name: name ? name.toUpperCase() : role.name,
      description: description || role.description
    }
  });

  res.json({
    success: true,
    data: updatedRole
  });
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = asyncHandler(async (req, res) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true } } }
  });

  if (!role) {
    res.status(404);
    throw new Error('Role not found.');
  }

  if (role._count.users > 0) {
    res.status(400);
    throw new Error('Cannot delete role with associated users.');
  }

  await prisma.role.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    message: 'Role removed successfully.'
  });
});

// @desc    Assign role to user
// @route   PUT /api/roles/assign-to-user/:id
// @access  Private/Admin
const assignRoleToUser = asyncHandler(async (req, res) => {
  const { roleName } = req.body; // Name of the role to assign
  const { id } = req.params;     // User ID

  if (!roleName) {
    res.status(400);
    throw new Error('Role name is required.');
  }

  const role = await prisma.role.findUnique({
    where: { name: roleName.toUpperCase() }
  });

  if (!role) {
    res.status(400);
    throw new Error('Role not found. Please create the role first.');
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { roleId: role.id },
    include: { role: true }
  });

  res.json({
    success: true,
    message: `User role updated to ${roleName.toUpperCase()} successfully.`,
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.name
    }
  });
});

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToUser
};
