// =========================================
// COURSE PLAYER
// =========================================

// =========================================
// CHECK LOGIN
// =========================================

const currentUser = JSON.parse(localStorage.getItem("hvacCurrentUser"));

if (!currentUser) {
  window.location.href = "login.html";
}

// =========================================
// GET COURSE ID
// =========================================

const urlParams = new URLSearchParams(window.location.search);

const courseId = urlParams.get("id") || "hvac-fundamentals";

// =========================================
// COURSE DATA
// =========================================

const courses = {
  "hvac-fundamentals": {
    title: "HVAC Fundamentals",

    category: "AC",

    description:
      "Learn the basic concepts of HVAC systems, components and working principles.",

    lectures: [
      {
        title: "Introduction to HVAC",
        duration: "10 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description:
          "Introduction to HVAC systems and the basic concepts you need to understand.",
      },

      {
        title: "HVAC System Components",
        duration: "15 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn about the major components used in HVAC systems.",
      },

      {
        title: "Heating Systems",
        duration: "12 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description:
          "Understand the basic working principles of heating systems.",
      },

      {
        title: "Cooling Systems",
        duration: "14 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description:
          "Learn the basic principles of cooling systems used in HVAC.",
      },

      {
        title: "Air Distribution",
        duration: "11 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Understand air distribution and airflow in HVAC systems.",
      },
    ],
  },

  "air-conditioning": {
    title: "Air Conditioning Basics",

    category: "AC",

    description:
      "Understand air conditioning systems, components, cooling cycle and operation.",

    lectures: [
      {
        title: "Introduction to Air Conditioning",
        duration: "10 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn the fundamentals of air conditioning systems.",
      },

      {
        title: "Refrigeration Cycle",
        duration: "15 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description:
          "Understand the basic refrigeration cycle used in air conditioning.",
      },

      {
        title: "Compressor",
        duration: "12 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn about compressor types and their function.",
      },

      {
        title: "Condenser",
        duration: "11 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Understand the function and operation of condensers.",
      },

      {
        title: "Evaporator",
        duration: "13 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn about evaporators and their role in cooling.",
      },
    ],
  },

  refrigeration: {
    title: "Refrigeration Fundamentals",

    category: "Refrigeration",

    description:
      "Learn refrigeration principles, components, cycles and system operation.",

    lectures: [
      {
        title: "Introduction to Refrigeration",
        duration: "10 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description:
          "Introduction to refrigeration systems and their applications.",
      },

      {
        title: "Refrigeration Cycle",
        duration: "16 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn how the refrigeration cycle works.",
      },

      {
        title: "Refrigerant",
        duration: "12 min",
        video: "",
        description: "Understand refrigerants and their basic characteristics.",
      },

      {
        title: "Compressor and Condenser",
        duration: "15 min",
        video: "../assets/videos/hvac-introduction.mp4",
        description: "Learn about compressor and condenser operation.",
      },

      {
        title: "Expansion Device",
        duration: "11 min",
        video: "",
        description:
          "Understand expansion devices used in refrigeration systems.",
      },
    ],
  },

  "hvac-electrical": {
    title: "HVAC Electrical & Controls",

    category: "Electrical",

    description:
      "Learn HVAC electrical systems, wiring, controls and basic troubleshooting.",

    lectures: [
      {
        title: "HVAC Electrical Basics",
        duration: "12 min",
        video: "",
        description:
          "Introduction to electrical concepts used in HVAC systems.",
      },

      {
        title: "Electrical Components",
        duration: "15 min",
        video: "",
        description:
          "Learn about important electrical components used in HVAC.",
      },

      {
        title: "Wiring Basics",
        duration: "14 min",
        video: "",
        description: "Understand basic HVAC wiring concepts.",
      },

      {
        title: "HVAC Controls",
        duration: "13 min",
        video: "",
        description: "Learn the fundamentals of HVAC control systems.",
      },

      {
        title: "Electrical Troubleshooting",
        duration: "16 min",
        video: "",
        description: "Understand basic electrical troubleshooting techniques.",
      },
    ],
  },

  "installation-service": {
    title: "HVAC Installation & Service",

    category: "Service",

    description:
      "Learn HVAC installation procedures, servicing techniques and maintenance.",

    lectures: [
      {
        title: "HVAC Installation Basics",
        duration: "12 min",
        video: "",
        description: "Introduction to HVAC installation procedures.",
      },

      {
        title: "Tools Used in HVAC Service",
        duration: "10 min",
        video: "",
        description: "Learn about common tools used by HVAC technicians.",
      },

      {
        title: "Installation Procedure",
        duration: "18 min",
        video: "",
        description:
          "Understand the basic steps involved in HVAC installation.",
      },

      {
        title: "Maintenance",
        duration: "14 min",
        video: "",
        description: "Learn basic HVAC maintenance procedures.",
      },

      {
        title: "Service Practices",
        duration: "15 min",
        video: "",
        description: "Understand practical HVAC servicing practices.",
      },
    ],
  },

  troubleshooting: {
    title: "HVAC Troubleshooting",

    category: "Service",

    description:
      "Learn practical HVAC troubleshooting, fault identification and service methods.",

    lectures: [
      {
        title: "Introduction to Troubleshooting",
        duration: "10 min",
        video: "",
        description: "Learn the basic approach to HVAC troubleshooting.",
      },

      {
        title: "Common HVAC Problems",
        duration: "14 min",
        video: "",
        description: "Understand common HVAC problems and their causes.",
      },

      {
        title: "Cooling Problems",
        duration: "15 min",
        video: "",
        description: "Learn how to identify common cooling problems.",
      },

      {
        title: "Electrical Problems",
        duration: "16 min",
        video: "",
        description: "Understand common electrical problems in HVAC systems.",
      },

      {
        title: "Troubleshooting Process",
        duration: "18 min",
        video: "",
        description: "Learn a structured approach to HVAC troubleshooting.",
      },
    ],
  },
};

// =========================================
// CHECK COURSE
// =========================================

const course = courses[courseId];

if (!course) {
  alert("Course not found");
  window.location.href = "my-courses.html";
}

// =========================================
// GET HTML ELEMENTS
// =========================================

const courseTitle = document.getElementById("courseTitle");

const courseCategory = document.getElementById("courseCategory");

const courseDescription = document.getElementById("courseDescription");

const courseProgress = document.getElementById("courseProgress");

const lectureList = document.getElementById("lectureList");

const lectureCount = document.getElementById("lectureCount");

const lectureVideo = document.getElementById("lectureVideo");

const videoSource = document.getElementById("videoSource");

const lectureTitle = document.getElementById("lectureTitle");

const lectureDescription = document.getElementById("lectureDescription");

const completeLectureBtn = document.getElementById("completeLectureBtn");

const previousLecture = document.getElementById("previousLecture");

const nextLecture = document.getElementById("nextLecture");

// =========================================
// COURSE INFORMATION
// =========================================

courseTitle.textContent = course.title;

courseCategory.textContent = course.category;

courseDescription.textContent = course.description;

lectureCount.textContent = course.lectures.length;

// =========================================
// CURRENT LECTURE
// =========================================

const lecturePositionKey =
  "hvacCurrentLecture_" + currentUser.id + "_" + courseId;

let currentLectureIndex =
  parseInt(localStorage.getItem(lecturePositionKey)) || 0;

// =========================================
// PROGRESS STORAGE KEY
// =========================================

const progressKey = "hvacProgress_" + currentUser.id + "_" + courseId;
// =========================================
// SAVE PROGRESS TO BACKEND
// =========================================

async function saveProgressToBackend() {

    const token = localStorage.getItem("hvacToken");

    if (!token) {
        console.log("No authentication token found.");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/progress",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    courseId: courseId,
                    completedLectures: completedLectures,
                    progress: Math.round(
                        (completedLectures.length /
                            course.lectures.length) * 100
                    ),
                    currentLecture: currentLectureIndex
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "Progress Save Failed:",
                data
            );
            return;
        }

        console.log(
            "Progress saved to MongoDB:",
            data
        );

    } catch (error) {

        console.error(
            "Progress Backend Error:",
            error
        );
    }
}


// =========================================
// CREATE CERTIFICATE
// =========================================

async function createCertificate() {

    const token =
        localStorage.getItem("hvacToken");

    if (!token) {
        console.log("No authentication token found.");
        return;
    }

    const certificateKey =
        "hvacCertificate_" +
        currentUser.id +
        "_" +
        courseId;

    let certificateId =
        localStorage.getItem(certificateKey);

    let completionDate =
        localStorage.getItem(
            certificateKey + "_date"
        );

    // Create certificate ID only if it does not exist
    if (!certificateId) {

        certificateId =
            "HVAC-" + Date.now();

        completionDate =
            new Date().toISOString();

        localStorage.setItem(
            certificateKey,
            certificateId
        );

        localStorage.setItem(
            certificateKey + "_date",
            completionDate
        );
    }

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/certificates",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({
                        certificateId:
                            certificateId,

                        courseId:
                            courseId,

                        courseName:
                            course.title,

                        completionDate:
                            completionDate
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "Certificate Save Failed:",
                data
            );

            return;
        }

        console.log(
            "Certificate saved to MongoDB:",
            data
        );

    } catch (error) {

        console.error(
            "Certificate Backend Error:",
            error
        );
    }
}
// =========================================
// COMPLETED LECTURES
// =========================================

let completedLectures =
  JSON.parse(localStorage.getItem(progressKey + "_lectures")) || [];

  // =========================================
// LOAD PROGRESS FROM BACKEND
// =========================================

async function loadProgressFromBackend() {

    const token =
        localStorage.getItem("hvacToken");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/progress/" + courseId,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "Progress Load Failed:",
                data
            );

            return;
        }

        if (data.progress) {

            completedLectures =
                data.progress.completedLectures || [];

            currentLectureIndex =
                data.progress.currentLecture || 0;

            // Keep localStorage updated too
            localStorage.setItem(
                progressKey + "_lectures",
                JSON.stringify(completedLectures)
            );

            localStorage.setItem(
                progressKey,
                data.progress.progress || 0
            );

            localStorage.setItem(
                lecturePositionKey,
                currentLectureIndex
            );

            console.log(
                "Progress loaded from MongoDB:",
                data.progress
            );
        }

    } catch (error) {

        console.error(
            "Progress Load Error:",
            error
        );
    }
}

// =========================================
// LOAD PROGRESS
// =========================================

function updateProgress() {

    const total = course.lectures.length;

    const completed = completedLectures.length;

    const percentage =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);

    courseProgress.textContent =
        percentage + "%";

    // Save progress locally
    localStorage.setItem(
        progressKey,
        percentage
    );

    // Save progress to MongoDB
    saveProgressToBackend();
}
// =========================================
// RENDER LECTURES
// =========================================

function renderLectures() {
  lectureList.innerHTML = "";

  course.lectures.forEach(function (lecture, index) {
    const lectureItem = document.createElement("button");

    lectureItem.type = "button";

    lectureItem.className = "lecture-item";

    if (index === currentLectureIndex) {
      lectureItem.classList.add("active");
    }

    if (completedLectures.includes(index)) {
      lectureItem.classList.add("completed");
    }

    lectureItem.innerHTML = `

                <div class="lecture-number">

                    ${completedLectures.includes(index) ? "✓" : index + 1}

                </div>

                <div class="lecture-info">

                    <strong>
                        ${lecture.title}
                    </strong>

                    <span>
                        ${lecture.duration}
                    </span>

                </div>

                ${
                  completedLectures.includes(index)
                    ? `<span class="lecture-status">✓</span>`
                    : ""
                }

            `;

    lectureItem.addEventListener("click", function () {
      currentLectureIndex = index;

      loadLecture();
    });

    lectureList.appendChild(lectureItem);
  });
}

// =========================================
// LOAD LECTURE
// =========================================

function loadLecture() {
  const lecture = course.lectures[currentLectureIndex];
  localStorage.setItem(lecturePositionKey, currentLectureIndex);

  lectureTitle.textContent = lecture.title;

  lectureDescription.textContent = lecture.description;

  // =====================================
  // VIDEO
  // =====================================

  if (lecture.video) {
    videoSource.src = lecture.video;

    lectureVideo.load();

    lectureVideo.addEventListener(
      "loadedmetadata",
      function () {
        const savedTime = parseFloat(
          localStorage.getItem(
            "hvacVideoTime_" +
              currentUser.id +
              "_" +
              courseId +
              "_" +
              currentLectureIndex,
          ),
        );

        if (savedTime && savedTime < lectureVideo.duration) {
          lectureVideo.currentTime = savedTime;
        }
      },
      { once: true },
    );
  } else {
    videoSource.src = "";
    lectureVideo.load();
  }

  // =====================================
  // COMPLETION BUTTON
  // =====================================

  const isCompleted = completedLectures.includes(currentLectureIndex);

  if (isCompleted) {
    completeLectureBtn.textContent = "✓ Completed";

    completeLectureBtn.classList.add("completed");
  } else {
    completeLectureBtn.textContent = "✓ Mark as Completed";

    completeLectureBtn.classList.remove("completed");
  }
  
  // =========================================
  // AUTO COMPLETE WHEN VIDEO ENDS
  // =========================================

  // =====================================
  // NAVIGATION
  // =====================================

  previousLecture.disabled = currentLectureIndex === 0;

  nextLecture.disabled = currentLectureIndex === course.lectures.length - 1;

  // =====================================
  // REFRESH LIST
  // =====================================

  renderLectures();
}

// =========================================
// SAVE VIDEO POSITION
// =========================================

lectureVideo.addEventListener(
    "timeupdate",
    function () {

        if (
            lectureVideo.duration &&
            !lectureVideo.ended
        ) {

            localStorage.setItem(
                "hvacVideoTime_" +
                currentUser.id +
                "_" +
                courseId +
                "_" +
                currentLectureIndex,
                lectureVideo.currentTime
            );

        }

    }
);


lectureVideo.addEventListener("ended", function () {
  if (!completedLectures.includes(currentLectureIndex)) {
    completedLectures.push(currentLectureIndex);

    localStorage.setItem(
      progressKey + "_lectures",
      JSON.stringify(completedLectures),
    );

    updateProgress();

    if (currentLectureIndex < course.lectures.length - 1) {
      currentLectureIndex++;
      loadLecture();
    }
  }
});
// =========================================
// MARK LECTURE COMPLETED
// =========================================

completeLectureBtn.addEventListener("click", function () {
  if (!completedLectures.includes(currentLectureIndex)) {
    completedLectures.push(currentLectureIndex);

    localStorage.setItem(
      progressKey + "_lectures",
      JSON.stringify(completedLectures),
    );
  }
updateProgress();

// =========================================
// CREATE CERTIFICATE WHEN COURSE COMPLETES
// =========================================

if (
    completedLectures.length ===
    course.lectures.length
) {

    createCertificate();

}

loadLecture();
});

// =========================================
// PREVIOUS LECTURE
// =========================================

previousLecture.addEventListener("click", function () {
  if (currentLectureIndex > 0) {
    currentLectureIndex--;

    loadLecture();
  }
});

// =========================================
// NEXT LECTURE
// =========================================

nextLecture.addEventListener("click", function () {
  if (currentLectureIndex < course.lectures.length - 1) {
    currentLectureIndex++;

    loadLecture();
  }
});

// =========================================
// INITIALIZE
// =========================================

async function initializeCoursePlayer() {

    await loadProgressFromBackend();

    updateProgress();

    renderLectures();

    loadLecture();
}

initializeCoursePlayer();