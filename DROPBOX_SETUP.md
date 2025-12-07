# Dropbox Upload Feature - Summary

## What Was Added

### 1. **uploadToDropbox() Function** (scraper.js)
- Reads the generated CSV file from disk
- Authenticates with Dropbox using `DROPBOX_TOKEN` from environment
- Uploads file to `/jobs/` directory in Dropbox
- Displays upload confirmation with file size and path
- Handles errors gracefully with fallback behavior

### 2. **Integration with Main Scraping Flow**
- Automatically called after CSV is generated and saved locally
- Uploads both regular and detailed job listings
- Non-blocking - scraper continues if upload fails
- Provides clear console feedback on upload status

### 3. **Dependencies Added**
- `dropbox` (^10.34.0) - Official Dropbox SDK
- `dotenv` (^16.0.3) - Environment variable loader

### 4. **Environment Configuration**
- Added `DROPBOX_TOKEN` support in `.env` file
- Can also use Railway environment variables
- Gracefully skips upload if token not found

### 5. **Dockerfile Updates**
- Already configured to work with environment variables
- Instructions added for Railway deployment
- Supports both local and cloud environments

### 6. **Documentation**
- Created `DEPLOYMENT.md` with comprehensive setup guide
- Includes Dropbox token generation instructions
- Railway deployment step-by-step guide
- Troubleshooting section

## File Structure
```
/home/rust-cohle/Downloads/ms/
├── scraper.js           (updated with upload function)
├── package.json         (updated dependencies)
├── Dockerfile           (updated with instructions)
├── .env                 (existing, contains DROPBOX_TOKEN)
└── DEPLOYMENT.md        (new deployment guide)
```

## Usage

### Local Testing
```bash
npm install
node scraper.js
```
(Reads DROPBOX_TOKEN from .env file)

### Railway Deployment
1. Push to GitHub
2. Connect to Railway
3. Add `DROPBOX_TOKEN` environment variable in Railway dashboard
4. Deploy automatically

## Features

✅ Automatic CSV generation from scraped data
✅ One-click Dropbox upload after scraping
✅ Error handling and logging
✅ Works locally with .env file
✅ Works on Railway with environment variables
✅ File size reporting
✅ Automatic file renaming if duplicate exists
✅ Graceful fallback if upload fails

## Console Output Example

```
💾 CSV saved: /app/seek-jobs-2024-12-07T10-30-45.csv

📤 Uploading to Dropbox: /jobs/seek-jobs-2024-12-07T10-30-45.csv
✅ File uploaded successfully to Dropbox!
   Path: /jobs/seek-jobs-2024-12-07T10-30-45.csv
   Size: 256.42 KB
```
