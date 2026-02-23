import * as XLSX from 'xlsx';

export interface ParsedSession {
  dayNumber: number;
  date: string;
  columnA: string;
  columnB: string;
  columnC: string;
  columnD: string;
  columnE: string;
  columnF: string;
  columnG: string;
  preActivation1: string;
  preActivation2: string;
  shortDistanceWorkout: string;
  mediumDistanceWorkout: string;
  longDistanceWorkout: string;
  extraSession: string;
  gymData: string[];
  isRestDay: boolean;
  title: string;
  description: string;
}

export interface ParsedSpreadsheet {
  title: string;
  totalSessions: number;
  sessions: ParsedSession[];
}

export function containsGymReference(text: string): {
  hasGym: boolean;
  gymNumber: number | null;
} {
  if (!text) return { hasGym: false, gymNumber: null };

  const gymMatch = text.match(/Gym\s+(\d+)/i);
  if (gymMatch && gymMatch[1]) {
    return { hasGym: true, gymNumber: parseInt(gymMatch[1], 10) };
  }

  return { hasGym: false, gymNumber: null };
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = i < csv.length - 1 ? csv[i + 1] : '';

    if (char === '"' && nextChar === '"') {
      currentCell += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;

      currentRow.push(currentCell);
      rows.push(currentRow);

      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function xlsxBufferToCSV(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheets found in the workbook');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(worksheet);
}

function mapRowsToSessions(dataRows: string[][]): ParsedSession[] {
  return dataRows.map((row, index) => {
    const dateValue = row[0] || '';
    let preActivation1 = row[1] || '';
    let preActivation2 = row[2] || '';
    let shortDistanceWorkout = row[3] || '';
    let mediumDistanceWorkout = row[4] || '';
    let longDistanceWorkout = row[5] || '';
    let extraSession = '';
    if (row.length > 6 && row[6] && row[6].trim() !== '') {
      extraSession = row[6];
    }

    [
      preActivation1,
      preActivation2,
      shortDistanceWorkout,
      mediumDistanceWorkout,
      longDistanceWorkout,
      extraSession,
    ] = [
      preActivation1,
      preActivation2,
      shortDistanceWorkout,
      mediumDistanceWorkout,
      longDistanceWorkout,
      extraSession,
    ].map((val) => val.replace(/^"|"$/g, ''));

    const gymData: string[] = [];
    const workoutFields = [
      shortDistanceWorkout,
      mediumDistanceWorkout,
      longDistanceWorkout,
      extraSession,
    ];

    for (const field of workoutFields) {
      const gymRef = containsGymReference(field);
      if (gymRef.hasGym && gymRef.gymNumber) {
        gymData.push(`Gym ${gymRef.gymNumber}`);
        break;
      }
    }

    const isRestDay =
      !dateValue ||
      dateValue.trim() === '' ||
      (!shortDistanceWorkout && !mediumDistanceWorkout && !longDistanceWorkout);

    return {
      dayNumber: index + 1,
      date: dateValue,
      columnA: dateValue,
      columnB: preActivation1,
      columnC: preActivation2,
      columnD: shortDistanceWorkout,
      columnE: mediumDistanceWorkout,
      columnF: longDistanceWorkout,
      columnG: extraSession,
      preActivation1,
      preActivation2,
      shortDistanceWorkout,
      mediumDistanceWorkout,
      longDistanceWorkout,
      extraSession,
      gymData,
      isRestDay,
      title: `Day ${index + 1} Training`,
      description: isRestDay ? 'Rest and Recovery' : 'Training Session',
    };
  });
}

export function parseCSVString(csvString: string, title?: string): ParsedSpreadsheet {
  const rows = parseCSV(csvString);
  if (rows.length === 0) {
    throw new Error('Empty spreadsheet');
  }

  const dataRows = rows.length > 1 ? rows.slice(1) : rows;
  const sessions = mapRowsToSessions(dataRows);

  return {
    title: title || 'My Training Program',
    totalSessions: sessions.length,
    sessions,
  };
}

export function parseXLSXBuffer(
  buffer: ArrayBuffer,
  title?: string,
): ParsedSpreadsheet {
  const csvString = xlsxBufferToCSV(buffer);
  return parseCSVString(csvString, title);
}

export function parseSpreadsheet(
  input: string | ArrayBuffer,
  fileName: string,
): ParsedSpreadsheet {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    if (typeof input !== 'string') {
      throw new Error('CSV input must be a string');
    }
    return parseCSVString(input, baseName);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    if (typeof input === 'string') {
      const bytes = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        bytes[i] = input.charCodeAt(i);
      }
      return parseXLSXBuffer(bytes.buffer as ArrayBuffer, baseName);
    }
    return parseXLSXBuffer(input, baseName);
  }

  throw new Error(`Unsupported file type: .${extension}`);
}
