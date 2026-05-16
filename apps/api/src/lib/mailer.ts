import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@bewell.in',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Email send failure:', error);
  }
}

export async function sendFaultAlert({ fault, asset, reporter, adminEmails }: any) {
  const html = `
    <h2>Critical Fault Reported</h2>
    <p><strong>Asset:</strong> ${asset.name} (${asset.asset_tag})</p>
    <p><strong>Severity:</strong> ${fault.severity}</p>
    <p><strong>Reported By:</strong> ${reporter.full_name}</p>
    <p><strong>Description:</strong> ${fault.description}</p>
    <p><a href="${process.env.FRONTEND_URL}/faults/${fault.fault_id}">View Fault Details</a></p>
  `;

  for (const email of adminEmails) {
    await sendMail({ to: email, subject: `CRITICAL FAULT: ${asset.asset_tag}`, html });
  }
}

export async function sendPpmAlert({ asset, daysUntilDue, adminEmail }: any) {
  const html = `
    <h2>PPM Maintenance Due Soon</h2>
    <p><strong>Asset:</strong> ${asset.name} (${asset.asset_tag})</p>
    <p><strong>Due In:</strong> ${daysUntilDue} days</p>
    <p><a href="${process.env.FRONTEND_URL}/assets/${asset.asset_id}">View Asset Details</a></p>
  `;

  await sendMail({ to: adminEmail, subject: `PPM DUE: ${asset.asset_tag}`, html });
}

export async function sendEscalationAlert({ fault, asset, supervisorEmails }: any) {
  const html = `
    <h2>Fault Escalation Alert</h2>
    <p>The following fault has been open for more than 4 hours without resolution:</p>
    <p><strong>Asset:</strong> ${asset.name} (${asset.asset_tag})</p>
    <p><strong>Severity:</strong> ${fault.severity}</p>
    <p><strong>Reported At:</strong> ${fault.reported_at}</p>
    <p><a href="${process.env.FRONTEND_URL}/faults/${fault.fault_id}">Take Action Now</a></p>
  `;

  for (const email of supervisorEmails) {
    await sendMail({ to: email, subject: `ESCALATION: ${asset.asset_tag} Overdue`, html });
  }
}

export async function sendComplianceAlert({ certType, assetTag, daysUntilDue, adminEmail }: any) {
  const html = `
    <h2>Compliance Document Expiry Alert</h2>
    <p><strong>Certification Type:</strong> ${certType}</p>
    ${assetTag ? `<p><strong>Asset Tag:</strong> ${assetTag}</p>` : '<p><strong>Scope:</strong> Hospital-wide</p>'}
    <p><strong>Status:</strong> Expiring in ${daysUntilDue} days</p>
    <p>Please upload the renewed certificate to maintain compliance status.</p>
    <p><a href="${process.env.FRONTEND_URL}/compliance">View Compliance Dashboard</a></p>
  `;

  await sendMail({ 
    to: adminEmail, 
    subject: `COMPLIANCE EXPIRY: ${certType} ${assetTag ? `(${assetTag})` : ''}`, 
    html 
  });
}

export async function sendLowStockAlert({ partName, currentQty, threshold, adminEmail }: any) {
  const html = `
    <h2>Low Stock Warning</h2>
    <p><strong>Part Name:</strong> ${partName}</p>
    <p><strong>Current Quantity:</strong> ${currentQty}</p>
    <p><strong>Reorder Threshold:</strong> ${threshold}</p>
    <p>Please reorder this part to ensure maintenance continuity.</p>
    <p><a href="${process.env.FRONTEND_URL}/inventory">View Inventory Dashboard</a></p>
  `;

  await sendMail({ 
    to: adminEmail, 
    subject: `LOW STOCK: ${partName}`, 
    html 
  });
}
