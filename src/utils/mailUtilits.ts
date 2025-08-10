import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD,
  },
});

async function testMail() {
  try {
    await transporter.verify();
    console.log('SMTP Connection Successful');
  } catch (error) {
    console.error('SMTP Connection Failed', error);
  }
}

testMail();

class MailUtility {
  static async sendMail(email:string, content:string, subject:string):Promise<{message:string}>{
    if (!process.env.MAILER_EMAIL || !process.env.MAILER_PASSWORD) {
      throw new Error('Missing MAILER_EMAIL or MAILER_PASSWORD in environment variables');
    }

    // Generic HTML template for Gallery App notifications
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <header style="background-color: #4a90e2; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gallery App</h1>
          </header>
          <main style="padding: 30px;">
            <h2 style="font-size: 20px; color: #4a4a4a;">${subject}</h2>
            <p style="font-size: 16px; color: #555;">Hello,<br><br>
            Here is your requested code:<br></p>
            <div style="background-color: #eef; border-radius: 4px; padding: 15px; font-family: 'Courier New', monospace; font-size: 18px; text-align: center; letter-spacing: 5px; margin: 20px 0;">
              ${content}
            </div>
            <p style="font-size: 14px; color: #888;">If you did not request this code, please ignore this email.</p>
          </main>
          <footer style="background-color: #f0f0f0; padding: 15px; text-align: center; color: #aaa; font-size: 12px;">
            © ${new Date().getFullYear()} Gallery App. All rights reserved.
          </footer>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `Gallery App <${process.env.MAILER_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Mail sent successfully' };
    } catch (error) {
      console.error('Error sending mail:', error);
      throw new Error('Failed to send email');
    }
  }
}

export default MailUtility;
