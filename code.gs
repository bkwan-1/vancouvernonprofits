// Google Apps Script for Vancouver Nonprofit Hub
// Deploy as a Web App with:
//   Execute as: Me
//   Who has access: Anyone (even anonymous)
//
// IMPORTANT: When authorizing, you MUST allow Drive access.
// The script saves uploaded images to Google Drive.

var SHEET_NAME = 'Nonprofits';
var FOLDER_NAME = 'VancouverNonprofitImages';

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

    // Process images: save base64 data URLs to Google Drive, replace with thumbnail URLs
    var imageId = payload.id || String(Date.now());
    if (payload.coverImage && payload.coverImage.indexOf('data:') === 0) {
      payload.coverImage = saveBase64ToDrive(payload.coverImage, 'cover_' + imageId);
    }
    if (payload.logoImage && payload.logoImage.indexOf('data:') === 0) {
      payload.logoImage = saveBase64ToDrive(payload.logoImage, 'logo_' + imageId);
    }
    // Store images as-is (base64 data URLs from the compressed frontend upload).
    // No DriveApp calls needed — images are pre-compressed by the frontend.
    // Note: Google Sheets cells have a 50,000 character limit; frontend compression
    // (logos 150×150 q0.7, covers 400×200 q0.5) keeps the base64 well within this.

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
// Helper: save a base64 data URL to Google Drive and
// return a thumbnail URL
// -------------------------------------------------------
function saveBase64ToDrive(dataUrl, fileName) {
  var matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    Logger.log('saveBase64ToDrive: invalid data URL for file: ' + fileName);
    return '';
  }

  var mimeType = matches[1];
  var base64Data = matches[2];
  var extension = mimeType.split('/')[1] || 'jpg';
  if (extension === 'jpeg') extension = 'jpg';

  var safeName = fileName || ('image_' + Date.now());
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, safeName + '.' + extension);

  var folder = getOrCreateFolder();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
}

// -------------------------------------------------------
// Helper: get or create the folder for nonprofit images
// -------------------------------------------------------
function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

// -------------------------------------------------------
// Helper: get or create the Nonprofits sheet
// -------------------------------------------------------
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
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
