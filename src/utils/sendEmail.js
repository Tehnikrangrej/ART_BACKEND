const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  let transporter;

  // 1. Check for real credentials
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // 2. FALLBACK: Create a temporary test account (Ethereal Email)
    console.warn('WARNING: No credentials in .env. Creating a temporary test account...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log(`[TEST MODE] Test Account Created: ${testAccount.user}`);
  }

  const mailOptions = {
    from: `"Art Portal" <${process.env.EMAIL_USER || 'test@artportal.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Add this line
  };

  const info = await transporter.sendMail(mailOptions);

  // If using a test account, log the URL where you can view the email
  if (!process.env.EMAIL_USER) {
    console.log(`[TEST MODE] Email sent! View it at: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

module.exports = sendEmail;
