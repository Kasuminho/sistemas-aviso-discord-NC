import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.resolve('./screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function captureEvent(page, url, customSelector, outputFilename) {
  console.log(`Loading ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForSelector('.viewer');

  // Remove popups, headers, cookies
  await page.evaluate(() => {
    // Hide sticky header and bottom bar
    const headers = document.querySelectorAll('header, .base-header, .cRBWXC, .iSWyuW, .react-modal__container, [class*="drawer"]');
    headers.forEach(el => el.style.display = 'none');

    // Find and remove any cookie banners
    const cookieBanners = Array.from(document.querySelectorAll('div')).filter(d => 
      d.innerText && (d.innerText.includes('cookies') || d.innerText.includes('Aceitar'))
    );
    cookieBanners.forEach(b => {
      if (b.parentElement && b.parentElement !== document.body && b.innerText.length < 500) {
        b.style.display = 'none';
      }
    });
  });

  await new Promise(r => setTimeout(r, 1000));

  const el = await page.$(customSelector);
  if (el) {
    await el.screenshot({ path: path.join(outputDir, outputFilename) });
    console.log(`Saved screenshot: ${outputFilename}`);
  } else {
    console.warn(`Selector ${customSelector} not found for ${url}`);
  }
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,2000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1050, height: 1200, deviceScaleFactor: 2 });

  // 1. Check-in 900 Dias
  console.log('--- 1. Check-in ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752800', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '01_checkin_900_dias.png');

  // 2. Roleta da Sorte 900 Dias
  console.log('--- 2. Roleta ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752812', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '02_roleta_900_dias.png');

  // 3. Moldagem Mágica
  console.log('--- 3. Moldagem Mágica ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752814', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '03_moldagem_magica.png');

  // 4. Criação de Moeda 900 Dias
  console.log('--- 4. Criação Moeda 900 Dias ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752815', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '04_criacao_moeda_900_dias.png');

  // 5. Criação de Evento
  console.log('--- 5. Criação de Evento ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752813', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '05_criacao_evento.png');

  // 6. Hora do Bônus (Hot Time)
  console.log('--- 6. Hora do Bônus ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752816', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '06_hora_do_bonus.png');

  // 7. Desafio Rumo ao Pico & Missões
  console.log('--- 7. Missões 900 Dias / Desafio Rumo ao Pico ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/752809', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '07_desafio_pico_missoes.png');

  await browser.close();
  console.log('All screenshots generated successfully!');
}

async function cleanPage(page) {
  await page.evaluate(() => {
    // Hide header, footer, floating buttons
    const selectorsToHide = [
      'header', '.base-header', '.cRBWXC', '.iSWyuW', 
      '.react-modal__container', '.cuuttj', '.cZnPLD',
      '.daYSOh', '.jnAjSt'
    ];
    selectorsToHide.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
    });

    // Remove any fixed / sticky banners
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        el.style.display = 'none';
      }
    });

    // Clean body background
    document.body.style.backgroundColor = '#ffffff';
    const mainEl = document.querySelector('.ghfcSM');
    if (mainEl) {
      mainEl.style.margin = '0 auto';
      mainEl.style.width = '100%';
    }
    const contentsEl = document.querySelector('.contents');
    if (contentsEl) {
      contentsEl.style.margin = '0 auto';
      contentsEl.style.width = '100%';
    }
  });
  await new Promise(r => setTimeout(r, 600));
}

async function captureViewerSection(page, outputFilename) {
  const viewer = await page.$('.viewer');
  if (viewer) {
    await viewer.screenshot({ path: path.join(outputDir, outputFilename) });
    console.log(`Saved: ${outputFilename}`);
  }
}

run().catch(console.error);
