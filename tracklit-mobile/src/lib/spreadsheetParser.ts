import * as XLSX from 'xlsx';

export type SheetTemplate = 'simple' | 'advanced';

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
  detectedTemplate: SheetTemplate;
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

export function detectTemplateFromRows(dataRows: string[][]): SheetTemplate {
  const sample = dataRows.slice(0, 10);
  if (sample.length === 0) return 'advanced';

  let advancedCount = 0;
  for (const row of sample) {
    const hasAdvancedCols = (row[2] || '').trim() !== '' ||
      (row[3] || '').trim() !== '' ||
      (row[4] || '').trim() !== '' ||
      (row[5] || '').trim() !== '' ||
      (row[6] || '').trim() !== '';
    if (hasAdvancedCols) advancedCount++;
  }

  return advancedCount >= Math.ceil(sample.length * 0.3) ? 'advanced' : 'simple';
}

function mapSimpleRowsToSessions(dataRows: string[][]): ParsedSession[] {
  return dataRows.map((row, index) => {
    const dateValue = (row[0] || '').replace(/^"|"$/g, '').trim();
    const sessionText = (row[1] || '').replace(/^"|"$/g, '').trim();
    const isRestDay = !dateValue || !sessionText;

    return {
      dayNumber: index + 1,
      date: dateValue,
      columnA: dateValue,
      columnB: sessionText,
      columnC: '',
      columnD: '',
      columnE: '',
      columnF: '',
      columnG: '',
      preActivation1: '',
      preActivation2: '',
      shortDistanceWorkout: '',
      mediumDistanceWorkout: '',
      longDistanceWorkout: '',
      extraSession: '',
      gymData: [],
      isRestDay,
      title: dateValue ? `${dateValue} Training` : `Day ${index + 1}`,
      description: sessionText || (isRestDay ? 'Rest and Recovery' : ''),
    };
  });
}

function mapAdvancedRowsToSessions(dataRows: string[][]): ParsedSession[] {
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
  const detectedTemplate = detectTemplateFromRows(dataRows);
  const sessions = detectedTemplate === 'simple'
    ? mapSimpleRowsToSessions(dataRows)
    : mapAdvancedRowsToSessions(dataRows);

  return {
    title: title || 'My Training Program',
    totalSessions: sessions.length,
    sessions,
    detectedTemplate,
  };
}

export function parseXLSXBase64(base64: string, title?: string): ParsedSpreadsheet {
  const workbook = XLSX.read(base64, { type: 'base64' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in the workbook');

  const sheet = workbook.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length === 0) throw new Error('Empty spreadsheet');

  const stringRows = rows.map((row) => row.map((cell) => String(cell ?? '')));
  const dataRows = stringRows.length > 1 ? stringRows.slice(1) : stringRows;
  const detectedTemplate = detectTemplateFromRows(dataRows);
  const sessions = detectedTemplate === 'simple'
    ? mapSimpleRowsToSessions(dataRows)
    : mapAdvancedRowsToSessions(dataRows);

  return {
    title: title || sheetName || 'My Training Program',
    totalSessions: sessions.length,
    sessions,
    detectedTemplate,
  };
}
