import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

export async function generateQRCode(assetTag: string, scanUrl: string): Promise<Buffer> {
  return await QRCode.toBuffer(scanUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#04342C',
      light: '#FFFFFF',
    },
  });
}

export async function generateBarcode(assetTag: string, format: 'code128' | 'ean13'): Promise<Buffer> {
  return await bwipjs.toBuffer({
    bcid: format,
    text: assetTag,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });
}
