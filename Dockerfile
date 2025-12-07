# Use Node.js base image with necessary dependencies for Playwright
FROM node:22-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies required by Playwright and Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libglib2.0-bin \
    libgstreamer-plugins-base1.0-0 \
    libgstreamer1.0-0 \
    libgtk-3-0 \
    libicu72 \
    libjpeg62-turbo \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpci3 \
    libpulse0 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxinerama1 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application code
COPY . .

# Note: For Railway deployment, set DROPBOX_TOKEN environment variable in Railway dashboard
# The .env file will be automatically loaded by dotenv package

# Run the scraper
CMD ["node", "scraper.js"]
