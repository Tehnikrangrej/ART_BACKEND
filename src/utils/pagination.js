/**
 * Pagination helper for Prisma queries
 * @param {Object} query - The request query object (req.query)
 * @returns {Object} { page, limit, skip }
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { getPagination };
