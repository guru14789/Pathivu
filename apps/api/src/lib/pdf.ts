import puppeteer from 'puppeteer';
import { db } from '../db/index.js';
import { assets, qrCodes } from '../db/schema/index.js';
import { eq, inArray } from 'drizzle-orm';
import { NotFoundError } from '../lib/errors.js';

export const pdfService = {
  async generateQRSheet(assetIds: string[]) {
    const assetData = await db.select({
      id: assets.asset_id,
      name: assets.name,
      tag: assets.asset_tag,
      serial: assets.serial_number,
      qrUrl: qrCodes.r2_url
    })
    .from(assets)
    .leftJoin(qrCodes, eq(assets.asset_id, qrCodes.asset_id))
    .where(inArray(assets.asset_id, assetIds));

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
            .label { border: 1px solid #eee; padding: 10px; text-align: center; }
            img { width: 100px; height: 100px; }
            .tag { font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 5px; }
            .name { font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          ${assetData.map(a => `
            <div class="label">
              <img src="${a.qrUrl}" />
              <div class="tag">${a.tag}</div>
              <div class="name">${a.name}</div>
              <div class="name">SN: ${a.serial || 'N/A'}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return pdf;
  }
};
