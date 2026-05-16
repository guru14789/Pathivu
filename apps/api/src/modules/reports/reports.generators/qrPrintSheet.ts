import puppeteer from 'puppeteer';

export async function generateQRPrintSheetPDF(assets: any[]) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
        .tile { 
          width: 45mm; 
          height: 70mm; 
          border: 0.1mm solid #ccc; 
          padding: 3mm; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          text-align: center;
          page-break-inside: avoid;
        }
        .qr { width: 35mm; height: 35mm; margin-bottom: 2mm; }
        .tag { font-weight: bold; font-size: 14pt; margin-bottom: 1mm; }
        .name { font-size: 10pt; color: #555; height: 8mm; overflow: hidden; }
        .serial { font-size: 8pt; color: #888; }
        .hospital { font-size: 8pt; font-weight: bold; margin-top: auto; }
      </style>
    </head>
    <body>
      <div class="grid">
        ${assets.map(asset => `
          <div class="tile">
            <img class="qr" src="${asset.qr_image_url}" />
            <div class="tag">${asset.asset_tag}</div>
            <div class="name">${asset.name}</div>
            <div class="serial">SN: ${asset.serial_number || 'N/A'}</div>
            <div class="hospital">${asset.hospital_name}</div>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
  return pdf;
}
