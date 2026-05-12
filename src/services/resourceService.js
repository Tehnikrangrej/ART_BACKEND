const ResourceRepository = require('../repositories/resourceRepository');
const { validateResourceUrl } = require('../validations/resourceValidation');

const ResourceService = {
  async createResource(data, userId) {
    validateResourceUrl(data.url);
    
    return await ResourceRepository.create({
      ...data,
      createdById: userId,
    });
  },

  async getResources(filters, pagination) {
    const { artworkId, collectionId, type, isActive } = filters;
    const { skip, take } = pagination;

    const where = {
      ...(artworkId && { artworkId }),
      ...(collectionId && { collectionId }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const [resources, total] = await Promise.all([
      ResourceRepository.findAll({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      ResourceRepository.count(where),
    ]);

    return { resources, total };
  },

  async getResourceById(id) {
    const resource = await ResourceRepository.findById(id);
    if (!resource) throw new Error('Resource not found.');
    return resource;
  },

  async updateResource(id, data) {
    if (data.url) validateResourceUrl(data.url);
    
    return await ResourceRepository.update(id, data);
  },

  async deleteResource(id) {
    return await ResourceRepository.delete(id);
  },
};

module.exports = ResourceService;
