const cron = require('node-cron');
const prisma = require('../prismaClient');

/**
 * @desc Initialize background jobs for data cleanup
 */
const initCronJobs = () => {
  // 1. Delete expired share links every hour
  // Cron schedule: '0 * * * *' (At minute 0 of every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('--- Running Background Cleanup: Expired Share Links ---');
      
      const result = await prisma.artworkShareLink.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        console.log(`[Cleanup Success] Deleted ${result.count} expired share links.`);
      } else {
        console.log('[Cleanup] No expired links found.');
      }
    } catch (error) {
      console.error('[Cleanup Error] Failed to delete expired share links:', error);
    }
  });

  console.log('✅ Background cleanup jobs initialized.');
};

module.exports = initCronJobs;
