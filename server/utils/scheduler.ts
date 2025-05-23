import { storage as dbStorage } from '../storage';

/**
 * Scheduled job to refresh all Google Sheet data
 * This will refresh data for all programs imported from Google Sheets
 */
export async function refreshAllGoogleSheetPrograms() {
  try {
    console.log('Starting scheduled Google Sheet data refresh...');
    
    // Get all programs that are imported from Google Sheets
    const sheetPrograms = await dbStorage.getProgramsFromSheets();
    
    if (!sheetPrograms || sheetPrograms.length === 0) {
      console.log('No Google Sheet-based programs found to refresh');
      return;
    }
    
    console.log(`Found ${sheetPrograms.length} Google Sheet programs to refresh`);
    
    // Process each program
    for (const program of sheetPrograms) {
      try {
        if (!program.googleSheetId) {
          console.log(`Program ${program.id} has no Google Sheet ID, skipping...`);
          continue;
        }
        
        console.log(`Refreshing data for program ${program.id} (${program.title}) from sheet ${program.googleSheetId}`);
        
        // Import sheet utility and fetch fresh data
        const { fetchSpreadsheetData } = await import('./sheets');
        const sheetData = await fetchSpreadsheetData(program.googleSheetId);
        
        if (!sheetData || !sheetData.sessions) {
          console.log(`No data returned for program ${program.id}, skipping...`);
          continue;
        }
        
        console.log(`Successfully fetched updated sheet data for program ${program.id}: ${sheetData.title} with ${sheetData.sessions.length} sessions`);
        
        // Delete existing sessions
        await dbStorage.deleteProgramSessions(program.id);
        
        // Create new sessions from updated sheet data
        for (const session of sheetData.sessions) {
          await dbStorage.createProgramSession({
            ...session,
            programId: program.id
          });
        }
        
        console.log(`Program ${program.id} refreshed with ${sheetData.sessions.length} sessions`);
      } catch (err) {
        console.error(`Error refreshing program ${program.id}:`, err);
        // Continue with next program
      }
    }
    
    console.log('Scheduled Google Sheet data refresh completed');
  } catch (error) {
    console.error('Error in refreshAllGoogleSheetPrograms:', error);
  }
}