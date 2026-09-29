// =========================================
// GET CURRENT USER FROM BACKEND
// =========================================

async function loadCurrentUserFromBackend() {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const response = await fetch("http://localhost:5000/api/user/profile", {
      method: "GET",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem("hvacToken");
      window.location.href = "login.html";
      return null;
    }

    // Save latest backend user data
    localStorage.setItem("hvacCurrentUser", JSON.stringify(data.user));

    return data.user;
  } catch (error) {
    console.error("Backend User Fetch Error:", error);

    return null;
  }
}

// =========================================
// DASHBOARD AUTHENTICATION
// =========================================

// =========================================
// DASHBOARD INITIALIZATION
// =========================================

async function initializeDashboard() {
  const currentUser = await loadCurrentUserFromBackend();

  if (!currentUser) {
    return;
  }

  // =========================================
  // SHOW STUDENT NAME
  // =========================================

  const studentName = document.getElementById("studentName");

  if (studentName && currentUser) {
    studentName.textContent = currentUser.name;
  }
  // =========================================
  // GET USER ORDERS
  // =========================================

  // =========================================
  // GET USER ORDERS FROM BACKEND
  // =========================================

  let orders = [];

  try {
    const token = localStorage.getItem("hvacToken");

    const response = await fetch("http://localhost:5000/api/orders", {
      method: "GET",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (response.ok) {
      orders = data.orders || [];
    } else {
      console.error("Orders Fetch Error:", data.message);
    }
  } catch (error) {
    console.error("Backend Orders Error:", error);
  }

  // =========================================
  // GET USER COURSES
  // =========================================

  // let myCourses = [];

  // if (currentUser) {
  //   orders.forEach(function (order) {
  //     if (order.customer && order.customer.email === currentUser.email) {
  //       if (Array.isArray(order.courses)) {
  //         myCourses = myCourses.concat(order.courses);
  //       }
  //     }
  //   });
  // }

  let myCourses = [];

  if (currentUser) {
    orders.forEach(function (order) {
      // Only Paid orders should give course access
      if (
        ["Paid", "Completed", "Success", "Successful"].includes(order.status) &&
        Array.isArray(order.courses)
      ) {
        myCourses = myCourses.concat(order.courses);
      }
    });
  }

  // =========================================
  // GET CURRENT COURSES FROM BACKEND
  // =========================================

  let activeCourseIds = [];

  try {
    const response = await fetch("http://localhost:5000/api/courses");

    const data = await response.json();

    if (response.ok && Array.isArray(data.courses)) {
      activeCourseIds = data.courses.map(function (course) {
        return course.id;
      });
    }
  } catch (error) {
    console.error("Current Courses Fetch Error:", error);
  }
  // =========================================
  // REMOVE DUPLICATE COURSES
  // =========================================

  const uniqueCourses = [];

  myCourses.forEach(function (course) {
    if (!activeCourseIds.includes(course.id)) {
      return;
    }

    const alreadyExists = uniqueCourses.some(function (item) {
      return item.id === course.id;
    });

    if (!alreadyExists) {
      uniqueCourses.push(course);
    }
  });
  // =========================================
  // UPDATE COURSE COUNT
  // =========================================

  const courseCount = document.getElementById("courseCount");

  if (courseCount) {
    courseCount.textContent = uniqueCourses.length;
  }

  // =========================================
  // COURSE DETAILS
  // =========================================

  const courseDetails = {
    "hvac-fundamentals": {
      lessons: 25,
    },

    "air-conditioning": {
      lessons: 20,
    },

    refrigeration: {
      lessons: 30,
    },

    "hvac-electrical": {
      lessons: 22,
    },

    "installation-service": {
      lessons: 35,
    },

    troubleshooting: {
      lessons: 28,
    },
  };

  // =========================================
  // LESSON COUNT
  // =========================================

  const lessonCount = document.getElementById("lessonCount");

  if (lessonCount) {
    let totalLessons = 0;

    uniqueCourses.forEach(function (course) {
      const courseData = courseDetails[course.id];

      if (courseData) {
        totalLessons += courseData.lessons;
      }
    });

    lessonCount.textContent = totalLessons;
  }
  // =========================================
  // PROGRESS
  // =========================================

  const progressPercent = document.getElementById("progressPercent");
  // =========================================
  // OVERALL PROGRESS FROM MONGODB
  // =========================================

  if (progressPercent) {
    let totalProgress = 0;

    let courseCountForProgress = 0;

    const token = localStorage.getItem("hvacToken");

    if (token) {
      try {
        const progressResults = await Promise.all(
          uniqueCourses.map(async function (course) {
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
                return Number(data.progress.progress) || 0;
              }

              return 0;
            } catch (error) {
              console.error("Overall Progress Load Error:", error);

              return 0;
            }
          }),
        );

        progressResults.forEach(function (progress) {
          totalProgress += progress;

          courseCountForProgress++;
        });

        const overallProgress =
          courseCountForProgress > 0
            ? Math.round(totalProgress / courseCountForProgress)
            : 0;

        progressPercent.textContent = overallProgress + "%";

        const learningProgressCircle = document.getElementById(
          "learningProgressCircle",
        );

        if (learningProgressCircle) {
          learningProgressCircle.textContent = overallProgress + "%";
        }

        // =========================================
        // PROGRESS MESSAGE
        // =========================================

        const progressTitle = document.getElementById("progressTitle");

        const progressMessage = document.getElementById("progressMessage");

        if (progressTitle && progressMessage) {
          if (overallProgress >= 100) {
            progressTitle.textContent = "Course Completed! 🎉";

            progressMessage.textContent =
              "Congratulations! You have successfully completed your course.";
          } else if (overallProgress > 0) {
            progressTitle.textContent = "Keep Learning!";

            progressMessage.textContent =
              "Continue your course to reach 100% completion.";
          } else {
            progressTitle.textContent = "Start your learning";

            progressMessage.textContent =
              "Your course progress will appear here.";
          }
        }
      } catch (error) {
        console.error("Dashboard Overall Progress Error:", error);
      }
    }
  }
  // =========================================
  // LESSONS COMPLETED
  // =========================================

  // =========================================
  // LOAD LESSON PROGRESS FROM MONGODB
  // =========================================

  const completedLessonsCount = document.getElementById("lessonCount");

  if (completedLessonsCount) {
    let totalCompletedLessons = 0;

    const token = localStorage.getItem("hvacToken");

    if (token) {
      try {
        const progressResults = await Promise.all(
          uniqueCourses.map(async function (course) {
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
                return data.progress.completedLectures?.length || 0;
              }

              return 0;
            } catch (error) {
              console.error("Progress Load Error:", error);

              return 0;
            }
          }),
        );

        progressResults.forEach(function (completedCount) {
          totalCompletedLessons += completedCount;
        });

        completedLessonsCount.textContent = totalCompletedLessons;
      } catch (error) {
        console.error("Dashboard Progress Error:", error);
      }
    }
  }

  // =========================================
  // CERTIFICATE COUNT
  // =========================================

  const certificateCount = document.getElementById("certificateCount");

  if (certificateCount) {
    let completedCourses = 0;

    const token = localStorage.getItem("hvacToken");

    if (token) {
      try {
        const certificateResults = await Promise.all(
          uniqueCourses.map(async function (course) {
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
                return Number(data.progress.progress) >= 100;
              }

              return false;
            } catch (error) {
              console.error("Certificate Count Error:", error);

              return false;
            }
          }),
        );

        certificateResults.forEach(function (isCompleted) {
          if (isCompleted) {
            completedCourses++;
          }
        });

        certificateCount.textContent = completedCourses;
      } catch (error) {
        console.error("Certificate Count Load Error:", error);

        certificateCount.textContent = "0";
      }
    }
  }
  // =========================================
  // DISPLAY MY COURSES
  // =========================================

  const myCoursesContainer = document.getElementById("myCourses");

  if (myCoursesContainer && uniqueCourses.length > 0) {
    myCoursesContainer.innerHTML = "";

    // =========================================
    // GET BACKEND PROGRESS FOR EACH COURSE
    // =========================================

    uniqueCourses.forEach(async function (course) {
      const courseItem = document.createElement("div");

      courseItem.className = "dashboard-course-item";

      // Default progress
      let progress = 0;

      // =========================================
      // GET COURSE PROGRESS
      // =========================================

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
            progress = Number(data.progress.progress) || 0;
          }
        } catch (error) {
          console.error("Course Progress Load Error:", error);
        }
      }

      // =========================================
      // COURSE BUTTON
      // =========================================
      // =========================================
      // COURSE BUTTON
      // =========================================
      let courseButton = "";

      if (progress >= 100) {
        courseButton = `
    <div class="dashboard-course-actions">

      <a
        href="course-player.html?id=${course.id}"
        class="dashboard-btn"
      >
        📖 Study Course
      </a>

      <a
        href="certificate.html?id=${course.id}"
        class="dashboard-btn"
      >
        🏆 View Certificate
      </a>

    </div>
  `;
      } else {
        courseButton = `
    <a
      href="course-player.html?id=${course.id}"
      class="dashboard-btn"
    >
      📖 Continue Learning
    </a>
  `;
      }

      // =========================================
      // COURSE CARD
      // =========================================

      courseItem.innerHTML = `

      <div class="dashboard-course-info">

        <div class="dashboard-course-icon">
          📚
        </div>

        <div>

          <h3>
            ${course.title}
          </h3>

          <p>
            ${course.price}
          </p>

          <p class="course-progress-text">
            Progress: ${progress}%
          </p>

        </div>

      </div>

      ${courseButton}

    `;

      myCoursesContainer.appendChild(courseItem);
    });
  }
}

// =========================================
// LOGOUT
// =========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
      return;
    }
    // Remove logged-in user
    localStorage.removeItem("hvacCurrentUser");
    localStorage.removeItem("hvacToken");

    // Redirect to login
    window.location.href = "login.html";
  });
}

// =========================================
// START DASHBOARD
// =========================================
initializeDashboard();
// =========================================
// PREVENT BACK-BUTTON ACCESS AFTER LOGOUT
// =========================================

window.addEventListener("pageshow", function () {
  const user = localStorage.getItem("hvacCurrentUser");
  const authToken = localStorage.getItem("hvacToken");

  if (!user || !authToken) {
    window.location.replace("login.html");
  }
});
