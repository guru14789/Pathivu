import * as ExcelJS from 'exceljs';
import { differenceInHours } from 'date-fns';

export async function generateFaultExcel(faults: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Fault Report');

  sheet.columns = [
    { header: 'Fault ID', key: 'fault_id', width: 36 },
    { header: 'Asset Tag', key: 'asset_tag', width: 15 },
    { header: 'Fault Type', key: 'fault_type', width: 15 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Reported By', key: 'reported_by', width: 20 },
    { header: 'Reported At', key: 'reported_at', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Resolved At', key: 'resolved_at', width: 15 },
    { header: 'Res. Time (Hrs)', key: 'resolution_time_hours', width: 15 },
  ];

  faults.forEach(fault => {
    let resTime = null;
    if (fault.resolved_at && fault.reported_at) {
      resTime = differenceInHours(new Date(fault.resolved_at), new Date(fault.reported_at));
    }

    sheet.addRow({
      fault_id: fault.fault_id,
      asset_tag: fault.asset_tag,
      fault_type: fault.fault_type,
      severity: fault.severity,
      reported_by: fault.reporter_name || 'Anonymous',
      reported_at: new Date(fault.reported_at).toLocaleString(),
      status: fault.status,
      resolved_at: fault.resolved_at ? new Date(fault.resolved_at).toLocaleString() : 'N/A',
      resolution_time_hours: resTime,
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook;
}
