# Vancouver Nonprofit Hub

A single-page website for discovering and listing nonprofits in Vancouver, BC. The frontend is a static `index.html` hosted on GitHub Pages; the backend uses Google Sheets + Google Apps Script.

---

## Setup Guide

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the default tab to **`Nonprofits`** (the Apps Script expects this exact name).
3. The script will automatically create the header row on first use.

---

### 2. Set Up Google Apps Script

1. In your Google Sheet, open **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Copy the entire contents of **`code.gs`** from this repository and paste it into the editor.
4. Save the project (Ctrl+S / ⌘+S). Give it a name like `VancouverNonprofitHub`.

---

### 3. Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Set the following options:
   - **Description**: `Vancouver Nonprofit Hub API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (this allows the website to call it without authentication)
4. Click **Deploy**. You will be asked to authorize the script — follow the prompts and **allow Google Drive access** (required for saving uploaded images to Drive).
5. Copy the **Web app URL** — it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

### 4. Update `index.html` with Your Script URL

1. Open `index.html` in a text editor.
2. Find the line:
   ```js
   const SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Replace `YOUR_GOOGLE_SCRIPT_URL_HERE` with the Web app URL you copied in step 3.
4. Save the file and push to GitHub.

---

### 5. Enable GitHub Pages

1. Go to your repository **Settings → Pages**.
2. Set the source to the **main** branch, root (`/`) folder.
3. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## How It Works

- **Listing a nonprofit**: Users fill out the form on the "List Your Nonprofit" page. The form sends the data (including compressed base64-encoded images) as a POST request to the Apps Script URL.
- **Image storage**: The Apps Script decodes the base64 image data, saves the files to a Google Drive folder called `VancouverNonprofitImages`, sets them to public, and stores the short thumbnail URL (`https://drive.google.com/thumbnail?id=...`) in the spreadsheet. This avoids Google Sheets' 50,000 character per-cell limit that raw base64 strings would exceed.
- **Browsing**: The home and browse pages fetch data from the Apps Script (`?action=get`) and render nonprofit cards. Images are loaded directly from Google Drive using the stored thumbnail URLs.

---

## Re-deploying After Code Changes

If you update `code.gs`, you must create a **new deployment** for the changes to take effect:

1. In Apps Script: **Deploy → New deployment**
2. Copy the new URL and update `SCRIPT_URL` in `index.html`.

Or use **Manage deployments** to update an existing deployment so the URL stays the same.
