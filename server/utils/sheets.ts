import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';

// For newer versions of google-spreadsheet package that have changed APIs
interface SpreadsheetRow {
  get: (columnName: string) => string | undefined;
  [key: string]: any;
}

export async function fetchSpreadsheetData(sheetId: string) {
  try {
    // Use JavaScript dynamic import to load google-spreadsheet because
    // the package has major version differences that affect the API
    const GoogleSheetPkg = await import('google-spreadsheet');
    const { GoogleSpreadsheet } = GoogleSheetPkg;
    
    const doc = new GoogleSpreadsheet(sheetId);
    
    // Authenticate based on available credentials
    if (process.env.GOOGLE_API_KEY) {
      try {
        // For v3+ of the package
        await doc.useApiKey(process.env.GOOGLE_API_KEY);
      } catch (e) {
        // For v4+ of the package
        // @ts-ignore - we're accounting for API differences
        doc.apiKey = process.env.GOOGLE_API_KEY;
      }
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        // For v3+ of the package
        await doc.useServiceAccountAuth({
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
      } catch (e) {
        // For v4+ of the package
        // @ts-ignore - we're accounting for API differences
        await doc.authenticate({
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
      }
    } else {
      console.warn("No Google Sheets authentication method found. This may only work with public sheets.");
    }
    
    // Load document properties and sheets
    await doc.loadInfo();
    
    // Get the first sheet (most training programs will use the first sheet)
    const sheet = doc.sheetsByIndex[0];
    
    // Different sheet methods based on package version
    let rows: SpreadsheetRow[] = [];
    try {
      await sheet.loadCells();
      rows = await sheet.getRows();
    } catch (e) {
      // For newer versions
      try {
        await sheet.loadHeaderRow();
        rows = await sheet.getRows();
      } catch (e2) {
        console.error("Error loading sheet data:", e2);
        throw new Error("Failed to load sheet data");
      }
    }
    
    // Map spreadsheet data to our program session format
    const sessions = rows.map((row: any, index: number) => {
      let dateValue = '';
      let preActivation1 = '';
      let preActivation2 = '';
      let shortDistanceWorkout = '';
      let mediumDistanceWorkout = '';
      let longDistanceWorkout = '';
      let extraSession = '';
      
      // Try different methods to access row data based on package version
      try {
        // For older versions accessing _rawData
        if (row._rawData) {
          dateValue = row._rawData[0] || '';
          preActivation1 = row._rawData[1] || '';
          preActivation2 = row._rawData[2] || '';
          shortDistanceWorkout = row._rawData[3] || '';
          mediumDistanceWorkout = row._rawData[4] || '';
          longDistanceWorkout = row._rawData[5] || '';
          extraSession = row._rawData.length > 6 ? row._rawData[6] || '' : '';
        } else if (typeof row.get === 'function') {
          // For newer versions using get() method
          dateValue = row.get('A') || row.get('Date') || '';
          preActivation1 = row.get('B') || row.get('Pre-Activation 1') || '';
          preActivation2 = row.get('C') || row.get('Pre-Activation 2') || '';
          shortDistanceWorkout = row.get('D') || row.get('60/100m') || '';
          mediumDistanceWorkout = row.get('E') || row.get('200m') || '';
          longDistanceWorkout = row.get('F') || row.get('400m') || '';
          extraSession = row.get('G') || row.get('Extra Session') || '';
        } else {
          // Direct property access as fallback
          dateValue = row['A'] || row['Date'] || '';
          preActivation1 = row['B'] || row['Pre-Activation 1'] || '';
          preActivation2 = row['C'] || row['Pre-Activation 2'] || '';
          shortDistanceWorkout = row['D'] || row['60/100m'] || '';
          mediumDistanceWorkout = row['E'] || row['200m'] || '';
          longDistanceWorkout = row['F'] || row['400m'] || '';
          extraSession = row['G'] || row['Extra Session'] || '';
        }
      } catch (e) {
        console.warn("Error accessing row data:", e);
        // Continue with empty values
      }
      
      // Determine if it's a rest day (all workout cells empty)
      const isRestDay = !shortDistanceWorkout && !mediumDistanceWorkout && !longDistanceWorkout;
      
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
        isRestDay,
        title: `Day ${index + 1} Training`,
        description: isRestDay ? 'Rest and Recovery' : 'Training Session',
      };
    });
    
    return {
      title: doc.title,
      totalSessions: sessions.length,
      sessions,
    };
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw new Error('Failed to fetch data from Google Sheet');
  }
}