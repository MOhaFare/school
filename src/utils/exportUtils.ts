import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportMultipleSheetsToExcel = (sheets: { data: any[], sheetName: string }[], fileName: string) => {
  const wb = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    // If data is empty, create an empty sheet with a header indicating no data
    const dataToExport = sheet.data.length > 0 ? sheet.data : [{ "Message": "No data available" }];
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
