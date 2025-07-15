// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const stockPath = './data/previousStock.json';
let prevStock = { seed: [], gear: [], egg: [] };
if (fs.existsSync(stockPath)) prevStock = JSON.parse(fs.readFileSync(stockPath));

async function fetchStock() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://growagarden.gg/stocks', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000);

  const sections = await page.evaluate(() => {
    const result = { seed: [], gear: [], egg: [] };
    document.querySelectorAll('section').forEach(sec => {
      const title = sec.querySelector('h2, h3, h4')?.innerText?.toLowerCase() || '';
      const items = Array.from(sec.querySelectorAll('li, div.stock-item')).map(el => el.innerText.trim());
      if (title.includes('seed')) result.seed = items;
      if (title.includes('gear')) result.gear = items;
      if (title.includes('egg')) result.egg = items;
    });
    return result;
  });

  await browser.close();

  const newSeed = sections.seed.filter(i => !prevStock.seed.includes(i));
  const newGear = sections.gear.filter(i => !prevStock.gear.includes(i));
  const newEgg  = sections.egg.filter(i => !prevStock.egg.includes(i));

  const updated = moment().tz('Asia/Jakarta').format('D MMMM YYYY, HH:mm [WIB]');
  fs.writeFileSync(stockPath, JSON.stringify(sections));

  return { ...sections, newSeed, newGear, newEgg, updated };
}

async function fetchWeather() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://growagarden.gg/weather', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const weather = await page.evaluate(() => {
    const cw = document.querySelector('h2 + p')?.innerText.trim() || '';
    const temp = Array.from(document.querySelectorAll('p'))
      .find(p => p.innerText.toLowerCase().includes('temperature'))?.innerText.trim() || '';
    const hum = Array.from(document.querySelectorAll('p'))
      .find(p => p.innerText.toLowerCase().includes('humidity'))?.innerText.trim() || '';
    const wind = Array.from(document.querySelectorAll('p'))
      .find(p => p.innerText.toLowerCase().includes('wind'))?.innerText.trim() || '';
    const forecast = document.querySelector('h3 + p')?.innerText.trim() || '';
    return { currentWeather: cw, temperature: temp, humidity: hum, wind, forecast };
  });

  await browser.close();
  return weather;
}

app.get('/api/data', async (req, res) => {
  try {
    const stock = await fetchStock();
    const weather = await fetchWeather();
    res.json({ stock, weather });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
