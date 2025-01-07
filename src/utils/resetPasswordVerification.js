import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',  // You can use other services (e.g., SMTP server of your choice)
  auth: {
    user: process.env.GMAIL,  // Your email address (from which to send the email)
    pass: process.env.GMAIL_PASSWORD,  // Your email password (or app-specific password)
  },
});

// Function to send verification email (password reset link)
export const resetPasswordVerification = async (email, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;  // The link user will click to reset their password
  
  const mailOptions = {
    from: process.env.GMAIL,  // sender's email
    to: email,  // recipient's email
    subject: 'Password Reset Request',
    html: `
      <h3>Reset Your Password</h3>
      <p>We received a request to reset your password. Please click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};