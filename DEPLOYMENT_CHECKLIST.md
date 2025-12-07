# Deployment Checklist

## ✅ Implementation Complete

- [x] **Dropbox Upload Function** - Created and integrated
  - Reads CSV file from disk
  - Authenticates with Dropbox token
  - Uploads to `/jobs/` folder
  - Handles errors gracefully
  - Displays confirmation with file details

- [x] **Dependencies Updated**
  - Added `dropbox` (^10.34.0) SDK
  - Added `dotenv` (^16.0.3) for environment variables
  - All dependencies compatible with Node.js 18

- [x] **Configuration Ready**
  - `.env` file exists with DROPBOX_TOKEN
  - `.env.example` template created
  - Environment variable support for Railway

- [x] **Documentation Complete**
  - `DEPLOYMENT.md` - Complete deployment guide
  - `DROPBOX_SETUP.md` - Feature overview
  - `README_DROPBOX.md` - Implementation details
  - `CODE_CHANGES.md` - Exact code changes made

- [x] **Docker Support**
  - Dockerfile updated with environment variable instructions
  - Works with Railway environment variables
  - System dependencies already included

## 🚀 Before Deployment

### Local Testing
- [ ] Run `npm install` to install new dependencies
- [ ] Verify `.env` file has valid DROPBOX_TOKEN
- [ ] Run `node scraper.js` to test locally
- [ ] Check Dropbox `/jobs/` folder for uploaded file
- [ ] Verify file is complete and readable

### Railway Setup
- [ ] Create Railway account at railway.app
- [ ] Generate Dropbox token:
  - [ ] Go to https://www.dropbox.com/developers/apps
  - [ ] Create new app (Scoped access, Full Dropbox)
  - [ ] Enable: files.content.write, files.metadata.read
  - [ ] Generate access token
- [ ] Push code to GitHub
- [ ] Connect GitHub repo to Railway
- [ ] Add `DROPBOX_TOKEN` environment variable in Railway
- [ ] Deploy and monitor logs

### Git Setup
- [ ] Ensure `.env` is in `.gitignore` (don't commit!)
- [ ] Commit all new files and changes
- [ ] Push to main/master branch
- [ ] Verify all files are on GitHub

## 📋 File Inventory

### Core Files Modified
- ✅ `scraper.js` - Added upload function and integration
- ✅ `package.json` - Added dropbox and dotenv dependencies

### Configuration Files
- ✅ `.env` - Contains DROPBOX_TOKEN (not committed)
- ✅ `.env.example` - Template for documentation
- ✅ `Dockerfile` - Updated with deployment notes

### Documentation Added
- ✅ `DEPLOYMENT.md` - Railway deployment guide
- ✅ `DROPBOX_SETUP.md` - Feature summary
- ✅ `README_DROPBOX.md` - Implementation details
- ✅ `CODE_CHANGES.md` - Exact code changes
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] DROPBOX_TOKEN is NOT committed to GitHub
- [ ] Use `.env.example` as template only
- [ ] Railway environment variables store the actual token
- [ ] No sensitive data in code or comments
- [ ] Token can be rotated in Dropbox Console if compromised

## 🧪 Testing Checklist

### Local Testing
```bash
npm install
echo "DROPBOX_TOKEN=your_token" > .env
node scraper.js
```
- [ ] Scraper runs without errors
- [ ] CSV file generated
- [ ] Dropbox upload successful
- [ ] File appears in `/jobs/` folder in Dropbox

### Railway Testing
- [ ] Docker build succeeds
- [ ] Deployment completes without errors
- [ ] Logs show successful upload
- [ ] Files appear in Dropbox from Railway instance

## 📊 Expected Output

### Console Log
```
🚀 Seek.com.au Scraper - Playwright + Cheerio
📅 Last 60 days | 8 categories

[... scraping logs ...]

✅ Scraping complete!
📊 Total jobs: 1234
🔄 Unique jobs: 1000

💾 CSV saved: /app/seek-jobs-2024-12-07T10-30-45.csv

📤 Uploading to Dropbox: /jobs/seek-jobs-2024-12-07T10-30-45.csv
✅ File uploaded successfully to Dropbox!
   Path: /jobs/seek-jobs-2024-12-07T10-30-45.csv
   Size: 256.42 KB

📈 Jobs by Category:
   general-practitioner-jobs: 250
   dentist-jobs: 200
   [...]

⏱️  Time: 2h 15m 30s
```

## 🆘 Troubleshooting

### If scraper works but upload fails:
1. Check DROPBOX_TOKEN in Railway variables
2. Verify token permissions in Dropbox Console
3. Test token validity manually
4. Check Railway network/logs for details

### If scraper doesn't run:
1. Check logs in Railway dashboard
2. Verify Docker build succeeded
3. Check npm dependencies installed
4. Verify all imports are correct

### If file not in Dropbox:
1. Check `/jobs/` folder specifically
2. Refresh Dropbox page
3. Check file timestamp matches run time
4. Verify token has write permissions

## 📞 Support Resources

- **Dropbox API Docs**: https://www.dropbox.com/developers/documentation
- **Railway Docs**: https://docs.railway.app/
- **Node.js Dropbox SDK**: https://github.com/dropbox/dropbox-sdk-js
- **Playwright Docs**: https://playwright.dev/

---

**Status: READY FOR DEPLOYMENT** ✅

All implementation complete. Follow the deployment steps above to get running on Railway!
