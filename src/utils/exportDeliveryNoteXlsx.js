// Excel Export for Delivery Notes
// Uses exceljs to generate a professional delivery note from template
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Helper to safely get value or fallback
const safe = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : v);

/**
 * Export a delivery note to Excel using the template
 * @param {Object} note - The delivery note data
 * @param {string} note.date - Delivery date (ISO string)
 * @param {string} note.vin - Vehicle VIN
 * @param {string} note.customerName - Customer name
 * @param {string} note.phone - Customer phone
 * @param {string} note.email - Customer/salesperson email
 * @param {string} note.invoiceNo - Invoice/Quote reference
 * @param {boolean} note.financialCleared - Whether financial is cleared
 * @param {string} note.by - Prepared by (employee name)
 * @param {Array} note.items - Array of items with description, quantity, notes
 */
export async function exportDeliveryNoteXlsx(note) {
  // Create a new workbook and worksheet (no template, create from scratch)
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Delivery Note');

  // Set column widths
  ws.columns = [
    { width: 6 },   // A - #
    { width: 12 },  // B - Description start
    { width: 12 },  // C
    { width: 12 },  // D
    { width: 12 },  // E
    { width: 12 },  // F - Description end
    { width: 10 },  // G - Quantity
    { width: 20 },  // H - Notes/By
  ];

  // Add logo as header
  try {
    const logoRes = await fetch('/gm-header.png');
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBuffer = await logoBlob.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: logoBuffer,
        extension: 'png',
      });
      ws.addImage(imageId, {
        tl: { col: 0.2, row: 0.2 },
        ext: { width: 180, height: 50 },
      });
    }
  } catch (e) {
    console.log('Logo not loaded:', e);
  }

  // Title styling
  ws.mergeCells('A1:H1');
  ws.getRow(1).height = 55;

  // Company header
  ws.mergeCells('D1:H1');
  const titleCell = ws.getCell('D1');
  titleCell.value = 'GILANI MOBILITY\nDelivery Note';
  titleCell.font = { bold: true, size: 16, color: { argb: '1F4E79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };

  // Row 2 - spacer
  ws.getRow(2).height = 10;

  // Row 3 - Date
  ws.getCell('A3').value = 'Date:';
  ws.getCell('A3').font = { bold: true };
  ws.getCell('B3').value = note.date ? new Date(note.date).toLocaleDateString('en-GB') : '';
  ws.getCell('B3').alignment = { horizontal: 'left' };

  // Row 4 - Customer Name
  ws.getCell('E4').value = 'Customer:';
  ws.getCell('E4').font = { bold: true };
  ws.mergeCells('F4:H4');
  ws.getCell('F4').value = safe(note.customerName);
  ws.getCell('F4').alignment = { horizontal: 'left' };

  // Row 5 - VIN & Phone
  ws.getCell('A5').value = 'VIN:';
  ws.getCell('A5').font = { bold: true };
  ws.mergeCells('B5:C5');
  ws.getCell('B5').value = safe(note.vin, 'N/A');

  ws.getCell('E5').value = 'Phone:';
  ws.getCell('E5').font = { bold: true };
  ws.mergeCells('F5:H5');
  ws.getCell('F5').value = safe(note.phone);

  // Row 6 - Email
  ws.getCell('E6').value = 'Email:';
  ws.getCell('E6').font = { bold: true };
  ws.mergeCells('F6:H6');
  ws.getCell('F6').value = safe(note.email);

  // Row 7 - Vehicle info
  ws.getCell('A7').value = 'Vehicle:';
  ws.getCell('A7').font = { bold: true };
  ws.mergeCells('B7:D7');
  ws.getCell('B7').value = safe(note.vehicle);

  // Row 8 - spacer
  ws.getRow(8).height = 10;

  // Row 9 - Items header
  ws.getRow(9).height = 25;
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  ws.getCell('A9').value = '#';
  ws.getCell('A9').style = headerStyle;
  ws.mergeCells('B9:F9');
  ws.getCell('B9').value = 'Description';
  ws.getCell('B9').style = headerStyle;
  ws.getCell('G9').value = 'Qty';
  ws.getCell('G9').style = headerStyle;
  ws.getCell('H9').value = 'Notes';
  ws.getCell('H9').style = headerStyle;

  // Items rows starting at row 10
  const startRow = 10;
  const items = note.items && note.items.length > 0 ? note.items : [{ description: '', quantity: '', notes: '' }];

  const itemStyle = {
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: { vertical: 'middle' },
  };

  for (let i = 0; i < items.length; i++) {
    const rowIdx = startRow + i;
    const row = ws.getRow(rowIdx);
    row.height = 22;

    ws.getCell(`A${rowIdx}`).value = i + 1;
    ws.getCell(`A${rowIdx}`).style = { ...itemStyle, alignment: { horizontal: 'center', vertical: 'middle' } };

    ws.mergeCells(`B${rowIdx}:F${rowIdx}`);
    ws.getCell(`B${rowIdx}`).value = safe(items[i].description);
    ws.getCell(`B${rowIdx}`).style = { ...itemStyle, alignment: { horizontal: 'left', vertical: 'middle' } };

    ws.getCell(`G${rowIdx}`).value = safe(items[i].quantity);
    ws.getCell(`G${rowIdx}`).style = { ...itemStyle, alignment: { horizontal: 'center', vertical: 'middle' } };

    ws.getCell(`H${rowIdx}`).value = safe(items[i].notes);
    ws.getCell(`H${rowIdx}`).style = { ...itemStyle, alignment: { horizontal: 'left', vertical: 'middle' } };
  }

  // Add a few empty rows for manual additions
  for (let i = 0; i < 3; i++) {
    const rowIdx = startRow + items.length + i;
    const row = ws.getRow(rowIdx);
    row.height = 22;

    ws.getCell(`A${rowIdx}`).style = itemStyle;
    ws.mergeCells(`B${rowIdx}:F${rowIdx}`);
    ws.getCell(`B${rowIdx}`).style = itemStyle;
    ws.getCell(`G${rowIdx}`).style = itemStyle;
    ws.getCell(`H${rowIdx}`).style = itemStyle;
  }

  const footerStartRow = startRow + items.length + 5;

  // Financial Cleared row
  ws.getCell(`A${footerStartRow}`).value = 'Financial Cleared:';
  ws.getCell(`A${footerStartRow}`).font = { bold: true };
  ws.mergeCells(`B${footerStartRow}:C${footerStartRow}`);
  ws.getCell(`B${footerStartRow}`).value = note.financialCleared ? 'YES' : 'NO';
  ws.getCell(`B${footerStartRow}`).font = { bold: true, color: { argb: note.financialCleared ? '008000' : 'FF0000' } };

  ws.getCell(`G${footerStartRow}`).value = 'By:';
  ws.getCell(`G${footerStartRow}`).font = { bold: true };
  ws.getCell(`H${footerStartRow}`).value = safe(note.by);

  // Invoice row
  ws.getCell(`A${footerStartRow + 2}`).value = 'Invoice/Quote No:';
  ws.getCell(`A${footerStartRow + 2}`).font = { bold: true };
  ws.mergeCells(`B${footerStartRow + 2}:C${footerStartRow + 2}`);
  ws.getCell(`B${footerStartRow + 2}`).value = safe(note.invoiceNo);
  ws.getCell(`B${footerStartRow + 2}`).font = { bold: true };

  // Signature lines
  const sigRow = footerStartRow + 5;
  ws.getCell(`A${sigRow}`).value = 'Prepared By:';
  ws.getCell(`A${sigRow}`).font = { bold: true };
  ws.mergeCells(`B${sigRow}:C${sigRow}`);
  ws.getCell(`B${sigRow}`).border = { bottom: { style: 'thin' } };

  ws.getCell(`E${sigRow}`).value = 'Received By:';
  ws.getCell(`E${sigRow}`).font = { bold: true };
  ws.mergeCells(`F${sigRow}:H${sigRow}`);
  ws.getCell(`F${sigRow}`).border = { bottom: { style: 'thin' } };

  // Date lines
  ws.getCell(`A${sigRow + 2}`).value = 'Date:';
  ws.getCell(`A${sigRow + 2}`).font = { bold: true };
  ws.mergeCells(`B${sigRow + 2}:C${sigRow + 2}`);
  ws.getCell(`B${sigRow + 2}`).border = { bottom: { style: 'thin' } };

  ws.getCell(`E${sigRow + 2}`).value = 'Date:';
  ws.getCell(`E${sigRow + 2}`).font = { bold: true };
  ws.mergeCells(`F${sigRow + 2}:H${sigRow + 2}`);
  ws.getCell(`F${sigRow + 2}`).border = { bottom: { style: 'thin' } };

  // Footer note
  ws.getCell(`A${sigRow + 5}`).value = 'Thank you for choosing Gilani Mobility!';
  ws.mergeCells(`A${sigRow + 5}:H${sigRow + 5}`);
  ws.getCell(`A${sigRow + 5}`).font = { italic: true, color: { argb: '666666' } };
  ws.getCell(`A${sigRow + 5}`).alignment = { horizontal: 'center' };

  // Export
  const outBuffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([outBuffer]), `DeliveryNote_${safe(note.invoiceNo, 'Unknown').replace(/[^a-zA-Z0-9-]/g, '_')}.xlsx`);
}
