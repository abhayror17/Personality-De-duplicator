import { ExcelRow } from '../types';

declare const XLSX: any; // From CDN script

export const parseExcelFile = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
          return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedData: ExcelRow[] = json.map((row) => {
          // Find keys case-insensitively
          const originalKey = Object.keys(row).find(k => k.toLowerCase() === 'original');
          const duplicatesKey = Object.keys(row).find(k => k.toLowerCase() === 'duplicates');

          if (!originalKey || !duplicatesKey) {
            throw new Error("Excel file must contain 'Original' and 'Duplicates' columns.");
          }
          return {
            Original: String(row[originalKey]),
            Duplicates: String(row[duplicatesKey]),
          };
        });
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
