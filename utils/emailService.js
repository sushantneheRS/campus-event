const { createTransporter, emailTemplates } = require('../config/email');
const { logger } = require('../middleware/errorHandler');

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  // Send email with template
  async sendEmail(to, templateName, templateData, customSubject = null) {
    try {
      const template = emailTemplates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const subject = customSubject || template.subject;
      const html = template.template(...templateData);

      const mailOptions = {
        from: `${process.env.APP_NAME} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        template: templateName
      });

      return result;
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        to,
        template: templateName
      });
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'welcome',
      [user.firstName]
    );
  }

  // Send event registration confirmation
  async sendRegistrationConfirmation(user, event) {
    const eventDate = new Date(event.startDate).toLocaleDateString();
    return this.sendEmail(
      user.email,
      'eventRegistration',
      [user.firstName, event.title, eventDate]
    );
  }

  // Send event reminder
  async sendEventReminder(user, event) {
    const eventDate = new Date(event.startDate).toLocaleDateString();
    const eventTime = new Date(event.startDate).toLocaleTimeString();
    return this.sendEmail(
      user.email,
      'eventReminder',
      [user.firstName, event.title, eventDate, eventTime]
    );
  }

  // Send event cancellation notice
  async sendEventCancellation(user, event) {
    return this.sendEmail(
      user.email,
      'eventCancellation',
      [user.firstName, event.title]
    );
  }

  // Send password reset email
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
    return this.sendEmail(
      user.email,
      'passwordReset',
      [user.firstName, resetUrl]
    );
  }

  // Send custom email
  async sendCustomEmail(to, subject, message) {
    try {
      const mailOptions = {
        from: `${process.env.APP_NAME} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: message
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Custom email sent successfully to ${to}`, {
        messageId: result.messageId,
        subject
      });

      return result;
    } catch (error) {
      logger.error('Custom email sending failed', {
        error: error.message,
        to,
        subject
      });
      throw error;
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, templateName, templateData, customSubject = null) {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(
          recipient.email,
          templateName,
          [recipient.firstName, ...templateData],
          customSubject
        );
        results.push({ email: recipient.email, success: true, messageId: result.messageId });
      } catch (error) {
        errors.push({ email: recipient.email, success: false, error: error.message });
      }
    }

    logger.info(`Bulk email completed`, {
      total: recipients.length,
      successful: results.length,
      failed: errors.length
    });

    return { results, errors };
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new EmailService();
