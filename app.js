/* ======== Helper Functions ======== */
const $ = (sel) => document.querySelector(sel);
const set = (id, html) => {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
};
const asJson = async (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

/* ========== 1. Weather Forecast (Open-Meteo) ========== */
async function getWeatherImage() {
  const city = $("#weather-input")?.value?.trim();
  if (!city) return set("dog-output", "<p>Please enter a city name.</p>");
  try {
    // Geocode city → lat/lon via Nominatim
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=json&limit=1`
    ).then(asJson);
    if (!geo.length) return set("dog-output", "<p>Location not found.</p>");
    const { lat, lon, display_name } = geo[0];

    // Fetch weather
    const wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`
    ).then(asJson);
    const cur = wx.current;

    const codes = {
      0: "Clear",
      1: "Mostly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Fog",
      61: "Rain",
      80: "Showers",
    };
    set(
      "dog-output",
      `
      <p><strong>${display_name}</strong></p>
      <p>Temperature: ${cur.temperature_2m}°C</p>
      <p>Condition: ${codes[cur.weather_code] || cur.weather_code}</p>
      <p>Wind: ${cur.wind_speed_10m} m/s</p>
    `
    );
  } catch (e) {
    set("dog-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 2. Shopping Products (Fake Store API) ========== */
async function getShoppingImage() {
  try {
    const products = await fetch(
      "https://fakestoreapi.com/products?limit=6"
    ).then(asJson);
    const html = products
      .map(
        (p) => `
      <div style="display:flex;gap:10px;margin:8px 0;">
        <img src="${p.image}" alt="${
          p.title
        }" style="width:50px;height:50px;object-fit:contain;">
        <div>
          <strong>${p.title}</strong><br>
          $${p.price.toFixed(2)}
        </div>
      </div>
    `
      )
      .join("");
    set("shopping-output", html);
  } catch (e) {
    set("shopping-output", `<p>Error loading products: ${e.message}</p>`);
  }
}

/* ========== 3. Music Search (iTunes) ========== */
async function getMusic() {
  const q = $("#music-postcode")?.value?.trim();
  if (!q) return set("weather-output", "<p>Please enter a song or artist.</p>");
  try {
    const data = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        q
      )}&entity=song&limit=5`
    ).then(asJson);
    if (!data.results?.length)
      return set("weather-output", "<p>No results found.</p>");
    const html = data.results
      .map(
        (track) => `
      <div style="margin-bottom:10px;">
        <img src="${track.artworkUrl60}" alt="${track.trackName}" style="border-radius:6px;">
        <div><strong>${track.trackName}</strong> by ${track.artistName}</div>
        <audio controls src="${track.previewUrl}"></audio>
      </div>
    `
      )
      .join("");
    set("weather-output", html);
  } catch (e) {
    set("weather-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 4. Currency Conversion (Frankfurter) ========== */
async function getExchangeRates() {
  const from = $("#cur-from").value.trim().toUpperCase();
  const to = $("#cur-to").value.trim().toUpperCase();
  const amount = parseFloat($("#cur-amount").value);
  if (!from || !to || !amount)
    return set("currency-output", "<p>Please fill out all fields.</p>");

  try {
    const data = await fetch(
      `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
    ).then(asJson);
    set(
      "currency-output",
      `<p>${amount} ${from} = <strong>${data.rates[to]}</strong> ${to}</p>`
    );
  } catch (e) {
    set("currency-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 5. Trending News (Hacker News Algolia) ========== */
async function getNews() {
  const query = $("#news-query").value.trim() || "tech";
  try {
    const data = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}`
    ).then(asJson);
    const html = data.hits
      .slice(0, 5)
      .map(
        (n) => `
      <div style="margin:8px 0;">
        <a href="${n.url}" target="_blank">${n.title}</a>
        <div style="font-size:12px;color:#555;">By ${n.author} | Points: ${n.points}</div>
      </div>
    `
      )
      .join("");
    set("news-output", html || "<p>No results found.</p>");
  } catch (e) {
    set("news-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 6. Dictionary (Dictionary API) ========== */
async function getDictionary() {
  const word = $("#dictionary-user").value.trim();
  if (!word) return set("dictionary-output", "<p>Type a word to search.</p>");
  try {
    const data = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    ).then(asJson);
    const defs = data[0]?.meanings[0]?.definitions.slice(0, 2) || [];
    set(
      "dictionary-output",
      defs.length
        ? `<strong>${word}</strong><ul>${defs
            .map((d) => `<li>${d.definition}</li>`)
            .join("")}</ul>`
        : "<p>No definitions found.</p>"
    );
  } catch (e) {
    set("dictionary-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 7. Public Holidays (Nager.Date) ========== */
async function getJoke() {
  const raw = $("#calender-user").value.trim();
  let country = "US",
    year = new Date().getFullYear();
  if (raw) {
    const parts = raw.split(" ");
    if (parts[0]) country = parts[0].toUpperCase();
    if (parts[1]) year = parts[1];
  }
  try {
    const data = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
    ).then(asJson);
    const html = data
      .slice(0, 5)
      .map((h) => `<li>${h.date} — ${h.localName}</li>`)
      .join("");
    set("calender-output", `<ul>${html}</ul>`);
  } catch (e) {
    set("calender-output", `<p>Error: ${e.message}</p>`);
  }
}

/* ========== 8. Random Food Images (Foodish) ========== */
async function getPublicApiInfo() {
  try {
    const data = await fetch("https://foodish-api.com/api/").then(asJson);
    set(
      "food-output",
      `<img src="${data.image}" alt="Random food" style="max-width:100%;">`
    );
  } catch (e) {
    set("food-output", `<p>Error: ${e.message}</p>`);
  }
}