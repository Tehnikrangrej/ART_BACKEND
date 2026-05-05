const prisma = require('../prismaClient');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// @desc    Create a new permission manually
// @route   POST /api/permissions
const createPermission = asyncHandler(async (req, res) => {
  const { name, action, resource } = req.body;

  if (!name || !action || !resource) {
    res.status(400);
    throw new Error('Please provide name, action, and resource.');
  }

  const permissionExists = await prisma.permission.findUnique({ where: { name } });
  if (permissionExists) {
    res.status(400);
    throw new Error('Permission already exists.');
  }

  const permission = await prisma.permission.create({
    data: { name, action, resource }
  });

  res.status(201).json({
    success: true,
    data: permission
  });
});

// @desc    Get all permissions
// @route   GET /api/permissions
const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await prisma.permission.findMany({
    include: { roles: true }
  });
  res.json({
    success: true,
    data: permissions
  });
});

// @desc    Delete a permission
// @route   DELETE /api/permissions/:id
const deletePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    res.status(404);
    throw new Error('Permission not found.');
  }

  await prisma.permission.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Permission deleted successfully.'
  });
});

// @desc    Assign permission to a role
// @route   POST /api/permissions/assign
const assignPermissionToRole = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.body;

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    res.status(404);
    throw new Error('Role not found.');
  }

  const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!permission) {
    res.status(404);
    throw new Error('Permission not found.');
  }

  const rolePermission = await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId
      }
    },
    update: {},
    create: {
      roleId,
      permissionId
    }
  });

  res.json({
    success: true,
    message: `Permission ${permission.name} assigned to role ${role.name}.`,
    data: rolePermission
  });
});

// @desc    Remove permission from a role
// @route   DELETE /api/permissions/revoke
const revokePermissionFromRole = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.body;

  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId
      }
    }
  });

  res.json({
    success: true,
    message: 'Permission revoked from role successfully.'
  });
});

module.exports = {
  createPermission,
  getAllPermissions,
  deletePermission,
  assignPermissionToRole,
  revokePermissionFromRole
};
