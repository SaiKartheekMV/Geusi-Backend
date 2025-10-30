const generatePasswordResetTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #333;
          font-size: 22px;
          margin-bottom: 20px;
        }
        .content p {
          color: #666;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 14px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .info-box {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          color: #555;
          font-size: 14px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #999;
          font-size: 14px;
        }
        .footer p {
          margin: 5px 0;
        }
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="info-box">
            <p><strong>⏰ This link will expire in 1 hour</strong></p>
            <p>For security reasons, this password reset link is only valid for one hour from the time it was sent.</p>
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #999;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; color: #667eea; word-break: break-all;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated email, please do not reply.</p>
          <p>© ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generatePasswordResetTemplate,
};
