const VALID_PROTOCOLS = ['https:'];
const TRUSTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'artsy.net',
  'christies.com',
  'sothebys.com',
  'mutualart.com',
  'artnet.com',
];

/**
 * Validates external resource URLs for security.
 * @param {String} urlString - The URL to validate
 * @throws {Error} if URL is invalid or dangerous
 */
const validateResourceUrl = (urlString) => {
  if (!urlString) throw new Error('URL is required.');

  try {
    const url = new URL(urlString);

    // 1. Force HTTPS
    if (!VALID_PROTOCOLS.includes(url.protocol)) {
      throw new Error('Only HTTPS URLs are allowed for external resources.');
    }

    // 2. Prevent common malicious characters
    if (urlString.includes('<script') || urlString.includes('javascript:')) {
      throw new Error('Dangerous URL patterns detected.');
    }

    // 3. Optional: Domain whitelisting (can be disabled if user wants any HTTPS)
    // const domain = url.hostname.replace('www.', '');
    // if (!TRUSTED_DOMAINS.includes(domain)) {
    //   throw new Error('Domain not in trusted list.');
    // }

    return true;
  } catch (err) {
    if (err.message.includes('Invalid URL')) {
      throw new Error('The provided URL is invalid.');
    }
    throw err;
  }
};

module.exports = { validateResourceUrl };
