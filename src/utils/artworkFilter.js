const prisma = require('../prismaClient');

/**
 * Filters artwork fields based on global visibility settings.
 * @param {Object|Array} artworks - Single artwork or array of artworks
 * @param {String} role - User role (Admins/Superadmins see all)
 * @returns {Promise<Object|Array>} - Filtered artwork(s)
 */
const filterArtworkFields = async (artworks, role) => {
  if (!artworks) return artworks;

  // Admins and Superadmins always see all fields
  if (role === 'SUPERADMIN' || role === 'ADMIN') {
    return artworks;
  }

  // Fetch settings (using id "global-visibility")
  let settings = await prisma.artworkVisibilitySettings.findUnique({
    where: { id: 'global-visibility' },
  });

  // If no settings found, show everything by default
  if (!settings) {
    return artworks;
  }

  const isArray = Array.isArray(artworks);
  const artworkList = isArray ? artworks : [artworks];

  const filteredList = artworkList.map((artwork) => {
    // Clone to avoid mutating original if it's cached or used elsewhere
    const filtered = { ...artwork };

    if (!settings.showTitle) delete filtered.title;
    if (!settings.showArtist) delete filtered.artist;
    if (!settings.showYear) delete filtered.year;
    if (!settings.showMedium) delete filtered.medium;
    if (!settings.showDimensions) delete filtered.dimensions;
    if (!settings.showProvenance) delete filtered.provenance;
    if (!settings.showLocation) delete filtered.location;
    if (!settings.showPeriod) delete filtered.period;
    if (!settings.showPrice) delete filtered.price;
    if (!settings.showPictures) delete filtered.pictures;

    return filtered;
  });

  return isArray ? filteredList : filteredList[0];
};

module.exports = { filterArtworkFields };
