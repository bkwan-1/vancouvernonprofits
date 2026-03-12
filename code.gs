// Google Apps Script for Vancouver Nonprofit Hub
// Deploy as a Web App with:
//   Execute as: Me
//   Who has access: Anyone (even anonymous)

var SHEET_NAME = 'Nonprofits';

// Column order in the spreadsheet
var COLUMNS = [
  'id', 'name', 'tagline', 'description', 'mission',
  'categories', 'location', 'neighborhood', 'address',
  'website', 'email', 'phone',
  'facebook', 'instagram', 'twitter', 'linkedin',
  'volunteer', 'coverImage', 'logoImage', 'created'
];

// -------------------------------------------------------
// doGet – return all nonprofit rows as JSON
// -------------------------------------------------------
function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var data = getSheetData(sheet);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------
// doPost – receive a new nonprofit registration
// -------------------------------------------------------
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // Store images as-is (base64 data URLs from the compressed frontend upload).
    // No DriveApp calls needed — images are pre-compressed by the frontend.
    // Note: Google Sheets cells have a 50,000 character limit; frontend compression
    // (logos 150×150 q0.7, covers 400×200 q0.5) keeps the base64 well within this.

    // Write row to spreadsheet
    var sheet = getOrCreateSheet();
    appendRow(sheet, payload);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Nonprofit registered successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------
// Helper: get or create the Nonprofits sheet
// -------------------------------------------------------
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write header row
    sheet.appendRow(COLUMNS);
  }
  return sheet;
}

// -------------------------------------------------------
// Helper: read all data rows as an array of objects
// -------------------------------------------------------
function getSheetData(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? String(row[j]) : '';
    }
    rows.push(obj);
  }
  return rows;
}

// -------------------------------------------------------
// Helper: append a new row using the COLUMNS order
// -------------------------------------------------------
function appendRow(sheet, data) {
  var row = COLUMNS.map(function(col) {
    return data[col] !== undefined ? data[col] : '';
  });
  sheet.appendRow(row);
}
