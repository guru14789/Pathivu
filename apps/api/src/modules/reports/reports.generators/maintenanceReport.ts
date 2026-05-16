import * as ExcelJS from 'exceljs';

export async function generateMaintenanceExcel(logs: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Maintenance Report');

  sheet.columns = [
    { header: 'Asset Tag', key: 'asset_tag', width: 15 },
    { header: 'Type', key: 'maintenance_type', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Scheduled Date', key: 'scheduled_date', width: 15 },
    { header: 'Completed Date', key: 'completed_date', width: 15 },
    { header: 'Downtime (Hrs)', key: 'downtime_hours', width: 15 },
    { header: 'Cost', key: 'cost', width: 10 },
    { header: 'Technician', key: 'technician', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  logs.forEach(log => {
    sheet.addRow({
      asset_tag: log.asset_tag,
      maintenance_type: log.maintenance_type,
      priority: log.priority,
      status: log.status,
      scheduled_date: log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : 'N/A',
      completed_date: log.completed_at ? new Date(log.completed_at).toLocaleDateString() : 'N/A',
      downtime_hours: log.downtime_hours,
      cost: log.actual_cost,
      technician: log.assigned_to_name,
      notes: log.remarks,
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook;
}
