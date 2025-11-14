export interface ExcelRow {
  Original: string;
  Duplicates: string;
}

export type AnalysisStatus = 'SAME' | 'DIFFERENT' | 'ERROR';

export interface AnalysisResult extends ExcelRow {
  id: number;
  status: AnalysisStatus;
  sources: Source[];
}

export interface Source {
  uri: string;
  title: string;
}