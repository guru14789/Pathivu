import * as ExcelJS from 'exceljs';
import { differenceInDays } from 'date-fns';

export async function generateComplianceExcel(docs: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Compliance Report');

  sheet.columns = [
    { header: 'Certificate Type', key: 'cert_type', width: 20 },
    { header: 'Asset', key: 'asset', width: 25 },
    { header: 'Issued By', key: 'issued_by', width: 20 },
    { header: 'Issued Date', key: 'issued_date', width: 15 },
    { header: 'Expiry Date', key: 'expiry_date', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Days Until Expiry', key: 'days_until_expiry', width: 18 },
  ];

  docs.forEach(doc => {
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    const row = sheet.addRow({
      cert_type: doc.cert_type,
      asset: doc.asset_tag ? `${doc.asset_name} (${doc.asset_tag})` : 'Hospital Level',
      issued_by: doc.issued_by,
      issued_date: doc.issued_date ? new Date(doc.issued_date).toLocaleDateString() : 'N/A',
      expiry_date: new Date(doc.expiry_date).toLocaleDateString(),
      status: doc.status.toUpperCase(),
      days_until_expiry: days,
    });

    // Color coding
    const statusCell = row.getCell('status');
    if (doc.status === 'expired') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Light red
      statusCell.font = { color: { argb: 'FF9C0006' } }; // Dark red
    } else if (doc.status === 'expiring_soon') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }; // Light amber
      statusCell.font = { color: { argb: 'FF9C6500' } }; // Dark amber
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Light green
      statusCell.font = { color: { argb: 'FF006100' } }; // Dark green
    }
  });

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook;
}
