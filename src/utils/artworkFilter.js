const prisma = require('../prismaClient');

/**
 * Filters artwork fields based on global visibility settings.
 * @param {Object|Array} artworks - Single artwork or array of artworks
 * @param {String} role - User role (Admins/Superadmins see all)
 * @returns {Promise<Object|Array>} - Filtered artwork(s)
 */
const filterArtworkFields = async (artworks, role) => {
  if (!artworks) return artworks;


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

    if (!settings.showTitle) filtered.title = "Disable";
    if (!settings.showArtist) filtered.artist = "Disable";
    if (!settings.showYear) filtered.year = "Disable";
    if (!settings.showMedium) filtered.medium = "Disable";
    if (!settings.showDimensions) filtered.dimensions = "Disable";
    if (!settings.showProvenance) filtered.provenance = "Disable";
    if (!settings.showLocation) filtered.location = "Disable";
    if (!settings.showPeriod) filtered.period = "Disable";
    if (!settings.showPrice) filtered.price = "Disable";
    if (!settings.showPictures) filtered.pictures = ["Disable"];

    return filtered;
  });

  return isArray ? filteredList : filteredList[0];
};

module.exports = { filterArtworkFields };
