import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn(
      ' Email not configured! Add MAIL_USER and MAIL_PASS to .env file'
    );
    console.warn(' Would have sent email to:', to, 'Subject:', subject);
    return;
  }

  try {
    console.log('📧 Sending email to:', to, 'Subject:', subject);
    const result = await transporter.sendMail({
      from: `BarberQueue <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('✅ Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw error;
  }
};
