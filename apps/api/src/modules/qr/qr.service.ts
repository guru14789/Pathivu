import { db } from '../../db/index.js';
import { assets, qrCodes, auditLogs } from '../../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { NotFoundError, AppError, ValidationError } from '../../lib/errors.js';
import { generateQRCode, generateBarcode } from './qr.generators.js';
import { logAudit } from '../../lib/audit.js';
import { r2 } from '../../lib/r2.js';

export const qrService = {
  async generate(assetId: string, format: 'qr' | 'barcode_code128' | 'barcode_ean13', userId: string) {
    const [asset] = await db.select().from(assets).where(eq(assets.asset_id, assetId)).limit(1);
    if (!asset) throw new NotFoundError('Asset not found');

    const scanUrl = `${process.env.QR_SCAN_BASE_URL}/${asset.asset_tag}`;
    let buffer: Buffer;

    if (format === 'qr') {
      buffer = await generateQRCode(asset.asset_tag, scanUrl);
    } else {
      buffer = await generateBarcode(asset.asset_tag, format === 'barcode_code128' ? 'code128' : 'ean13');
    }

    const key = `qr/${asset.hospital_id}/${asset.asset_id}-${Date.now()}.png`;
    const publicUrl = await r2.uploadBuffer(key, buffer, 'image/png');

    // Deactivate previous codes
    await db.update(qrCodes).set({ is_active: false }).where(eq(qrCodes.asset_id, assetId));

    const [qrCode] = await db.insert(qrCodes).values({
      asset_id: assetId,
      format,
      r2_key: key,
      r2_url: publicUrl,
      generated_by: userId,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'qr_codes',
      record_id: qrCode.qr_id,
      new_values: qrCode
    });

    return { ...qrCode, asset_tag: asset.asset_tag };
  },

  async bulkGenerate(assetIds: string[], format: any, userId: string) {
    if (assetIds.length > 50) throw new ValidationError('Max 50 assets per request');

    const results = [];
    for (const id of assetIds) {
      try {
        const res = await this.generate(id, format, userId);
        results.push({ asset_id: id, asset_tag: res.asset_tag, qr_url: res.r2_url });
      } catch (err) {
        results.push({ asset_id: id, error: 'Failed' });
      }
    }
    return results;
  },

  async getActiveByAssetId(assetId: string) {
    return await db.select().from(qrCodes).where(and(eq(qrCodes.asset_id, assetId), eq(qrCodes.is_active, true))).limit(1);
  },

  async incrementPrintCount(qrId: string) {
    const [qr] = await db.update(qrCodes)
      .set({ print_count: sql`${qrCodes.print_count} + 1` })
      .where(eq(qrCodes.qr_id, qrId))
      .returning();
    return qr;
  }
};
