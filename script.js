// Initialize selections object
let selections = {
  Jason: new Set(),
  Arthur: new Set(),
  Cameron: new Set(),
  George: new Set(),
};

let currentUser = "Jason";
let binId = localStorage.getItem("dinnerSchedulerBinId");

// Function to fetch selections from JSONbin
async function fetchSelections() {
  try {
    // If no bin ID exists yet, create one
    if (!binId) {
      await createBin();
      return;
    }

    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${binId}/latest`,
      {
        method: "GET",
        headers: {
          "X-Access-Key":
            "$2a$10$yfHnouEKiE8UawDhqDdEHuYNjQshFI8Ea5DQpWKKwFeGaYtziT1F",
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching data:", response.statusText);
      if (response.status === 404) {
        // Bin not found, create a new one
        localStorage.removeItem("dinnerSchedulerBinId");
        await createBin();
      }
      return;
    }

    const result = await response.json();
    const data = result.record;

    // Convert arrays to Sets
    Object.keys(selections).forEach((user) => {
      if (data[user]) {
        selections[user] = new Set(data[user]);
      }
    });

    updateDisplay();
    console.log("Loaded from JSONbin:", data);
  } catch (error) {
    console.error("Error fetching selections:", error);
  }
}

// Create a new bin for first time use
async function createBin() {
  try {
    // Convert Sets to arrays for JSON
    const arraySelections = {};
    Object.keys(selections).forEach((user) => {
      arraySelections[user] = Array.from(selections[user]);
    });

    const response = await fetch("https://api.jsonbin.io/v3/b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key":
          "$2a$10$yfHnouEKiE8UawDhqDdEHuYNjQshFI8Ea5DQpWKKwFeGaYtziT1F",
        "X-Bin-Private": "false",
      },
      body: JSON.stringify(arraySelections),
    });

    if (!response.ok) {
      throw new Error("Failed to create bin");
    }

    const result = await response.json();
    binId = result.metadata.id;
    localStorage.setItem("dinnerSchedulerBinId", binId);
    console.log("Created new JSONbin:", binId);
  } catch (error) {
    console.error("Error creating bin:", error);
  }
}

// Function to save selections to JSONbin
async function saveSelectionsToJSONbin() {
  try {
    if (!binId) {
      await createBin();
      return;
    }

    // Convert Sets to arrays for JSON
    const arraySelections = {};
    Object.keys(selections).forEach((user) => {
      arraySelections[user] = Array.from(selections[user]);
    });

    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key":
          "$2a$10$yfHnouEKiE8UawDhqDdEHuYNjQshFI8Ea5DQpWKKwFeGaYtziT1F",
      },
      body: JSON.stringify(arraySelections),
    });

    if (!response.ok) {
      throw new Error("Failed to update bin");
    }

    console.log("Saved to JSONbin");
  } catch (error) {
    console.error("Error saving to JSONbin:", error);
  }
}

function generateDates() {
  const dates = [];
  const startDate = new Date(2025, 2, 1); // March 1, 2025
  const endDate = new Date(2025, 2, 31); // March 31, 2025

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

function createCalendar() {
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

async function toggleDate(date) {
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

  // Save to JSONbin whenever a date is toggled
  await saveSelectionsToJSONbin();

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

// Test JSONbin connection
window.testJSONbin = async function () {
  try {
    const testResponse = await fetch("https://api.jsonbin.io/v3/c", {
      method: "GET",
      headers: {
        "X-Access-Key":
          "$2a$10$yfHnouEKiE8UawDhqDdEHuYNjQshFI8Ea5DQpWKKwFeGaYtziT1F",
      },
    });

    if (testResponse.ok) {
      alert("JSONbin connection is working!");
    } else {
      alert("JSONbin connection failed: " + testResponse.statusText);
    }
  } catch (e) {
    alert("Error testing JSONbin: " + e.message);
  }
};

// Load data when page loads
document.addEventListener("DOMContentLoaded", fetchSelections);
