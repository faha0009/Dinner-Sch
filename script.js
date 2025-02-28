const selections = loadSelectionsFromLocalStorage() || {
  Jason: new Set(),
  Arthur: new Set(),
  Cameron: new Set(),
  George: new Set(),
};

let currentUser = "Jason";

// Function to save selections to local storage
function saveSelectionsToLocalStorage() {
  // Convert Sets to arrays for storage
  const selectionsToSave = {};

  Object.keys(selections).forEach((user) => {
    selectionsToSave[user] = Array.from(selections[user]);
  });

  localStorage.setItem(
    "dinnerSchedulerSelections",
    JSON.stringify(selectionsToSave)
  );
}

// Function to load selections from local storage
function loadSelectionsFromLocalStorage() {
  const savedSelections = localStorage.getItem("dinnerSchedulerSelections");

  if (!savedSelections) {
    return null;
  }

  const parsedSelections = JSON.parse(savedSelections);
  const loadedSelections = {};

  // Convert arrays back to Sets
  Object.keys(parsedSelections).forEach((user) => {
    loadedSelections[user] = new Set(parsedSelections[user]);
  });

  return loadedSelections;
}

function generateDates() {
  // This function remains the same
  const dates = [];
  const startDate = new Date(2025, 2, 1); // March 1, 2025
  const endDate = new Date(2025, 2, 31); // March 31, 2025

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

function createCalendar() {
  // This function remains mostly the same
  const datesGrid = document.getElementById("datesGrid");
  const dates = generateDates();

  // Clear existing calendar
  datesGrid.innerHTML = "";

  // Add empty cells for proper alignment
  const firstDay = dates[0].getDay();
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    datesGrid.appendChild(emptyCell);
  }

  // Add date buttons
  dates.forEach((date) => {
    const button = document.createElement("button");
    button.className = "date-button";
    button.textContent = date.getDate();

    // Create adjusted date string for comparison
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    const dateStr = `${adjustedDate.getFullYear()}-${String(
      adjustedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`;

    if (selections[currentUser].has(dateStr)) {
      button.classList.add("selected");
    }
    if (isCommonDate(dateStr)) {
      button.classList.add("common");
    }

    button.addEventListener("click", () => toggleDate(date));
    datesGrid.appendChild(button);
  });
}

function toggleDate(date) {
  // Create a new date object and set it to noon to avoid timezone issues
  const adjustedDate = new Date(date);
  adjustedDate.setHours(12, 0, 0, 0);

  // Format the date string using local timezone
  const dateStr = `${adjustedDate.getFullYear()}-${String(
    adjustedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`;

  if (selections[currentUser].has(dateStr)) {
    selections[currentUser].delete(dateStr);
  } else {
    selections[currentUser].add(dateStr);
  }

  // Save to local storage whenever a date is toggled
  saveSelectionsToLocalStorage();

  updateDisplay();
}

function isCommonDate(dateStr) {
  return Object.values(selections).every((userDates) => userDates.has(dateStr));
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function updateDisplay() {
  // Update calendar
  createCalendar();

  // Update selected dates display
  const selectedDatesDiv = document.getElementById("selectedDates");
  selectedDatesDiv.innerHTML = "";

  Object.entries(selections).forEach(([user, dates]) => {
    const userDiv = document.createElement("div");
    userDiv.className = "user-dates";

    const userTitle = document.createElement("h3");
    userTitle.textContent = user;

    const datesList = document.createElement("div");
    datesList.className = "dates-list";
    datesList.textContent =
      dates.size > 0
        ? Array.from(dates).sort().map(formatDate).join(", ")
        : "No dates selected";

    userDiv.appendChild(userTitle);
    userDiv.appendChild(datesList);
    selectedDatesDiv.appendChild(userDiv);
  });

  // Update common dates
  const commonDatesDiv = document.getElementById("commonDates");
  const commonDates = new Set();

  if (Object.values(selections).every((dates) => dates.size > 0)) {
    const firstUserDates = Array.from(Object.values(selections)[0]);
    firstUserDates.forEach((date) => {
      if (isCommonDate(date)) {
        commonDates.add(date);
      }
    });
  }

  commonDatesDiv.textContent =
    commonDates.size > 0
      ? Array.from(commonDates).sort().map(formatDate).join(", ")
      : "No common dates found yet";
}

// Event Listeners
document.getElementById("userSelect").addEventListener("change", (e) => {
  currentUser = e.target.value;
  updateDisplay();
});

// Video play button functionality
const myVideo = document.getElementById("myVideo");
const playButton = document.getElementById("playButton");

if (playButton && myVideo) {
  playButton.addEventListener("click", () => {
    myVideo.play();
    myVideo.muted = false;
    playButton.style.display = "none";
  });

  // Show play button if video is paused
  myVideo.addEventListener("pause", () => {
    playButton.style.display = "block";
  });
}

// Initial display
updateDisplay();
