import { db } from '../../db/index.js';
import { assets, assetCategories, locations, hospitals, vendors, maintenanceLogs, users, complianceDocuments, faultReports } from '../../db/schema/index.js';
import { eq, and, sql, desc, between, inArray } from 'drizzle-orm';
import { generateAssetRegisterExcel } from './reports.generators/assetRegister.js';
import { generateMaintenanceExcel } from './reports.generators/maintenanceReport.js';
import { generateComplianceExcel } from './reports.generators/complianceReport.js';
import { generateFaultExcel } from './reports.generators/faultReport.js';
import { generateQRPrintSheetPDF } from './reports.generators/qrPrintSheet.js';
import { AppError } from '../../lib/errors.js';

export class ReportsService {
  async getAssetRegisterData(hospital_id?: string, category_id?: string) {
    let whereClause = undefined;
    if (hospital_id) whereClause = eq(assets.hospital_id, hospital_id);
    if (category_id) {
      const cLimit = eq(assets.category_id, category_id);
      whereClause = whereClause ? and(whereClause, cLimit) : cLimit;
    }

    return await db.select({
      asset_id: assets.asset_id,
      asset_tag: assets.asset_tag,
      name: assets.name,
      serial_number: assets.serial_number,
      purchase_date: assets.purchase_date,
      purchase_cost: assets.purchase_cost,
      useful_life_years: assets.useful_life_years,
      salvage_value: assets.salvage_value,
      depreciation_method: assets.depreciation_method,
      status: assets.status,
      condition: assets.condition,
      warranty_expiry: assets.warranty_expiry,
      category_name: assetCategories.name,
      location_name: sql<string>`concat(${locations.building}, ' - ', ${locations.floor}, ' - ', ${locations.department})`,
      vendor_name: vendors.name,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.category_id, assetCategories.category_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .leftJoin(vendors, eq(assets.vendor_id, vendors.vendor_id))
    .where(whereClause)
    .orderBy(assets.asset_tag);
  }

  async getMaintenanceData(hospital_id: string, from: string, to: string) {
    return await db.select({
      asset_tag: assets.asset_tag,
      maintenance_type: maintenanceLogs.maintenance_type,
      priority: maintenanceLogs.priority,
      status: maintenanceLogs.status,
      scheduled_date: maintenanceLogs.scheduled_date,
      completed_at: maintenanceLogs.completed_date,
      downtime_hours: maintenanceLogs.downtime_hours,
      actual_cost: maintenanceLogs.cost,
      remarks: maintenanceLogs.technician_remarks,
      assigned_to_name: users.full_name,
    })
    .from(maintenanceLogs)
    .leftJoin(assets, eq(maintenanceLogs.asset_id, assets.asset_id))
    .leftJoin(users, eq(maintenanceLogs.assigned_to, users.user_id))
    .where(and(
      eq(maintenanceLogs.hospital_id, hospital_id),
      between(maintenanceLogs.scheduled_date, from, to)
    ))
    .orderBy(maintenanceLogs.scheduled_date);
  }

  async getComplianceData(hospital_id: string) {
    return await db.select({
      cert_type: complianceDocuments.cert_type,
      issued_by: complianceDocuments.issued_by,
      issued_date: complianceDocuments.issued_date,
      expiry_date: complianceDocuments.expiry_date,
      status: complianceDocuments.status,
      asset_name: assets.name,
      asset_tag: assets.asset_tag,
    })
    .from(complianceDocuments)
    .leftJoin(assets, eq(complianceDocuments.asset_id, assets.asset_id))
    .where(eq(complianceDocuments.hospital_id, hospital_id))
    .orderBy(complianceDocuments.expiry_date);
  }

  async getFaultData(hospital_id: string, from: string, to: string) {
    return await db.select({
      fault_id: faultReports.fault_id,
      asset_tag: assets.asset_tag,
      fault_type: faultReports.fault_type,
      severity: faultReports.severity,
      reported_at: faultReports.reported_at,
      status: faultReports.status,
      resolved_at: faultReports.resolved_at,
      reporter_name: users.full_name,
    })
    .from(faultReports)
    .leftJoin(assets, eq(faultReports.asset_id, assets.asset_id))
    .leftJoin(users, eq(faultReports.reported_by, users.user_id))
    .where(and(
      eq(faultReports.hospital_id, hospital_id),
      between(faultReports.reported_at, new Date(from), new Date(to))
    ))
    .orderBy(faultReports.reported_at);
  }

  async getQRPrintData(assetIds: string[]) {
    return await db.select({
      asset_tag: assets.asset_tag,
      name: assets.name,
      serial_number: assets.serial_number,
      qr_image_url: sql<string>`(SELECT qr_image_url FROM qr_codes WHERE asset_id = ${assets.asset_id})`,
      hospital_name: hospitals.name,
    })
    .from(assets)
    .leftJoin(hospitals, eq(assets.hospital_id, hospitals.hospital_id))
    .where(inArray(assets.asset_id, assetIds));
  }
}

export const reportsService = new ReportsService();
