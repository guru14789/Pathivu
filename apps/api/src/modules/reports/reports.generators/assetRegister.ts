import * as ExcelJS from 'exceljs';
import { getDepreciationSummary } from '../../../lib/depreciation.js';
import { addYears } from 'date-fns';

export async function generateAssetRegisterExcel(assets: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Asset Register');

  sheet.columns = [
    { header: 'Asset Tag', key: 'asset_tag', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Serial Number', key: 'serial_number', width: 20 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Location', key: 'location', width: 15 },
    { header: 'Purchase Date', key: 'purchase_date', width: 15 },
    { header: 'Cost', key: 'purchase_cost', width: 12 },
    { header: 'Useful Life (Yrs)', key: 'useful_life_years', width: 15 },
    { header: 'Depr. Method', key: 'depreciation_method', width: 12 },
    { header: 'Accumulated Depr.', key: 'accumulated_depreciation', width: 18 },
    { header: 'Book Value', key: 'book_value', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Condition', key: 'condition', width: 12 },
    { header: 'Warranty Expiry', key: 'warranty_expiry', width: 15 },
    { header: 'Vendor', key: 'vendor', width: 20 },
  ];

  assets.forEach(asset => {
    const depr = getDepreciationSummary(asset);
    sheet.addRow({
      asset_tag: asset.asset_tag,
      name: asset.name,
      serial_number: asset.serial_number,
      category: asset.category_name,
      location: asset.location_name,
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A',
      purchase_cost: asset.purchase_cost,
      useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method,
      accumulated_depreciation: depr.accumulatedDepreciation,
      book_value: depr.bookValue,
      status: asset.status,
      condition: asset.condition,
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A',
      vendor: asset.vendor_name,
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 2: Depreciation Schedule
  const scheduleSheet = workbook.addWorksheet('Depreciation Schedule');
  scheduleSheet.columns = [
    { header: 'Asset Tag', key: 'asset_tag', width: 15 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Opening Value', key: 'opening', width: 15 },
    { header: 'Depreciation', key: 'depreciation', width: 15 },
    { header: 'Closing Value', key: 'closing', width: 15 },
  ];

  assets.forEach(asset => {
    if (!asset.purchase_cost || !asset.useful_life_years) return;
    
    let currentVal = parseFloat(asset.purchase_cost);
    const life = parseInt(asset.useful_life_years);
    const method = asset.depreciation_method;
    const rate = 0.15; // Assume 15% for WDV if not specified, or use a field

    for (let i = 1; i <= life; i++) {
      let deprVal = 0;
      if (method === 'SLM') {
        deprVal = parseFloat(asset.purchase_cost) / life;
      } else {
        deprVal = currentVal * rate;
      }
      
      const closing = Math.max(0, currentVal - deprVal);
      scheduleSheet.addRow({
        asset_tag: asset.asset_tag,
        year: i,
        opening: currentVal.toFixed(2),
        depreciation: deprVal.toFixed(2),
        closing: closing.toFixed(2)
      });
      currentVal = closing;
      if (currentVal <= 0) break;
    }
  });

  return workbook;
}
