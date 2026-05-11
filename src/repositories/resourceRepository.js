const prisma = require('../prismaClient');

const ResourceRepository = {
  async create(data) {
    return await prisma.externalResource.create({ data });
  },

  async findAll({ where, skip, take, orderBy }) {
    return await prisma.externalResource.findMany({
      where,
      include: { artwork: true },
      skip,
      take,
      orderBy,
    });
  },

  async count(where) {
    return await prisma.externalResource.count({ where });
  },

  async findById(id) {
    return await prisma.externalResource.findUnique({
      where: { id },
      include: { artwork: true },
    });
  },

  async update(id, data) {
    return await prisma.externalResource.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return await prisma.externalResource.delete({ where: { id } });
  },
};

module.exports = ResourceRepository;
