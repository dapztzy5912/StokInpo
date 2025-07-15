const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

let prevStock = { seed: [], gear: [], egg: [] };
const stockPath = './data/previousStock.json';
if (fs.existsSync(stockPath)) prevStock = JSON.parse(fs.readFileSync(stockPath));

// Fetch and compare stock
async function fetchStock() {
    const res = await fetch('https://growagarden.gg/stocks');
    const html = await res.text();
    const $ = cheerio.load(html);

    const parseStock = (selector) => {
        const list = [];
        $(selector).each((i, el) => {
            const text = $(el).text().trim();
            const match = text.match(/(.*?) - Available Stock: (\d+)/);
            if (match) list.push(`[${match[2]}x] ${match[1]}`);
        });
        return list;
    };

    const seed = parseStock('h3:contains("Current Seed Shop Stock in Grow a Garden") + ul > li');
    const gear = parseStock('h3:contains("Current Gear Shop Stock in Grow a Garden") + ul > li');
    const egg  = parseStock('h3:contains("Current Egg Shop Stock in Grow a Garden") + ul > li');

    const newSeed = seed.filter(i => !prevStock.seed.includes(i));
    const newGear = gear.filter(i => !prevStock.gear.includes(i));
    const newEgg  = egg.filter(i => !prevStock.egg.includes(i));

    const now = moment().tz('Asia/Jakarta').format('D MMMM YYYY, HH:mm [WIB]');

    // Simpan stock baru
    fs.writeFileSync(stockPath, JSON.stringify({ seed, gear, egg }));

    return { seed, gear, egg, newSeed, newGear, newEgg, updated: now };
}

async function fetchWeather() {
    const res = await fetch('https://growagarden.gg/weather');
    const html = await res.text();
    const $ = cheerio.load(html);

    const currentWeather = $('h2:contains("Current Weather") + p').text().trim();
    const temperature = $('p:contains("Temperature")').text().trim();
    const humidity = $('p:contains("Humidity")').text().trim();
    const wind = $('p:contains("Wind")').text().trim();
    const forecast = $('h3:contains("Weather Forecast") + p').text().trim();

    return { currentWeather, temperature, humidity, wind, forecast };
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
