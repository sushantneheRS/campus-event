const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to Campus Event Management System',
    template: (name) => `
      <h2>Welcome ${name}!</h2>
      <p>Thank you for joining our Campus Event Management System.</p>
      <p>You can now browse and register for exciting campus events.</p>
      <p>Best regards,<br>Campus Event Team</p>
    `
  },
  
  eventRegistration: {
    subject: 'Event Registration Confirmation',
    template: (name, eventTitle, eventDate) => `
      <h2>Registration Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>You have successfully registered for: <strong>${eventTitle}</strong></p>
      <p>Event Date: ${eventDate}</p>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br>Campus Event Team</p>
    `
  },
  
  eventReminder: {
    subject: 'Event Reminder',
    template: (name, eventTitle, eventDate, eventTime) => `
      <h2>Event Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder for your upcoming event:</p>
      <p><strong>${eventTitle}</strong></p>
      <p>Date: ${eventDate}</p>
      <p>Time: ${eventTime}</p>
      <p>Don't forget to attend!</p>
      <p>Best regards,<br>Campus Event Team</p>
    `
  },
  
  eventCancellation: {
    subject: 'Event Cancellation Notice',
    template: (name, eventTitle) => `
      <h2>Event Cancellation</h2>
      <p>Hi ${name},</p>
      <p>We regret to inform you that the following event has been cancelled:</p>
      <p><strong>${eventTitle}</strong></p>
      <p>We apologize for any inconvenience caused.</p>
      <p>Best regards,<br>Campus Event Team</p>
    `
  },
  
  passwordReset: {
    subject: 'Password Reset Request',
    template: (name, resetLink) => `
      <h2>Password Reset</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Campus Event Team</p>
    `
  }
};

module.exports = {
  createTransporter,
  emailTemplates,
  emailConfig
};
