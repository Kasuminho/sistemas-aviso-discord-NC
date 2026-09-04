import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const urls = [
  { id: '753641', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/753641' },
  { id: '753645', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/753645' },
  { id: '753647', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/753647' },
  { id: '753656', url: 'https://www.nightcrows.com/pt/notice/notice/753656' },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });

  for (const item of urls) {
    console.log(`Processing ${item.id}: ${item.url}`);
    await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.viewer');

    const data = await page.evaluate(() => {
      const title = document.querySelector('.title')?.innerText || '';
      const text = document.querySelector('.viewer')?.innerText || '';
      return { title, text };
    });

    console.log(`Title: ${data.title}`);
    fs.writeFileSync(`./screenshots/info_${item.id}.txt`, `${data.title}\n\n${data.text}`);
  }

  await browser.close();
  console.log('Done extracting new events!');
}

run().catch(console.error);
