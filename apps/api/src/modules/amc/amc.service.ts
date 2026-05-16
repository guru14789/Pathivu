import { db } from '../../db/index.js';
import { amcContracts, vendors, auditLogs } from '../../db/schema/index.js';
import { eq, and, sql, desc, lte } from 'drizzle-orm';
import { AppError } from '../../lib/errors.js';
import { r2 } from '../../lib/r2.js';
import { logAudit } from '../../lib/audit.js';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays } from 'date-fns';

export class AMCService {
  async list(filters: { vendor_id?: string; hospital_id?: string; expiring_within?: number; is_active?: boolean }) {
    let whereClause = undefined;
    
    if (filters.vendor_id) whereClause = eq(amcContracts.vendor_id, filters.vendor_id);
    if (filters.hospital_id) {
      const hLimit = eq(amcContracts.hospital_id, filters.hospital_id);
      whereClause = whereClause ? and(whereClause, hLimit) : hLimit;
    }
    if (filters.is_active !== undefined) {
      const aLimit = eq(amcContracts.is_active, filters.is_active);
      whereClause = whereClause ? and(whereClause, aLimit) : aLimit;
    }
    if (filters.expiring_within) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + filters.expiring_within);
      const eLimit = lte(amcContracts.end_date, expiryDate.toISOString().split('T')[0]);
      whereClause = whereClause ? and(whereClause, eLimit) : eLimit;
    }

    const data = await db.select({
      contract: amcContracts,
      vendor_name: vendors.name,
    })
    .from(amcContracts)
    .leftJoin(vendors, eq(amcContracts.vendor_id, vendors.vendor_id))
    .where(whereClause)
    .orderBy(desc(amcContracts.end_date));

    return data.map(item => ({
      ...item.contract,
      vendor_name: item.vendor_name,
      days_until_expiry: differenceInDays(new Date(item.contract.end_date), new Date())
    }));
  }

  async create(data: any, file: Express.Multer.File | undefined, userId: string) {
    let document_url = null;
    if (file) {
      const key = `docs/${data.hospital_id}/amc-${uuidv4()}.pdf`;
      document_url = await r2.uploadBuffer(key, file.buffer, file.mimetype);
    }

    const [newContract] = await db.insert(amcContracts).values({
      ...data,
      document_url,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'amc_contracts',
      record_id: newContract.contract_id,
      new_values: newContract
    });

    return newContract;
  }

  async update(id: string, data: any, userId: string) {
    const [oldContract] = await db.select().from(amcContracts).where(eq(amcContracts.contract_id, id));
    if (!oldContract) throw new AppError('NOT_FOUND', 'Contract not found', 404);

    const [updatedContract] = await db.update(amcContracts)
      .set(data)
      .where(eq(amcContracts.contract_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'amc_contracts',
      record_id: id,
      old_values: oldContract,
      new_values: updatedContract
    });

    return updatedContract;
  }
}

export const amcService = new AMCService();
