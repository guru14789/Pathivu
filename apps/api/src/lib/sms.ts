import twilio from 'twilio';
import { logger } from './logger.js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  process.env.TWILIO_AUTH_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);

export async function sendSMS(to: string, body: string) {
  if (process.env.ALERT_SMS_ENABLED !== 'true') {
    logger.info('SMS disabled, skipping:', { to, body });
    return;
  }

  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to,
    });
    logger.info(`SMS sent to ${to}`);
  } catch (error) {
    logger.error('SMS send failure:', error);
  }
}
