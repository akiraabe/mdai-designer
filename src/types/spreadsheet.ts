// src/types/spreadsheet.ts
// SpreadsheetDataの型定義を共通化

export interface CellData {
  r: number;
  c: number;
  v: {
    v: any;
    m?: string;
    ct?: {
      fa: string;
      t: string;
    };
  } | any;
}

export interface SheetConfig {
  merge?: Record<string, any>;
  rowlen?: Record<string, number>;
  columnlen?: Record<string, number>;
  rowhidden?: Record<string, number>;
  colhidden?: Record<string, number>;
  borderInfo?: any[];
  authority?: Record<string, any>;
}

export interface SpreadsheetData {
  name: string;
  celldata?: CellData[];
  row: number;
  column: number;
  order: number;
  config?: SheetConfig;
  id: string;
  status: number;
  hide: number;
  defaultRowHeight: number;
  defaultColWidth: number;
  data?: any[][];
}