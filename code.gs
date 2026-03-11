// Google Apps Script for Vancouver Nonprofit Hub
// Deploy as a Web App with:
//   Execute as: Me
//   Who has access: Anyone (even anonymous)

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
  var output;
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'get';

    if (action === 'get') {
      var sheet = getOrCreateSheet();
      var data = getSheetData(sheet);
      output = ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      output = ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    output = ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return output;
}

// -------------------------------------------------------
// doPost – receive a new nonprofit registration
// -------------------------------------------------------
function doPost(e) {
  var output;
  try {
    var payload = JSON.parse(e.postData.contents);

    // Process images: save base64 data to Drive, replace with direct URL
    if (payload.coverImage && payload.coverImage.startsWith('data:')) {
      payload.coverImage = saveImageToDrive(payload.coverImage, 'cover_' + payload.id);
    }
    if (payload.logoImage && payload.logoImage.startsWith('data:')) {
      payload.logoImage = saveImageToDrive(payload.logoImage, 'logo_' + payload.id);
    }

    // Write row to spreadsheet
    var sheet = getOrCreateSheet();
    appendRow(sheet, payload);

    output = ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Nonprofit registered successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    output = ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return output;
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

// -------------------------------------------------------
// Helper: decode base64 data URL, save to Drive, return
//         a direct thumbnail URL that works in <img> tags
// -------------------------------------------------------
function saveImageToDrive(dataUrl, filename) {
  // dataUrl format: data:<mimeType>;base64,<data>
  var matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return '';

  var mimeType = matches[1];
  var base64Data = matches[2];

  // Determine file extension
  var ext = 'jpg';
  if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/gif') ext = 'gif';
  else if (mimeType === 'image/webp') ext = 'webp';

  var fullFilename = filename + '.' + ext;

  // Decode base64 to bytes
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fullFilename);

  // Get or create the target folder
  var folder = getOrCreateFolder(FOLDER_NAME);

  // Save file to Drive
  var file = folder.createFile(blob);

  // Make publicly viewable
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Return a direct thumbnail URL usable in <img> tags
  var fileId = file.getId();
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
}

// -------------------------------------------------------
// Helper: get or create a Drive folder by name
// -------------------------------------------------------
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}
