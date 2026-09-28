// =========================================
// MY COURSES
// =========================================

// Get current logged-in user
const currentUser = JSON.parse(localStorage.getItem("hvacCurrentUser"));

// =========================================
// CHECK LOGIN
// =========================================

if (!currentUser) {
  window.location.href = "login.html";
}

// =========================================
// GET ELEMENTS
// =========================================

const myCoursesGrid = document.getElementById("myCoursesGrid");

const myCoursesEmpty = document.getElementById("myCoursesEmpty");

// =========================================
// GET USER'S PAID COURSES FROM BACKEND
// =========================================

let purchasedCourses = [];

async function loadPurchasedCourses() {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/orders",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Orders Fetch Error:",
        data.message
      );
      return;
    }

    if (Array.isArray(data.orders)) {
      data.orders.forEach(function (order) {
        // Only Paid orders unlock courses
        if (
          order.status === "Paid" &&
          Array.isArray(order.courses)
        ) {
          purchasedCourses =
            purchasedCourses.concat(order.courses);
        }
      });
    }
  } catch (error) {
    console.error(
      "My Courses Orders Error:",
      error
    );
  }
}

await loadPurchasedCourses();
// =========================================
// REMOVE DUPLICATE COURSES
// =========================================

const uniqueCourses = [];

purchasedCourses.forEach(function (course) {
  const exists = uniqueCourses.some(function (item) {
    return item.id === course.id;
  });

  if (!exists) {
    uniqueCourses.push(course);
  }
});

// =========================================
// SHOW EMPTY STATE
// =========================================

if (uniqueCourses.length === 0) {
  if (myCoursesGrid) {
    myCoursesGrid.style.display = "none";
  }

  if (myCoursesEmpty) {
    myCoursesEmpty.style.display = "block";
  }
}

// =========================================
// COURSE DATA
// =========================================

const courseDetails = {
  "hvac-fundamentals": {
    category: "AC",
    icon: "❄️",
    lessons: 25,
    description:
      "Learn the basic concepts of HVAC systems, components and working principles.",
  },

  "air-conditioning": {
    category: "AC",
    icon: "🌬️",
    lessons: 20,
    description:
      "Understand air conditioning systems, components, cooling cycle and operation.",
  },

  refrigeration: {
    category: "Refrigeration",
    icon: "🧊",
    lessons: 30,
    description:
      "Learn refrigeration principles, components, cycles and system operation.",
  },

  "hvac-electrical": {
    category: "Electrical",
    icon: "⚡",
    lessons: 22,
    description:
      "Learn HVAC electrical systems, wiring, controls and basic troubleshooting.",
  },

  "installation-service": {
    category: "Service",
    icon: "🔧",
    lessons: 35,
    description:
      "Learn HVAC installation procedures, servicing techniques and maintenance.",
  },

  troubleshooting: {
    category: "Service",
    icon: "🛠️",
    lessons: 28,
    description:
      "Learn practical HVAC troubleshooting, fault identification and service methods.",
  },
};

// =========================================
// DISPLAY PURCHASED COURSES
// =========================================

if (uniqueCourses.length > 0 && myCoursesGrid) {
  myCoursesGrid.innerHTML = "";

  uniqueCourses.forEach(async function (course) {
    const details = courseDetails[course.id] || {
      category: "HVAC",

      icon: "📚",

      lessons: 0,

      description: "Continue learning with this HVAC course.",
    };

    // =====================================
    // GET COURSE PROGRESS
    // =====================================

    let savedProgress = 0;

    const token = localStorage.getItem("hvacToken");

    if (token) {
      try {
        const response = await fetch(
          "http://localhost:5000/api/progress/" + course.id,
          {
            method: "GET",

            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.progress) {
          savedProgress = Number(data.progress.progress) || 0;
        }
      } catch (error) {
        console.error("My Courses Progress Error:", error);
      }
    }

    // =====================================
    // CREATE COURSE CARD
    // =====================================

    const courseCard = document.createElement("article");

    courseCard.className = "my-course-card";

    courseCard.innerHTML = `

            <div class="my-course-image">
                ${details.icon}
            </div>

            <div class="my-course-content">

                <span class="my-course-category">
                    ${details.category}
                </span>

                <h2>
                    ${course.title}
                </h2>

                <p>
                    ${details.description}
                </p>


                <div class="course-progress">

                    <div class="course-progress-header">

                        <span>
                            Progress
                        </span>

                        <strong>
                            ${savedProgress}%
                        </strong>

                    </div>

                    <div class="progress-bar">

                        <div
                            class="progress-bar-fill"
                            style="width: ${savedProgress}%"
                        ></div>

                    </div>

                </div>

                  <div class="my-course-footer">

    <span class="course-meta">
        ${details.lessons} Lessons
    </span>

    ${
      savedProgress >= 100
        ? `
                <a
                    href="certificate.html?id=${course.id}"
                    class="continue-course-btn"
                >
                    🏆 View Certificate
                </a>
              `
        : `
                <a
                    href="course-player.html?id=${course.id}"
                    class="continue-course-btn"
                >
                    Continue
                </a>
              `
    }

               </div>  
             
            </div>

        `;

    myCoursesGrid.appendChild(courseCard);
  });
}
