# Railway Deployment Guide

## Setup Instructions

### 1. Prerequisites
- Railway account (railway.app)
- Dropbox account with access token
- Git repository

### 2. Dropbox Token Setup

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app:
   - Choose "Scoped access"
   - Choose "Full Dropbox"
   - Name your app (e.g., "Job Scraper")
3. In the app settings, go to **Permissions** and enable:
   - `files.content.write`
   - `files.metadata.read`
4. Generate an **Access Token** in the **OAuth 2** section
5. Copy the token

### 3. Railway Configuration

1. Push your code to GitHub
2. In Railway:
   - Create a new project
   - Connect your GitHub repository
   - Select this repository
3. Add environment variables:
   - Go to **Variables** tab
   - Add: `DROPBOX_TOKEN=<your_token_here>`
4. The app will automatically deploy with Docker

### 4. Running the Scraper

Railway will automatically build and run your Docker image. The scraper will:

1. Scrape Seek.com.au for healthcare jobs
2. Generate a CSV file with job listings
3. Upload the CSV to Dropbox in `/jobs/` folder
4. Display the results and summary statistics

### 5. Viewing Logs

In Railway dashboard:
- Click on your deployment
- View **Logs** tab to see real-time scraper output
- Logs show upload status and any errors

## Important Notes

- **Dropbox Path**: Files are uploaded to `/jobs/` directory in your Dropbox
- **File Naming**: Uses timestamp format `seek-jobs-YYYY-MM-DDTHH-MM-SS.csv`
- **Auto-rename**: If file exists, Dropbox will automatically rename with suffix
- **Error Handling**: If upload fails, scraper continues and logs the error
- **Token in .env**: Local testing uses `.env` file; Railway uses dashboard variables

## Local Testing

```bash
# Install dependencies
npm install

# Create .env file with your token
echo "DROPBOX_TOKEN=your_token_here" > .env

# Run locally
node scraper.js
```

## Configuration Options

Edit `CONFIG` object in `scraper.js` to customize:
- `daysBack`: How many days back to search (default: 60)
- `maxPagesPerQuery`: Max pages per job type (default: 30)
- `scrapeJobDetails`: Include full job descriptions (default: true)
- `headless`: Show browser (default: false for local, true for Railway)

## Troubleshooting

- **Upload fails**: Check Dropbox token is valid and has correct permissions
- **No jobs found**: Check SEEK website structure hasn't changed
- **Memory issues**: Reduce `maxPagesPerQuery` or `scrapeJobDetails`
