// Simple wrapper to directly fetch a public Google Sheet
async function fetchPublicSheet(sheetId: string) {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
  }
  
  const text = await response.text();
  const rows = text.split('\n').map(row => row.split(',').map(cell => {
    // Remove quotes if they exist and unescape any double quotes
    if (cell.startsWith('"') && cell.endsWith('"')) {
      return cell.substring(1, cell.length - 1).replace(/""/g, '"');
    }
    return cell;
  }));
  
  if (rows.length === 0) {
    throw new Error('Empty spreadsheet');
  }
  
  return rows;
}

export async function fetchSpreadsheetData(sheetId: string) {
  try {
    console.log(`Attempting to fetch Google Sheet: ${sheetId}`);
    
    // Try to fetch via the public API first (works for public sheets)
    try {
      console.log("Trying to fetch as public sheet...");
      const rows = await fetchPublicSheet(sheetId);
      console.log(`Successfully fetched public sheet with ${rows.length} rows`);
      
      // Skip header row if present
      const dataRows = rows.length > 1 ? rows.slice(1) : rows;
      
      // Try to extract the sheet title from the request URL
      const fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
      let sheetTitle = '';
      try {
        const titleResponse = await fetch(fetchUrl);
        const htmlText = await titleResponse.text();
        const titleMatch = htmlText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          sheetTitle = titleMatch[1].replace(' - Google Sheets', '').replace(' - Google Drive', '').trim();
          console.log(`Found sheet title: ${sheetTitle}`);
        }
      } catch (e) {
        console.warn("Couldn't extract sheet title:", e);
      }
      
      // Map spreadsheet data to our program session format
      const sessions = dataRows.map((row, index) => {
        const dateValue = row[0] || '';
        const preActivation1 = row[1] || '';
        const preActivation2 = row[2] || '';
        const shortDistanceWorkout = row[3] || '';
        const mediumDistanceWorkout = row[4] || '';
        const longDistanceWorkout = row[5] || '';
        const extraSession = row.length > 6 ? row[6] || '' : '';
        
        // Process the date value if it's in Month-Day format
        let formattedDate = dateValue;
        if (dateValue && dateValue.includes('-')) {
          const [month, day] = dateValue.split('-');
          if (month && day) {
            // Convert month name to month number
            const monthMap: {[key: string]: string} = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
              'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            
            const monthNum = monthMap[month] || month;
            const currentYear = new Date().getFullYear();
            formattedDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
          }
        }
        
        // Determine if it's a rest day (all workout cells empty)
        const isRestDay = !shortDistanceWorkout && !mediumDistanceWorkout && !longDistanceWorkout;
        
        return {
          dayNumber: index + 1,
          date: formattedDate,
          columnA: dateValue, // Keep original date format in columnA
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
        title: sheetTitle || `Training Program (Sheet ID: ${sheetId})`,
        totalSessions: sessions.length,
        sessions,
      };
      
    } catch (publicError) {
      console.error("Error fetching as public sheet:", publicError);
      
      // Fall back to trying the API key
      if (!process.env.GOOGLE_API_KEY) {
        console.error("No Google API key provided for non-public sheet access");
        throw publicError;
      }
      
      try {
        // For private sheets, try using the API key method
        const GoogleSheetModule = await import('google-spreadsheet');
        const apiKeyOptions = { apiKey: process.env.GOOGLE_API_KEY };
        const doc = new GoogleSheetModule.GoogleSpreadsheet(sheetId, apiKeyOptions);
        
        // Load document properties and sheets
        await doc.loadInfo();
        const title = doc.title;
        
        // Get the first sheet
        const sheet = doc.sheetsByIndex[0];
        if (!sheet) {
          throw new Error("No sheet found in the spreadsheet");
        }
        
        // Load rows from the sheet
        const rows = await sheet.getRows();
        
        const sessions = rows.map((row: any, index: number) => {
          // Try to access row data in different ways
          let getDateValue = '';
          let getPreActivation1 = '';
          let getPreActivation2 = '';
          let getShortDistanceWorkout = '';
          let getMediumDistanceWorkout = '';
          let getLongDistanceWorkout = '';
          let getExtraSession = '';
          
          try {
            // Try accessing properties directly
            if (row._rawData && Array.isArray(row._rawData)) {
              getDateValue = row._rawData[0] || '';
              getPreActivation1 = row._rawData[1] || '';
              getPreActivation2 = row._rawData[2] || '';
              getShortDistanceWorkout = row._rawData[3] || '';
              getMediumDistanceWorkout = row._rawData[4] || '';
              getLongDistanceWorkout = row._rawData[5] || '';
              getExtraSession = row._rawData.length > 6 ? row._rawData[6] || '' : '';
            } else {
              // Alternative approach for newer API versions
              const rowData: any = {};
              
              // Get the header row (if available)
              const headerValues = sheet.headerValues || [];
              
              // Try to map row properties based on header values
              if (headerValues.length > 0) {
                headerValues.forEach((header, idx) => {
                  if (header && row[header]) {
                    rowData[header] = row[header];
                  }
                });
                
                getDateValue = rowData['Date'] || '';
                getPreActivation1 = rowData['Pre-Activation 1'] || '';
                getPreActivation2 = rowData['Pre-Activation 2'] || '';
                getShortDistanceWorkout = rowData['60/100m'] || '';
                getMediumDistanceWorkout = rowData['200m'] || '';
                getLongDistanceWorkout = rowData['400m'] || '';
                getExtraSession = rowData['Extra Session'] || '';
              } else {
                // If no headers, try indexed access
                Object.keys(row).forEach(key => {
                  if (row[key] && !key.startsWith('_')) {
                    rowData[key] = row[key];
                  }
                });
                
                const values = Object.values(rowData);
                getDateValue = String(values[0] || '');
                getPreActivation1 = String(values[1] || '');
                getPreActivation2 = String(values[2] || '');
                getShortDistanceWorkout = String(values[3] || '');
                getMediumDistanceWorkout = String(values[4] || '');
                getLongDistanceWorkout = String(values[5] || '');
                getExtraSession = values.length > 6 ? String(values[6] || '') : '';
              }
            }
          } catch (e) {
            console.warn("Error accessing row data:", e);
          }
          
          // Determine if it's a rest day
          const isRestDay = !getShortDistanceWorkout && !getMediumDistanceWorkout && !getLongDistanceWorkout;
          
          // Process the date value if it's in Month-Day format
          let formattedDate = getDateValue;
          if (getDateValue && getDateValue.includes('-')) {
            const [month, day] = getDateValue.split('-');
            if (month && day) {
              // Convert month name to month number
              const monthMap: {[key: string]: string} = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
              };
              
              const monthNum = monthMap[month] || month;
              const currentYear = new Date().getFullYear();
              formattedDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
            }
          }

          return {
            dayNumber: index + 1,
            date: formattedDate,
            columnA: getDateValue, // Keep original date format
            preActivation1: getPreActivation1,
            preActivation2: getPreActivation2,
            shortDistanceWorkout: getShortDistanceWorkout,
            mediumDistanceWorkout: getMediumDistanceWorkout,
            longDistanceWorkout: getLongDistanceWorkout,
            extraSession: getExtraSession,
            title: `Day ${index + 1} Training`,
            description: isRestDay ? 'Rest and Recovery' : 'Training Session',
            isRestDay,
          };
        });
        
        return {
          title: title || `Training Program (Sheet ID: ${sheetId})`,
          totalSessions: sessions.length,
          sessions,
        };
      } catch (apiError) {
        console.error("Error using Google Sheets API:", apiError);
        throw apiError;
      }
    }
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw new Error('Failed to fetch data from Google Sheet');
  }
}