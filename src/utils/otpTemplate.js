const otpTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: 0 auto;
          border: 1px solid #e1e1e1;
          border-radius: 10px;
          overflow: hidden;
        }
        .header {
          background-color: #a4664b;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
        }
        .body {
          padding: 40px 30px;
          background-color: white;
        }
        .title {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 30px;
        }
        .otp-box {
          background-color: #f4f4f4;
          padding: 25px;
          text-align: center;
          font-size: 40px;
          font-weight: bold;
          letter-spacing: 15px;
          color: #333;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .footer {
          text-align: center;
          color: #999;
          font-size: 14px;
          padding: 20px;
          background-color: #fafafa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          🎨 Art Portal
        </div>
        <div class="body">
          <div class="title">Verify your email</div>
          <p class="subtitle">Use the code below to complete your registration. It expires in <b>10 minutes</b>.</p>
          <div class="otp-box">
            ${otp}
          </div>
          <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          © 2026 Art Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = otpTemplate;
