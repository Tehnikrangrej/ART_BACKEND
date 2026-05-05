const enquiryTemplate = (enquiryData) => {
  const { artworkTitle, artist, clientName, clientEmail, message } = enquiryData;
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">New Artwork Enquiry</h1>
      </div>
      
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="color: #666; font-size: 16px; margin-bottom: 25px;">Hello Arts Team,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">You have received a new enquiry regarding an artwork in your collection.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Artwork Details</h3>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Title:</strong> ${artworkTitle}</p>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Artist:</strong> ${artist}</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Client Information</h3>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Name:</strong> ${clientName}</p>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Email:</strong> ${clientEmail}</p>
        </div>

        <div style="background-color: #fff9f0; padding: 20px; border-left: 4px solid #f39c12; border-radius: 4px; margin: 25px 0;">
          <h3 style="color: #e67e22; margin-top: 0; font-size: 18px;">Message</h3>
          <p style="color: #5d4037; font-size: 15px; line-height: 1.6; font-style: italic;">"${message}"</p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="#" style="background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Manage Enquiry in Portal</a>
        </div>
      </div>
      
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>&copy; 2026 Art Management Portal. All rights reserved.</p>
      </div>
    </div>
  `;
};

module.exports = enquiryTemplate;
