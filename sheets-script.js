/**
 * Google Apps Script — Agentic Commerce Landscape submissions
 *
 * SETUP:
 * 1. Go to https://sheets.google.com → create a new sheet named "Submissions"
 * 2. Open Extensions → Apps Script → paste this code → Save
 * 3. Click Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL → set it as GOOGLE_SHEET_URL in Vercel env vars
 */

const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Timestamp', 'Protocol Name', 'Type', 'Layer', 'Website',
  'Logo Domain', 'Twitter Handle', 'Description', 'Funding',
  'Contact Email', 'Submitter Name',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers on first run
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.type || '',
      data.layer || '',
      data.website || '',
      data.logoDomain || '',
      data.twitterHandle || '',
      data.description || '',
      data.funding || '',
      data.contactEmail || '',
      data.submitterName || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
