import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const urls = [
  { id: '752800', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752800' },
  { id: '752809', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752809' },
  { id: '752812', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752812' },
  { id: '752813', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752813' },
  { id: '752814', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752814' },
  { id: '752815', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752815' },
  { id: '752816', url: 'https://www.nightcrows.com/pt/notice/event/ongoing/752816' },
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
      const html = document.querySelector('.viewer')?.innerHTML || '';
      return { title, text, htmlLength: html.length };
    });

    console.log(`Title: ${data.title}`);
    console.log(`Length: ${data.htmlLength}`);
    fs.writeFileSync(`./screenshots/info_${item.id}.txt`, `${data.title}\n\n${data.text}`);
  }

  await browser.close();
}

run().catch(console.error);
