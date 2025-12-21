import * as XLSX from 'xlsx';

/**
 * Exports an array of objects to a single-sheet Excel file.
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 * @param sheetName Name of the worksheet
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exports data to a multi-sheet Excel file.
 * @param sheets Array of objects containing data and sheetName
 * @param fileName Name of the file (without extension)
 */
export const exportMultipleSheetsToExcel = (sheets: { data: any[], sheetName: string }[], fileName: string) => {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    // If data is empty, add a placeholder row so the sheet is created
    const data = sheet.data.length > 0 ? sheet.data : [{ "Info": "No data available for this section" }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
  });

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
