const cron = require('node-cron');
const prisma = require('../prismaClient');
const logAudit = require('./auditLogger');
const sendEmail = require('./sendEmail');

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
        await logAudit({
          action: 'CRON_CLEANUP_EXPIRED_LINKS',
          payload: { deletedCount: result.count },
        });
      } else {
        console.log('[Cleanup] No expired links found.');
      }
    } catch (error) {
      console.error('[Cleanup Error] Failed to delete expired share links:', error);
    }
  });

  console.log('✅ Background cleanup jobs initialized.');

  // 2. Check for overdue loans and upcoming returns every day at midnight
  // Cron schedule: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('--- Running Background Task: Loan Monitoring ---');

      // A. Mark loans as OVERDUE if they passed the due date
      const overdueResult = await prisma.artworkLoan.updateMany({
        where: {
          status: 'ON_LOAN',
          dueDate: { lt: new Date() },
        },
        data: { status: 'OVERDUE' },
      });

      if (overdueResult.count > 0) {
        console.log(`[Loan Monitor] Marked ${overdueResult.count} loans as OVERDUE.`);
        await logAudit({
          action: 'CRON_LOAN_MONITOR_OVERDUE',
          payload: { count: overdueResult.count },
        });
      }

      // B. Identify upcoming returns (due tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
      const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

      const upcoming = await prisma.artworkLoan.findMany({
        where: {
          status: 'ON_LOAN',
          dueDate: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
        },
        include: { artwork: { select: { title: true } } },
      });

      if (upcoming.length > 0) {
        console.log(`[Loan Monitor] Found ${upcoming.length} upcoming returns. Sending notifications...`);

        // Get all Admins and Superadmins to notify
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
          select: { email: true },
        });

        const adminEmails = admins.map((a) => a.email).join(',');

        for (const loan of upcoming) {
          // Log it
          await logAudit({
            action: 'LOAN_RETURN_ALERT',
            payload: {
              artwork: loan.artwork.title,
              borrower: loan.borrowerName,
              dueDate: loan.dueDate,
            },
          });

          // Send Email if we have admins
          if (adminEmails) {
            try {
              await sendEmail({
                email: adminEmails,
                subject: `Loan Return Alert: ${loan.artwork.title}`,
                message: `The artwork "${loan.artwork.title}" on loan to ${loan.borrowerName} is due for return on ${loan.dueDate.toDateString()}.`,
                html: `
                  <h2>Artwork Return Alert</h2>
                  <p>This is an automated notification that the following artwork is due for return soon:</p>
                  <ul>
                    <li><strong>Artwork:</strong> ${loan.artwork.title}</li>
                    <li><strong>Borrower:</strong> ${loan.borrowerName}</li>
                    <li><strong>Due Date:</strong> ${loan.dueDate.toDateString()}</li>
                    <li><strong>Location:</strong> ${loan.location}</li>
                  </ul>
                  <p>Please ensure the artwork is returned and update the system accordingly.</p>
                `,
              });
            } catch (mailErr) {
              console.error(`[Loan Monitor] Failed to send email for loan ${loan.id}:`, mailErr.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Loan Monitor Error] Task failed:', error.message);
    }
  });
};

module.exports = initCronJobs;
