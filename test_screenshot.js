import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

  const url = 'https://www.nightcrows.com/pt/notice/event/ongoing/752815';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for viewer content
  await page.waitForSelector('.viewer');

  // Let's find all tables or specific event sections
  const tables = await page.$$('.viewer table');
  console.log(`Found ${tables.length} tables`);

  fs.mkdirSync('./screenshots', { recursive: true });

  for (let i = 0; i < tables.length; i++) {
    const filePath = `./screenshots/test_table_${i + 1}.png`;
    await tables[i].screenshot({ path: filePath });
    console.log(`Saved ${filePath}`);
  }

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
