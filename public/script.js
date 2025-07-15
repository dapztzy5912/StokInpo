async function loadData() {
  const res = await fetch('/api/data');
  const { stock, weather } = await res.json();

  document.getElementById('updated').textContent = `📅 Diperbarui: ${stock.updated}`;
  
  document.getElementById('seedList').innerHTML = stock.seed.map(s => `<li>${s}</li>`).join('');
  document.getElementById('gearList').innerHTML = stock.gear.map(s => `<li>${s}</li>`).join('');
  document.getElementById('eggList').innerHTML = stock.egg.map(s => `<li>${s}</li>`).join('');

  document.getElementById('weatherNow').innerHTML = `
    ${weather.currentWeather}<br>
    ${weather.temperature} • ${weather.humidity} • ${weather.wind}
  `;
  document.getElementById('forecast').textContent = `📊 Forecast: ${weather.forecast}`;

  // Notifikasi stok baru
  const notif = [];
  if (stock.newSeed.length) notif.push(`🪴 Seed: ${stock.newSeed.join(', ')}`);
  if (stock.newGear.length) notif.push(`🛠️ Gear: ${stock.newGear.join(', ')}`);
  if (stock.newEgg.length) notif.push(`🥚 Egg: ${stock.newEgg.join(', ')}`);

  if (notif.length) {
    const box = document.getElementById('notification');
    box.textContent = `🆕 Stok Baru!\n${notif.join('\n')}`;
    box.classList.remove('hide');
    setTimeout(() => box.classList.add('hide'), 10000);
  }
}

loadData();
