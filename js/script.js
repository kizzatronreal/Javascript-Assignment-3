const API_KEY = "qxxqDX3ytA2RuymPkmP58mpIq57kOCxWJu1n6pID"; 
const APOD_BASE_URL = "https://api.nasa.gov/planetary/apod";

// Student Info
function addStudentInfo() {
  const studentId = "200601722";
  const studentName = "Luke Fanelli";

  const infoParagraph = document.getElementById("student-info");
  infoParagraph.textContent = `Student: ${studentName} | ID: ${studentId}`;
}

// Fetch Single Day's APOD Data
async function fetchApod(dateString) {
  // Build the request URl
  // returns today's picture.
  const url = new URL(APOD_BASE_URL);
  url.searchParams.set("api_key", API_KEY);
  if (dateString) {
    url.searchParams.set("date", dateString);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA API request failed (status ${response.status})`);
  }

  return response.json();
}


//Get a range of days for the gallery
async function fetchApodRange(startDate, endDate) {
  const url = new URL(APOD_BASE_URL);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA API request failed (status ${response.status})`);
  }

  return response.json();
}

//Render the featured card
function renderFeatured(apod) {
  const loadingEl = document.getElementById("featured-loading");
  const contentEl = document.getElementById("featured-content");
  const mediaEl = document.getElementById("featured-media");
  const titleEl = document.getElementById("featured-title");
  const dateEl = document.getElementById("featured-date");
  const copyrightEl = document.getElementById("featured-copyright");
  const explanationEl = document.getElementById("featured-explanation");
  const hdLinkEl = document.getElementById("featured-hd-link");

  // <iframe> for the (rarer) days where NASA posts a video
  if (apod.media_type === "image") {
    mediaEl.innerHTML = `<img src="${apod.url}" alt="${escapeHtml(apod.title)}" />`;
  } else if (apod.media_type === "video") {
    mediaEl.innerHTML = `<iframe src="${apod.url}" title="${escapeHtml(apod.title)}"
      frameborder="0" allowfullscreen height="320"></iframe>`;
  } else {
    mediaEl.innerHTML = `<p>Unsupported media type.</p>`;
  }

  titleEl.textContent = apod.title;
  dateEl.textContent = apod.date;
  copyrightEl.textContent = apod.copyright ? `© ${apod.copyright.trim()}` : "Public Domain / NASA";
  explanationEl.textContent = apod.explanation;

  if (apod.hdurl) {
    hdLinkEl.href = apod.hdurl;
    hdLinkEl.classList.remove("hidden");
  } else {
    hdLinkEl.classList.add("hidden");
  }

  loadingEl.classList.add("hidden");
  contentEl.classList.remove("hidden");
}


// render the Gallery grid
function renderGallery(apodList) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = ""; // clear previous results

  // Show newest first
  const sorted = [...apodList].sort((a, b) => (a.date < b.date ? 1 : -1));

  sorted.forEach((apod) => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    const mediaHtml =
      apod.media_type === "image"
        ? `<img src="${apod.url}" alt="${escapeHtml(apod.title)}" loading="lazy" />`
        : `<div class="no-image">🎬 Video entry<br />(click to open)</div>`;

    card.innerHTML = `
      ${mediaHtml}
      <div class="gallery-card-body">
        <h3>${escapeHtml(apod.title)}</h3>
        <span>${apod.date}</span>
      </div>
    `;

    // Clicking a gallery card loads it into the big featured card above
    card.addEventListener("click", () => {
      renderFeatured(apod);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    gallery.appendChild(card);
  });
}


// helpers
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function toggle(el, show) {
  el.classList.toggle("hidden", !show);
}


// event wiring
async function loadTodayFeatured() {
  try {
    const apod = await fetchApod(); // no date = today
    renderFeatured(apod);
  } catch (err) {
    document.getElementById("featured-loading").textContent =
      "Could not load today's picture. " + err.message;
  }
}

async function loadFeaturedForDate(dateString) {
  const loadingEl = document.getElementById("featured-loading");
  const contentEl = document.getElementById("featured-content");

  toggle(contentEl, false);
  toggle(loadingEl, true);
  loadingEl.textContent = `Loading picture for ${dateString}...`;

  try {
    const apod = await fetchApod(dateString);
    renderFeatured(apod);
  } catch (err) {
    loadingEl.textContent = "Could not load that date. " + err.message;
  }
}

async function loadRandomWeekGallery() {
  const galleryLoading = document.getElementById("gallery-loading");
  const randomBtn = document.getElementById("random-week-btn");

  toggle(galleryLoading, true);
  randomBtn.disabled = true;

  try {
    // Pick a random 7-day window sometime in the last ~10 years
    const today = new Date();
    const maxDaysAgo = 365 * 10;
    const randomOffset = Math.floor(Math.random() * maxDaysAgo) + 8;

    const end = new Date(today);
    end.setDate(end.getDate() - randomOffset);

    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const list = await fetchApodRange(formatDate(start), formatDate(end));
    renderGallery(list);
  } catch (err) {
    document.getElementById("gallery").innerHTML =
      `<p class="loading">Could not load gallery: ${err.message}</p>`;
  } finally {
    toggle(galleryLoading, false);
    randomBtn.disabled = false;
  }
}


// initilalize on page load
document.addEventListener("DOMContentLoaded", () => {
  addStudentInfo();

  // Set the date picker's max to today (APOD has no future entries)
  const datePicker = document.getElementById("date-picker");
  const todayStr = formatDate(new Date());
  datePicker.max = todayStr;
  datePicker.value = todayStr;

  // Initial loads
  loadTodayFeatured();
  loadRandomWeekGallery();

  // Button listeners
  document.getElementById("load-date-btn").addEventListener("click", () => {
    const chosenDate = datePicker.value;
    if (chosenDate) {
      loadFeaturedForDate(chosenDate);
    }
  });

  document.getElementById("random-week-btn").addEventListener("click", loadRandomWeekGallery);
});
