// ========================================
// STUDENT LIVE CLASSES
// ========================================

const liveNowContainer = document.getElementById("liveNowContainer");

const upcomingClassesContainer = document.getElementById(
  "upcomingClassesContainer",
);

const completedClassesContainer = document.getElementById(
  "completedClassesContainer",
);

const liveNowEmpty = document.getElementById("liveNowEmpty");

const upcomingClassesEmpty = document.getElementById("upcomingClassesEmpty");

const completedClassesEmpty = document.getElementById("completedClassesEmpty");

// Get classes added by admin
let liveClasses = [];

async function loadLiveClasses() {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      "https://hvac-tutorial.onrender.com/api/live-classes",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Live Classes Fetch Error:", data.message);
      return;
    }

    liveClasses = Array.isArray(data.liveClasses) ? data.liveClasses : [];

    renderLiveClasses();
  } catch (error) {
    console.error("Student Live Classes Error:", error);
  }
}
loadLiveClasses();
// ========================================
// GET CLASS STATUS
// ========================================

function getClassStatus(liveClass) {
  const now = new Date();

  const classDateTime = new Date(liveClass.date + "T" + liveClass.time);

  const classEndTime = new Date(classDateTime.getTime() + 60 * 60 * 1000);

  if (now >= classDateTime && now < classEndTime) {
    return "live";
  }

  if (now < classDateTime) {
    return "upcoming";
  }

  return "completed";
}

// ========================================
// CREATE CLASS CARD
// ========================================

function createClassCard(liveClass, status) {
  const card = document.createElement("article");

  card.className = "live-class-card";

  let statusText = "📅 Upcoming";

  if (status === "live") {
    statusText = "🔴 Live Now";
  }

  if (status === "completed") {
    statusText = "✅ Completed";
  }

  let buttonHTML = "";

  if (status === "live") {
    buttonHTML = `
            <a
                href="${liveClass.link || "#"}"
                target="_blank"
                class="join-class-btn"
            >
                🔴 Join Live Class
            </a>
        `;
  } else if (status === "upcoming") {
    buttonHTML = `
            <a
                href="${liveClass.link || "#"}"
                target="_blank"
                class="join-class-btn"
            >
                📅 Class Details
            </a>
        `;
  } else {
    buttonHTML = `
            <a
                href="${liveClass.link || "#"}"
                target="_blank"
                class="join-class-btn"
            >
                ▶️ View Class
            </a>
        `;
  }

  card.innerHTML = `

        <div class="live-class-top">

            <span class="live-class-status">
                ${statusText}
            </span>

            <h3>
                ${liveClass.title || "HVAC Live Class"}
            </h3>

        </div>


        <div class="live-class-body">

            <div class="live-class-info">

                <span>
                    📚
                    <strong>Course:</strong>
                    ${liveClass.course || "HVAC"}
                </span>

                <span>
                    📅
                    <strong>Date:</strong>
                    ${liveClass.date || "N/A"}
                </span>

                <span>
                    🕐
                    <strong>Time:</strong>
                    ${liveClass.time || "N/A"}
                </span>

                <span>
                    👨‍🏫
                    <strong>Instructor:</strong>
                    ${liveClass.instructor || "HVAC Instructor"}
                </span>

            </div>


            ${buttonHTML}

        </div>
    `;

  return card;
}

// ========================================
// RENDER LIVE CLASSES
// ========================================

function renderLiveClasses() {
  if (
    !liveNowContainer ||
    !upcomingClassesContainer ||
    !completedClassesContainer
  ) {
    return;
  }

  liveNowContainer.innerHTML = "";
  upcomingClassesContainer.innerHTML = "";
  completedClassesContainer.innerHTML = "";

  let liveCount = 0;
  let upcomingCount = 0;
  let completedCount = 0;

  liveClasses.forEach(function (liveClass) {
    const status = getClassStatus(liveClass);

    const card = createClassCard(liveClass, status);

    if (status === "live") {
      liveNowContainer.appendChild(card);
      liveCount++;
    } else if (status === "upcoming") {
      upcomingClassesContainer.appendChild(card);
      upcomingCount++;
    } else {
      completedClassesContainer.appendChild(card);
      completedCount++;
    }
  });

  // Show / hide empty messages

  liveNowEmpty.style.display = liveCount === 0 ? "block" : "none";

  upcomingClassesEmpty.style.display = upcomingCount === 0 ? "block" : "none";

  completedClassesEmpty.style.display = completedCount === 0 ? "block" : "none";
}

// ========================================
// START
// ========================================

renderLiveClasses();
