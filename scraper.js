const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const cheerio = require('cheerio');
const { Dropbox } = require('dropbox');
require('dotenv').config();

// Configuration
const CONFIG = {
    baseUrl: 'https://www.seek.com.au',
    searchQueries: [
        'general-practitioner-jobs',
        // 'dentist-jobs',
        // 'podiatrist-jobs',
        // 'psychologist-jobs',
        // 'psychiatrist-jobs',
        // 'occupational-therapist-jobs',
        // 'speech-pathologist-jobs',
        // 'physiotherapist-jobs'
    ],
    daysBack: 60,
    maxPagesPerQuery: 1,
    delayBetweenPages: 4000,
    delayBetweenQueries: 6000,
    delayBetweenJobDetails: 2000,
    // Use headless in server environments (Railway) to avoid X server errors
    headless: process.env.HEADLESS === 'false' ? false : true,
    timeout: 45000,
    scrapeJobDetails: true // SET TO TRUE to get full descriptions
};

function escapeCSV(value) {
    if (value == null) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function arrayToCSV(jobs) {
    const headers = ['Title', 'Company', 'Location', 'Posted Text', 'Actual Date', 'Search Query', 'Job Type', 'Salary', 'Description', 'Link'];
    const csvRows = [headers.join(',')];
    
    jobs.forEach(job => {
        const row = [
            escapeCSV(job.title),
            escapeCSV(job.company),
            escapeCSV(job.location),
            escapeCSV(job.posted_text),
            escapeCSV(job.actual_date),
            escapeCSV(job.search_query),
            escapeCSV(job.job_type || 'N/A'),
            escapeCSV(job.salary || 'N/A'),
            escapeCSV(job.description || 'N/A'),
            escapeCSV(job.link)
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function getActualDate(postDateText) {
    const today = new Date();
    
    if (!postDateText || postDateText.trim() === '') {
        return null;
    }
    
    let cleanedText = postDateText.trim();
    
    if (cleanedText.toLowerCase().includes('just now') || cleanedText.toLowerCase() === 'today') {
        return today;
    }
    
    const cleanMatch = cleanedText.match(/(\d+\s*(h|d|w|m)\s*ago|\d+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i);
    if (cleanMatch) {
        cleanedText = cleanMatch[0].trim();
    }

    const relativeMatch = cleanedText.match(/(\d+)\s*(h|d|w|m)\s*ago/i);
    if (relativeMatch) {
        const value = parseInt(relativeMatch[1]);
        const unit = relativeMatch[2].charAt(0).toLowerCase();
        const postedDate = new Date(today);
        
        if (unit === 'd') {
            postedDate.setDate(today.getDate() - value);
        } else if (unit === 'h') {
            postedDate.setHours(today.getHours() - value);
        } else if (unit === 'w') {
            postedDate.setDate(today.getDate() - (value * 7));
        } else if (unit === 'm') {
            postedDate.setMonth(today.getMonth() - value);
        }
        return postedDate;
    }
    
    const absoluteMatch = cleanedText.match(/(\d+)\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    if (absoluteMatch) {
        const day = parseInt(absoluteMatch[1]);
        const monthAbbr = absoluteMatch[2];
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            .findIndex(m => m.toLowerCase() === monthAbbr.toLowerCase());
        
        if (monthIndex > -1) {
            let year = today.getFullYear();
            const postedDate = new Date(year, monthIndex, day);
            
            if (postedDate > today) {
                postedDate.setFullYear(year - 1);
            }
            
            return postedDate;
        }
    }
    
    return null;
}

function isWithinDaysBack(date, daysBack) {
    if (!date) return false;
    
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - daysBack);
    
    today.setHours(23, 59, 59, 999);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return dateToCheck >= cutoffDate && dateToCheck <= today;
}

async function uploadToDropbox(filePath, fileName) {
    try {
        const accessToken = process.env.DROPBOX_TOKEN;
        
        if (!accessToken) {
            console.log('⚠️  DROPBOX_TOKEN not found in .env - skipping upload');
            return false;
        }
        
        const dbx = new Dropbox({ accessToken: accessToken });
        
        const fileContent = fs.readFileSync(filePath);
        const dropboxPath = `/jobs/${fileName}`;
        
        console.log(`\n📤 Uploading to Dropbox: ${dropboxPath}`);
        
        const response = await dbx.filesUpload({
            path: dropboxPath,
            contents: fileContent,
            mode: { '.tag': 'add' },
            autorename: true
        });
        
        console.log(`✅ File uploaded successfully to Dropbox!`);
        console.log(`   Path: ${response.result.path_display}`);
        console.log(`   Size: ${(response.result.size / 1024).toFixed(2)} KB`);
        
        return true;
    } catch (error) {
        console.error(`❌ Dropbox upload failed: ${error.message}`);
        return false;
    }
}

async function scrapeJobDetails(page, jobUrl) {
    try {
        await page.goto(jobUrl, { 
            waitUntil: 'load',
            timeout: CONFIG.timeout 
        });
        
        await page.waitForTimeout(CONFIG.delayBetweenJobDetails);
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const description = $('[data-automation="jobAdDetails"]').text().trim();
        const jobType = $('[data-automation="job-detail-work-type"]').text().trim();
        const salary = $('[data-automation="jobSalary"]').text().trim();
        const classification = $('[data-automation="jobClassification"]').text().trim();
        const subClassification = $('[data-automation="jobSubClassification"]').text().trim();
        
        return {
            description: description || 'N/A',
            job_type: jobType || 'N/A',
            salary: salary || 'N/A',
            classification: classification || 'N/A',
            sub_classification: subClassification || 'N/A'
        };
    } catch (error) {
        console.error(`      ⚠️  Error getting details: ${error.message}`);
        return {
            description: 'Error loading',
            job_type: 'N/A',
            salary: 'N/A',
            classification: 'N/A',
            sub_classification: 'N/A'
        };
    }
}

async function scrapeJobsForQuery(page, searchQuery, daysBack, scrapeDetails) {
    const jobs = [];
    let currentPage = 1;
    let consecutiveEmptyPages = 0;
    
    console.log(`\n📋 Scraping: ${searchQuery}`);
    
    while (currentPage <= CONFIG.maxPagesPerQuery) {
        const url = `${CONFIG.baseUrl}/${searchQuery}?sortmode=ListedDate&page=${currentPage}`;
        console.log(`  Page ${currentPage}: ${url}`);
        
        try {
            await page.goto(url, { 
                waitUntil: 'load',
                timeout: CONFIG.timeout 
            });
            
            await page.waitForTimeout(CONFIG.delayBetweenPages);
            
            try {
                await page.waitForSelector('[data-automation="jobTitle"]', { timeout: 5000 });
            } catch (e) {
                console.log(`    ⚠️  No job listings found`);
            }
            
            const html = await page.content();
            const $ = cheerio.load(html);
            const jobCards = $('[data-testid="job-card"]');
            
            console.log(`    Found ${jobCards.length} job cards`);
            
            if (jobCards.length === 0) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= 3) {
                    console.log(`  ⚠️  No jobs after ${consecutiveEmptyPages} pages - stopping`);
                    break;
                }
                currentPage++;
                continue;
            } else {
                consecutiveEmptyPages = 0;
            }
            
            let jobsFoundOnPage = 0;
            let tooOldCount = 0;
            const jobLinksToScrape = [];
            
            jobCards.each((index, element) => {
                try {
                    const titleAnchor = $(element).find('[data-automation="jobTitle"]');
                    const title = titleAnchor.text().trim();
                    const linkPath = titleAnchor.attr('href');
                    const link = CONFIG.baseUrl + linkPath;
                    const company = $(element).find('[data-automation="jobCompany"]').text().trim();
                    const location = $(element).find('[data-automation="jobCardLocation"]').text().trim();
                    const postDateText = $(element).find('[data-automation="jobListingDate"]').first().text().trim();
                    
                    const actualPostedDate = getActualDate(postDateText);
                    
                    if (isWithinDaysBack(actualPostedDate, daysBack)) {
                        jobLinksToScrape.push({
                            title,
                            company,
                            location,
                            posted_text: postDateText,
                            actual_date: actualPostedDate.toDateString(),
                            search_query: searchQuery,
                            link
                        });
                        jobsFoundOnPage++;
                    } else if (actualPostedDate) {
                        tooOldCount++;
                    }
                } catch (error) {
                    console.error(`    Error processing job: ${error.message}`);
                }
            });
            
            console.log(`    ✓ Found ${jobsFoundOnPage} jobs in last ${daysBack} days (${tooOldCount} too old)`);
            
            if (scrapeDetails && jobLinksToScrape.length > 0) {
                console.log(`    🔍 Getting details for ${jobLinksToScrape.length} jobs...`);
                
                for (let i = 0; i < jobLinksToScrape.length; i++) {
                    const job = jobLinksToScrape[i];
                    console.log(`      [${i + 1}/${jobLinksToScrape.length}] ${job.title.substring(0, 50)}...`);
                    
                    const details = await scrapeJobDetails(page, job.link);
                    
                    jobs.push({
                        ...job,
                        job_type: details.job_type,
                        salary: details.salary,
                        description: details.description,
                        classification: details.classification,
                        sub_classification: details.sub_classification
                    });
                    
                    await page.goBack({ waitUntil: 'load', timeout: CONFIG.timeout });
                    await page.waitForTimeout(1000);
                }
            } else {
                jobs.push(...jobLinksToScrape);
            }
            
            if (tooOldCount > jobCards.length * 0.8 && currentPage > 5) {
                console.log(`  ℹ️  Most jobs are too old - stopping`);
                break;
            }
            
            const nextLink = $('a[aria-label="Next"], a[title="Next"]');
            if (nextLink.length === 0) {
                console.log(`  ℹ️  No more pages`);
                break;
            }
            
            currentPage++;
            
        } catch (error) {
            console.error(`  ❌ Error on page ${currentPage}: ${error.message}`);
            consecutiveEmptyPages++;
            
            if (consecutiveEmptyPages >= 3) {
                console.log(`  ⚠️  Too many errors - moving to next query`);
                break;
            }
            
            currentPage++;
            await page.waitForTimeout(5000);
        }
    }
    
    console.log(`  ✅ Total for ${searchQuery}: ${jobs.length} jobs`);
    return jobs;
}

async function scrapeSeek() {
    console.log('🌐 Launching Chrome browser...');
    
    const browser = await chromium.launch({
        headless: CONFIG.headless,
        slowMo: 50,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'en-AU',
        timezoneId: 'Australia/Sydney',
        extraHTTPHeaders: {
            'Accept-Language': 'en-AU,en;q=0.9'
        }
    });
    
    const page = await context.newPage();
    const allJobs = [];
    
    console.log(`🎯 Target: ${CONFIG.daysBack} days | Goal: 2000+ jobs`);
    console.log(`📝 Job details: ${CONFIG.scrapeJobDetails ? 'ENABLED (will be slower)' : 'DISABLED'}\n`);
    
    for (let i = 0; i < CONFIG.searchQueries.length; i++) {
        const searchQuery = CONFIG.searchQueries[i];
        
        try {
            const jobs = await scrapeJobsForQuery(page, searchQuery, CONFIG.daysBack, CONFIG.scrapeJobDetails);
            allJobs.push(...jobs);
            
            console.log(`📊 Running total: ${allJobs.length} jobs`);
            
            if (allJobs.length >= 2000) {
                console.log(`\n🎉 TARGET REACHED! ${allJobs.length} jobs`);
            }
            
            if (i < CONFIG.searchQueries.length - 1) {
                console.log(`⏳ Waiting ${CONFIG.delayBetweenQueries / 1000}s...`);
                await page.waitForTimeout(CONFIG.delayBetweenQueries);
            }
        } catch (error) {
            console.error(`❌ Failed ${searchQuery}: ${error.message}`);
        }
    }
    
    await browser.close();
    
    console.log(`\n✅ Scraping complete!`);
    console.log(`📊 Total jobs: ${allJobs.length}`);
    
    if (allJobs.length === 0) {
        console.log('\n⚠️  No jobs found');
        return [];
    }
    
    const uniqueJobs = Array.from(
        new Map(allJobs.map(job => [job.link, job])).values()
    );
    
    console.log(`🔄 Unique jobs: ${uniqueJobs.length}`);
    
    const csvContent = arrayToCSV(uniqueJobs);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = CONFIG.scrapeJobDetails 
        ? `seek-jobs-WITH-DETAILS-${timestamp}.csv`
        : `seek-jobs-${timestamp}.csv`;
    const outputPath = `${process.cwd()}/${filename}`;
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`💾 CSV saved: ${outputPath}`);
    
    // Upload to Dropbox
    await uploadToDropbox(outputPath, filename);
    
    const summary = {};
    CONFIG.searchQueries.forEach(query => {
        const count = uniqueJobs.filter(job => job.search_query === query).length;
        if (count > 0) summary[query] = count;
    });
    
    console.log('\n📈 Jobs by Category:');
    Object.entries(summary)
        .sort((a, b) => b[1] - a[1])
        .forEach(([query, count]) => {
            console.log(`   ${query}: ${count}`);
        });
    
    if (uniqueJobs.length >= 2000) {
        console.log(`\n🎯 SUCCESS! ${uniqueJobs.length} jobs ✅`);
    }
    
    return uniqueJobs;
}

(async () => {
    const startTime = Date.now();
    console.log('🚀 Seek.com.au Scraper - Playwright + Cheerio');
    console.log(`📅 Last ${CONFIG.daysBack} days | ${CONFIG.searchQueries.length} categories\n`);
    
    try {
        require.resolve('cheerio');
    } catch (e) {
        console.log('⚠️  Install Cheerio: npm install cheerio');
        process.exit(1);
    }
    
    try {
        await scrapeSeek();
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`\n⏱️  Time: ${formatTime(elapsed)}`);
})();