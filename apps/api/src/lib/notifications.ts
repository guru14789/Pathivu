import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const notifications = {
  async sendEmail(to: string, subject: string, text: string) {
    try {
      await transporter.sendMail({
        from: `"BeWell AssetIQ" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        text,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send email', error);
    }
  },

  async sendSMS(to: string, message: string) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      logger.info(`SMS sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send SMS', error);
    }
  }
};
