import { db } from '../../db/index.js';
import { complianceDocuments, assets } from '../../db/schema/index.js';
import { eq, and, sql, desc, lte, or, inArray } from 'drizzle-orm';
import { AppError } from '../../lib/errors.js';
import { r2 } from '../../lib/r2.js';
import { logAudit } from '../../lib/audit.js';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, isBefore, addDays } from 'date-fns';

export class ComplianceService {
  private computeStatus(expiryDate: string) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (isBefore(expiry, today)) return 'expired';
    if (isBefore(expiry, addDays(today, 30))) return 'expiring_soon';
    return 'valid';
  }

  async list(filters: { hospital_id?: string; status?: string; cert_type?: string; asset_id?: string; expiring_within?: number; grouped?: boolean }) {
    let whereClause = undefined;
    
    if (filters.hospital_id) whereClause = eq(complianceDocuments.hospital_id, filters.hospital_id);
    if (filters.status) {
      const sLimit = eq(complianceDocuments.status, filters.status as any);
      whereClause = whereClause ? and(whereClause, sLimit) : sLimit;
    }
    if (filters.cert_type) {
      const cLimit = eq(complianceDocuments.cert_type, filters.cert_type);
      whereClause = whereClause ? and(whereClause, cLimit) : cLimit;
    }
    if (filters.asset_id) {
      const aLimit = eq(complianceDocuments.asset_id, filters.asset_id);
      whereClause = whereClause ? and(whereClause, aLimit) : aLimit;
    }
    if (filters.expiring_within) {
      const expiryDate = addDays(new Date(), filters.expiring_within);
      const eLimit = lte(complianceDocuments.expiry_date, expiryDate.toISOString().split('T')[0]);
      whereClause = whereClause ? and(whereClause, eLimit) : eLimit;
    }

    const data = await db.select({
      doc: complianceDocuments,
      asset_name: assets.name,
      asset_tag: assets.asset_tag
    })
    .from(complianceDocuments)
    .leftJoin(assets, eq(complianceDocuments.asset_id, assets.asset_id))
    .where(whereClause)
    .orderBy(desc(complianceDocuments.expiry_date));

    const results = data.map(item => ({
      ...item.doc,
      asset_name: item.asset_name,
      asset_tag: item.asset_tag,
      days_until_expiry: differenceInDays(new Date(item.doc.expiry_date), new Date())
    }));

    if (filters.grouped) {
      return {
        valid: results.filter(r => r.status === 'valid'),
        expiring_soon: results.filter(r => r.status === 'expiring_soon'),
        expired: results.filter(r => r.status === 'expired'),
      };
    }

    return results;
  }

  async create(data: any, file: Express.Multer.File | undefined, userId: string) {
    let document_url = null;
    if (file) {
      const key = `docs/${data.hospital_id}/cert-${uuidv4()}.pdf`;
      document_url = await r2.uploadBuffer(key, file.buffer, file.mimetype);
    }

    const status = this.computeStatus(data.expiry_date);

    const [newDoc] = await db.insert(complianceDocuments).values({
      ...data,
      document_url,
      status,
      uploaded_by: userId,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'compliance_documents',
      record_id: newDoc.doc_id,
      new_values: newDoc
    });

    return newDoc;
  }

  async update(id: string, data: any, file: Express.Multer.File | undefined, userId: string) {
    const [oldDoc] = await db.select().from(complianceDocuments).where(eq(complianceDocuments.doc_id, id));
    if (!oldDoc) throw new AppError('NOT_FOUND', 'Compliance document not found', 404);

    let document_url = oldDoc.document_url;
    if (file) {
      const key = `docs/${oldDoc.hospital_id}/cert-${uuidv4()}.pdf`;
      document_url = await r2.uploadBuffer(key, file.buffer, file.mimetype);
      // Optional: Delete old document from R2 if needed
    }

    const status = data.expiry_date ? this.computeStatus(data.expiry_date) : oldDoc.status;

    const [updatedDoc] = await db.update(complianceDocuments)
      .set({
        ...data,
        document_url,
        status,
        alert_30_sent: data.expiry_date ? false : oldDoc.alert_30_sent,
        alert_60_sent: data.expiry_date ? false : oldDoc.alert_60_sent,
      })
      .where(eq(complianceDocuments.doc_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'compliance_documents',
      record_id: id,
      old_values: oldDoc,
      new_values: updatedDoc
    });

    return updatedDoc;
  }

  async delete(id: string, userId: string) {
    const [oldDoc] = await db.select().from(complianceDocuments).where(eq(complianceDocuments.doc_id, id));
    if (!oldDoc) throw new AppError('NOT_FOUND', 'Compliance document not found', 404);

    await db.delete(complianceDocuments).where(eq(complianceDocuments.doc_id, id));

    await logAudit({
      user_id: userId,
      action: 'DELETE',
      table_name: 'compliance_documents',
      record_id: id,
      old_values: oldDoc
    });

    return { success: true };
  }
}

export const complianceService = new ComplianceService();
