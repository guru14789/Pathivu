import { Router } from 'express';
import { reportsService } from './reports.service.js';
import { generateAssetRegisterExcel } from './reports.generators/assetRegister.js';
import { generateMaintenanceExcel } from './reports.generators/maintenanceReport.js';
import { generateComplianceExcel } from './reports.generators/complianceReport.js';
import { generateFaultExcel } from './reports.generators/faultReport.js';
import { generateQRPrintSheetPDF } from './reports.generators/qrPrintSheet.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { AppError } from '../../lib/errors.js';

const router = Router();

router.get('/assets', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const data = await reportsService.getAssetRegisterData(
      req.query.hospital_id as string,
      req.query.category_id as string
    );
    
    if (req.query.format === 'xlsx') {
      const workbook = await generateAssetRegisterExcel(data);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=asset-register.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      throw new AppError('INVALID_FORMAT', 'Only XLSX format is supported for asset register', 400);
    }
  } catch (error) {
    next(error);
  }
});

router.get('/maintenance', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const { hospital_id, from, to } = req.query as any;
    if (!hospital_id || !from || !to) throw new AppError('MISSING_PARAMS', 'hospital_id, from, and to are required', 400);

    const data = await reportsService.getMaintenanceData(hospital_id, from, to);
    const workbook = await generateMaintenanceExcel(data);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=maintenance-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

router.get('/compliance', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const { hospital_id } = req.query as any;
    if (!hospital_id) throw new AppError('MISSING_PARAMS', 'hospital_id is required', 400);

    const data = await reportsService.getComplianceData(hospital_id);
    const workbook = await generateComplianceExcel(data);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=compliance-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

router.get('/faults', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const { hospital_id, from, to } = req.query as any;
    if (!hospital_id || !from || !to) throw new AppError('MISSING_PARAMS', 'hospital_id, from, and to are required', 400);

    const data = await reportsService.getFaultData(hospital_id, from, to);
    const workbook = await generateFaultExcel(data);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=fault-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

router.post('/qr-print-sheet', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const { asset_ids } = req.body;
    if (!asset_ids || !Array.isArray(asset_ids)) throw new AppError('INVALID_INPUT', 'asset_ids must be an array', 400);
    if (asset_ids.length > 40) throw new AppError('LIMIT_EXCEEDED', 'Max 40 assets per sheet', 400);

    const data = await reportsService.getQRPrintData(asset_ids);
    const pdf = await generateQRPrintSheetPDF(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=qr-print-sheet.pdf');
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
