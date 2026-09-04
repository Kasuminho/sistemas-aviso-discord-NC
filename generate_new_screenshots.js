import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.resolve('./screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
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

    // Remove fixed / sticky elements
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

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,2000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1050, height: 1200, deviceScaleFactor: 2 });

  // 1. Missões de Outono, Clemens & Diretivas de Montaria (753641)
  console.log('--- 1. Missões de Outono & Montarias ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/753641', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '01_missoes_clemens_montaria.png');

  // 2. Evento de Dados & Expedição do Corvinho (753645)
  console.log('--- 2. Evento de Dados & Expedição ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/753645', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '02_evento_dados_expedicao.png');

  // 3. Desconto de 60% em Substituição (753647)
  console.log('--- 3. Desconto de 60% em Substituição ---');
  await page.goto('https://www.nightcrows.com/pt/notice/event/ongoing/753647', { waitUntil: 'networkidle2' });
  await cleanPage(page);
  await captureViewerSection(page, '03_desconto_substituicao_60.png');

  await browser.close();
  console.log('All new screenshots generated successfully!');
}

run().catch(console.error);
