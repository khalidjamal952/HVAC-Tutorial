// =========================================
// COURSE PLAYER
// =========================================

// =========================================
// CHECK LOGIN
// =========================================

const currentUser = JSON.parse(localStorage.getItem("hvacCurrentUser"));

// const token = localStorage.getItem("hvacToken");
if (!currentUser) {
  window.location.href = "login.html";
}
// =========================================
// GET COURSE ID
// =========================================

const urlParams = new URLSearchParams(window.location.search);

const courseId = urlParams.get("id") || "hvac-fundamentals";
const isPreviewUiTest =
  window.location.hostname === "localhost" &&
  urlParams.get("previewTest") === "1";

function canAccessAllLectures() {
  return Boolean(window.hasPurchasedCourse) && !isPreviewUiTest;
}

// =========================================
// CHECK COURSE PURCHASE ACCESS
// =========================================

async function checkCourseAccess() {
  try {
    window.hasPurchasedCourse = false;

    const response = await fetch("/api/orders/access/" + courseId, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    // A 403 means the student has not purchased the course.
    // Allow the player to load free preview lectures.
    if (response.status === 403 && data.access === false) {
      window.hasPurchasedCourse = false;
      console.log("Free preview access enabled.");
      return true;
    }

    if (!response.ok) {
      console.error("Course access verification failed:", data);
      return false;
    }

    window.hasPurchasedCourse = Boolean(data.access);

    return true;
  } catch (error) {
    console.error("Course Access Check Error:", error);
    return false;
  }
}

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
      // {
      //   lectureId: "LECTURE_ID_YAHAN",
      //   title: "Introduction to HVAC",
      //   duration: "10 min",
      //   video: "../assets/videos/hvac-introduction.mp4",
      //   description:
      //     "Introduction to HVAC systems and the basic concepts you need to understand.",
      // },

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
let course = courses[courseId] || null;

// =========================================
// LOAD COURSE FROM BACKEND
// =========================================

async function loadCourseFromBackend() {
  try {
    const response = await fetch("/api/courses");

    const data = await response.json();

    if (!response.ok || !Array.isArray(data.courses)) {
      alert("Unable to load course.");
      return false;
    }

    const backendCourse = data.courses.find(function (item) {
      return item.id === courseId;
    });

    if (!backendCourse) {
      alert("Course not found");
      window.location.href = "my-courses.html";
      return false;
    }

    // Use MongoDB course data
    course = backendCourse;
    renderCourseOverview(course);

    // Lectures will be loaded separately
    course.lectures = [];

    return true;
  } catch (error) {
    console.error("Course Backend Error:", error);

    alert("Unable to load course.");
    return false;
  }
}
// =========================================
// GET HTML ELEMENTS
// =========================================

const courseTitle = document.getElementById("courseTitle");

const courseCategory = document.getElementById("courseCategory");

const courseDescription = document.getElementById("courseDescription");

const coursePurchaseBox = document.getElementById("coursePurchaseBox");

const coursePurchasePrice = document.getElementById("coursePurchasePrice");

const buyCourseBtn = document.getElementById("buyCourseBtn");

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

// COURSE OVERVIEW RENDERER

const learningOutcomesList = document.getElementById("learningOutcomesList");
const courseRequirementsList = document.getElementById("courseRequirementsList");
const courseAudienceList = document.getElementById("courseAudienceList");

function renderCourseOverview(courseData) {
  let activeList = null;
  let activeButton = null;

  const sections = [
    {
      element: learningOutcomesList,
      value: courseData?.outcomes,
      emptyMessage: "Learning outcomes will be updated soon."
    },
    {
      element: courseRequirementsList,
      value: courseData?.requirements,
      emptyMessage: "No specific requirements listed."
    },
    {
      element: courseAudienceList,
      value: courseData?.audience,
      emptyMessage: "Target audience information will be updated soon."
    }
  ];

  sections.forEach(({ element, value, emptyMessage }) => {
    if (!element) return;

    element.replaceChildren();

    const points = String(value || "")
      .split(/\r?\n/)
      .map(point => point.trim())
      .filter(Boolean);

    if (points.length === 0) {
      element.textContent = emptyMessage;
      return;
    }

    points.forEach(point => {
      const item = document.createElement("div");
      item.className = "course-overview-item";
      item.textContent = point;
      element.appendChild(item);
    });

    if (points.length > 3) {
      element.classList.add("is-collapsed");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "course-overview-toggle";
      button.textContent = "Read More";
      button.setAttribute("aria-expanded", "false");

      button.addEventListener("click", function () {
        if (activeList === element) {
          element.classList.add("is-collapsed");
          button.textContent = "Read More";
          button.setAttribute("aria-expanded", "false");
          activeList = null;
          activeButton = null;
          return;
        }

        if (activeList && activeButton) {
          activeList.classList.add("is-collapsed");
          activeButton.textContent = "Read More";
          activeButton.setAttribute("aria-expanded", "false");
        }

        element.classList.remove("is-collapsed");
        button.textContent = "Read Less";
        button.setAttribute("aria-expanded", "true");

        activeList = element;
        activeButton = button;
      });

      element.insertAdjacentElement("afterend", button);
    }
  });
}
function setupCoursePurchaseButton() {
  if (!coursePurchaseBox || !coursePurchasePrice || !buyCourseBtn) return;

  // Purchased students do not need the purchase button.
  if (canAccessAllLectures()) {
    coursePurchaseBox.hidden = true;
    return;
  }

  const price = Number(course.price);

  if (!course.id || !course.title || !Number.isFinite(price) || price <= 0) {
    coursePurchaseBox.hidden = true;
    console.warn("Course purchase details are unavailable.");
    return;
  }

  coursePurchasePrice.textContent =
    "Full Course Price: " +
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  coursePurchaseBox.hidden = false;

  buyCourseBtn.onclick = function () {
    try {
      const cart = JSON.parse(localStorage.getItem("hvacCart") || "[]");

      if (!Array.isArray(cart)) {
        throw new Error("Invalid cart data");
      }

      const alreadyAdded = cart.some(function (item) {
        return item.id === course.id;
      });

      if (!alreadyAdded) {
        cart.push({
          id: course.id,
          title: course.title,
          price: price,
        });

        localStorage.setItem("hvacCart", JSON.stringify(cart));
      }

      window.location.href = "checkout.html";
    } catch (error) {
      console.error("Course Cart Error:", error);
      alert("Unable to add this course to your cart. Please try again.");
    }
  };
}

// =========================================
// COURSE INFORMATION
// =========================================

if (course) {
  courseTitle.textContent = course.title || "";

  courseCategory.textContent = course.category || "";

  courseDescription.textContent = course.description || "";

  lectureCount.textContent = Array.isArray(course.lectures)
    ? course.lectures.length
    : 0;
} else {
  courseTitle.textContent = "Loading course...";

  courseCategory.textContent = "";

  courseDescription.textContent = "Loading course information...";

  lectureCount.textContent = "0";
}

// =========================================
// CURRENT LECTURE
// =========================================

let currentLectureIndex = 0;
let currentVideoObjectUrl = null;
// =========================================
// PROGRESS STORAGE KEY
// =========================================

const progressKey = "hvacProgress_" + currentUser.id + "_" + courseId;

// =========================================
// SAVE PROGRESS TO BACKEND
// =========================================

async function saveProgressToBackend() {
  // const token = localStorage.getItem("hvacToken");

  // if (!token) {
  //   console.log("No authentication token found.");
  //   return;
  // }

  try {
    const response = await fetch("/api/progress", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",

      body: JSON.stringify({
        courseId: courseId,
        completedLectures: completedLectures,
        progress: Math.round(
          (completedLectures.length / course.lectures.length) * 100,
        ),
        currentLecture: currentLectureIndex,
        videoPositions: videoPositions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Progress Save Failed:", data);
      return;
    }

    console.log("Progress saved to MongoDB:", data);
  } catch (error) {
    console.error("Progress Backend Error:", error);
  }
}

// =========================================
// CREATE CERTIFICATE
// =========================================

async function createCertificate() {
  // const token = localStorage.getItem("hvacToken");

  // if (!token) {
  //   console.log("No authentication token found.");
  //   return;
  // }

  try {
    const response = await fetch("/api/certificates", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",

      body: JSON.stringify({
        courseId: courseId,
        courseName: course.title,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Certificate Save Failed:", data);
      return;
    }

    console.log("Certificate saved to MongoDB:", data);
  } catch (error) {
    console.error("Certificate Backend Error:", error);
  }
}
// =========================================
// COMPLETED LECTURES
// =========================================

let completedLectures = [];
let videoPositions = {};
// =========================================
// LOAD PROGRESS FROM BACKEND
// =========================================

async function loadProgressFromBackend() {
  // const token = localStorage.getItem("hvacToken");

  // if (!token) {
  //   return;
  // }

  try {
    const response = await fetch("/api/progress/" + courseId, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Progress Load Failed:", data);

      return;
    }
    if (data.progress) {
      completedLectures = data.progress.completedLectures || [];

      currentLectureIndex = data.progress.currentLecture || 0;
      videoPositions = data.progress.videoPositions || {};

      console.log("Progress loaded from MongoDB:", data.progress);
    }
  } catch (error) {
    console.error("Progress Load Error:", error);
  }
}

// =========================================
// LOAD PROGRESS
// =========================================

function updateProgress() {
  const total = course.lectures.length;

  const completed = completedLectures.length;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  courseProgress.textContent = percentage + "%";
}

// =========================================
// LOAD LECTURES FROM BACKEND
// =========================================

async function loadLecturesFromBackend() {
  try {
    // =========================================
    // MAKE SURE COURSE IS LOADED
    // =========================================

    if (!course) {
      const courseLoaded = await loadCourseFromBackend();

      if (!courseLoaded || !course) {
        console.error("Course is still not loaded.");
        return false;
      }
    }

    // const token = localStorage.getItem("hvacToken");

    // if (!token) {
    //   console.log("No authentication token found.");
    //   return false;
    // }

    // =========================================
    // FETCH COURSE LECTURES
    // =========================================

    const response = await fetch("/api/lectures/course/" + courseId + "/preview", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lecture Load Failed:", data);
      return false;
    }

    // =========================================
    // SYNC LECTURES
    // =========================================

    const backendLectures = Array.isArray(data.lectures) ? data.lectures : [];

    course.lectures = backendLectures.map(function (lecture) {
      return {
        lectureId: lecture.lectureId,
        title: lecture.title || "Untitled Lecture",
        duration: lecture.duration || "",
        video: lecture.video || "",
        description: lecture.description || "",
        thumbnail: lecture.thumbnail || "",
        number: lecture.number,
        isPreview: lecture.isPreview === true,
      };
    });

    // =========================================
    // UPDATE COURSE UI
    // =========================================

    if (courseTitle) {
      courseTitle.textContent = course.title || "";
    }

    if (courseCategory) {
      courseCategory.textContent = course.category || "";
    }

    if (courseDescription) {
      courseDescription.textContent = course.description || "";
    }

    if (lectureCount) {
      lectureCount.textContent = course.lectures.length;
    }

    // =========================================
    // VALIDATE CURRENT INDEX
    // =========================================

    if (
      course.lectures.length === 0 ||
      currentLectureIndex >= course.lectures.length
    ) {
      currentLectureIndex = 0;
    }

    // =========================================
    // REMOVE INVALID COMPLETED LECTURES
    // =========================================

    completedLectures = completedLectures.filter(function (index) {
      return index < course.lectures.length;
    });

    console.log("Lectures loaded from MongoDB:", course.lectures);

    return true;
  } catch (error) {
    console.error("Lecture Backend Error:", error);

    return false;
  }
}
// =========================================
// RENDER LECTURES
// =========================================

function renderLectures() {
  lectureList.innerHTML = "";

  course.lectures.forEach(function (lecture, index) {
    const lectureItem = document.createElement("button");
    const isLocked = !canAccessAllLectures() && !lecture.isPreview;

    lectureItem.type = "button";
    lectureItem.className = "lecture-item";

    if (index === currentLectureIndex) {
      lectureItem.classList.add("active");
    }

    if (completedLectures.includes(index)) {
      lectureItem.classList.add("completed");
    }

    if (isLocked) {
      lectureItem.classList.add("locked");
    }

    lectureItem.innerHTML = `
      ${
        lecture.thumbnail
          ? `
            <img
              src="${lecture.thumbnail}"
              alt="${lecture.title}"
              class="lecture-thumbnail"
            />
          `
          : `
            <div class="lecture-thumbnail lecture-thumbnail-placeholder">
              VIDEO
            </div>
          `
      }

      <div class="lecture-number">
        ${completedLectures.includes(index) ? "\u2713" : index + 1}
      </div>

      <div class="lecture-info">
        <strong>${lecture.title}</strong>
        <span>${lecture.duration || ""}</span>
        ${
          isLocked
            ? '<span class="lecture-access-label">LOCKED</span>'
            : lecture.isPreview && !canAccessAllLectures()
              ? '<span class="lecture-access-label preview">FREE PREVIEW</span>'
              : ""
        }
      </div>

      ${
        completedLectures.includes(index)
          ? '<span class="lecture-status">\u2713</span>'
          : isLocked
            ? '<span class="lecture-status">LOCKED</span>'
            : ""
      }
    `;

    lectureItem.addEventListener("click", function () {
      if (isLocked) {
        alert("This lecture is locked. Please purchase this course to continue.");
        return;
      }

      currentLectureIndex = index;
      loadLecture();
    });

    lectureList.appendChild(lectureItem);
  });
}

// =========================================
// LOAD LECTURE// =========================================
// LOAD LECTURE
// =========================================

async function loadLecture(
  qualityOverride = null,
  restoreTime = 0,
  resumePlaying = false,
) {
  const lecture = course.lectures[currentLectureIndex];

  // =========================================
  // NO LECTURE AVAILABLE
  // =========================================

  if (!lecture) {
    lectureTitle.textContent = "No lectures available";

    lectureDescription.textContent =
      "Lectures for this course have not been uploaded yet.";

    videoSource.src = "";

    lectureVideo.load();

    if (completeLectureBtn) {
      completeLectureBtn.disabled = true;
    }

    previousLecture.disabled = true;
    nextLecture.disabled = true;

    return;
  }

  // =========================================
  // LECTURE INFORMATION
  // =========================================

  lectureTitle.textContent = lecture.title;

  lectureDescription.textContent = lecture.description || "";
  const videoThumbnailOverlay = document.getElementById(
    "videoThumbnailOverlay",
  );

  const videoThumbnailImage = document.getElementById("videoThumbnailImage");

  if (lecture.thumbnail) {
    videoThumbnailImage.src = "" + lecture.thumbnail;

    videoThumbnailOverlay.style.display = "flex";
  } else {
    videoThumbnailImage.src = "";
    videoThumbnailOverlay.style.display = "none";
  }
  if (lecture.thumbnail) {
    lectureVideo.poster = "" + lecture.thumbnail;
  } else {
    lectureVideo.removeAttribute("poster");
  }
  videoThumbnailOverlay.onclick = function () {
    videoThumbnailOverlay.style.display = "none";
    lectureVideo.play();
  };

  // =========================================
  // VIDEO
  // =========================================

  if (lecture.lectureId) {
    // const token = localStorage.getItem("hvacToken");

    // Clear previous Blob URL to prevent memory leaks.
    if (currentVideoObjectUrl) {
      URL.revokeObjectURL(currentVideoObjectUrl);
      currentVideoObjectUrl = null;
    }

    videoSource.src = "";
    lectureVideo.load();

    const videoQuality = document.getElementById("videoQuality");

    const selectedQuality =
      qualityOverride || (videoQuality ? videoQuality.value : "720p");

    fetch(
      "/api/lectures/video/" +
        encodeURIComponent(lecture.lectureId) +
        "?quality=" +
        encodeURIComponent(selectedQuality),
      {
        method: "GET",
        credentials: "include",
      },
    )
      .then(async function (response) {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Video request failed: " + response.status,
          );
        }

        const contentType = response.headers.get("content-type") || "";

        // New R2 videos return a signed URL as JSON.
        if (contentType.includes("application/json")) {
          const data = await response.json();

          if (!data.url) {
            throw new Error("Signed video URL was not returned.");
          }

          videoSource.src = data.url;
          lectureVideo.load();
        } else {
          // Support older videos stored locally.
          const blob = await response.blob();

          currentVideoObjectUrl = URL.createObjectURL(blob);
          videoSource.src = currentVideoObjectUrl;
          lectureVideo.load();
        }
        lectureVideo.addEventListener(
          "loadedmetadata",
          function () {
            const savedTime =
              restoreTime > 0
                ? restoreTime
                : videoPositions[currentLectureIndex];

            if (
              savedTime !== undefined &&
              savedTime >= 0 &&
              savedTime < lectureVideo.duration
            ) {
              lectureVideo.currentTime = savedTime;
            }

            if (resumePlaying) {
              lectureVideo.play().catch(function (error) {
                console.warn("Video autoplay blocked:", error);
              });
            }
          },
          { once: true },
        );
      })
      .catch(function (error) {
        console.error("Video Load Error:", error);
        alert("Video load nahi hui. Please dobara try karein.");
      });
  } else {
    videoSource.src = "";
    lectureVideo.load();
  }

  // =========================================
  // COMPLETION BUTTON
  // =========================================

  if (completedLectures.includes(currentLectureIndex)) {
    completeLectureBtn.textContent = "\u2713 Completed";

    completeLectureBtn.classList.add("completed");

    completeLectureBtn.disabled = false;
  } else {
    completeLectureBtn.textContent = "\u2713 Mark as Completed";

    completeLectureBtn.classList.remove("completed");

    completeLectureBtn.disabled = false;
  }

  // =========================================
  // NAVIGATION
  // =========================================

  previousLecture.disabled = currentLectureIndex === 0;

  nextLecture.disabled = currentLectureIndex === course.lectures.length - 1;

  // =========================================
  // REFRESH LECTURE LIST
  // =========================================

  renderLectures();
}

// =========================================
// SAVE VIDEO POSITION
// =========================================

lectureVideo.addEventListener("timeupdate", function () {
  if (lectureVideo.duration && !lectureVideo.ended) {
    videoPositions[currentLectureIndex] = lectureVideo.currentTime;
  }
});
lectureVideo.addEventListener("pause", function () {
  if (lectureVideo.duration && !lectureVideo.ended) {
    videoPositions[currentLectureIndex] = lectureVideo.currentTime;

    saveProgressToBackend();
  }
});

lectureVideo.addEventListener("ended", async function () {
  const finishedIndex = currentLectureIndex;

  if (!completedLectures.includes(finishedIndex)) {
    completedLectures.push(finishedIndex);
  }

  updateProgress();
  renderLectures();

  await saveProgressToBackend();

  if (completedLectures.length === course.lectures.length) {
    await createCertificate();
  }

  if (finishedIndex < course.lectures.length - 1) {
    const nextIndex = finishedIndex + 1;
    const nextLecture = course.lectures[nextIndex];

    const nextLectureLocked =
      !canAccessAllLectures() && !nextLecture.isPreview;

    if (nextLectureLocked) {
      currentLectureIndex = finishedIndex;
      lectureVideo.pause();
      lectureVideo.removeAttribute("src");
      lectureVideo.load();
      lectureTitle.textContent = "Course Preview Completed";
      renderLectures();
      alert("You have completed the free preview. Purchase this course to unlock all remaining lectures.");
      return;
    }

    currentLectureIndex = nextIndex;
    loadLecture();

    lectureVideo.addEventListener(
      "canplay",
      function () {
        lectureVideo.play().catch(function (error) {
          console.warn("Autoplay blocked:", error);
        });
      },
      { once: true },
    );
  }
});

// =========================================
// MARK LECTURE COMPLETED
// =========================================

completeLectureBtn.addEventListener("click", async function () {
  if (!completedLectures.includes(currentLectureIndex)) {
    completedLectures.push(currentLectureIndex);

    localStorage.setItem(
      progressKey + "_lectures",
      JSON.stringify(completedLectures),
    );
  }

  // Save progress FIRST
  await saveProgressToBackend();

  // Create certificate ONLY AFTER progress is saved
  if (completedLectures.length === course.lectures.length) {
    await createCertificate();
  }

  updateProgress();

  loadLecture();
});
// =========================================
// PREVIOUS LECTURE
// =========================================

previousLecture.addEventListener("click", function () {
  if (currentLectureIndex > 0) {
    currentLectureIndex--;
    saveProgressToBackend();
    loadLecture();
  }
});

// =========================================
// NEXT LECTURE
// =========================================

nextLecture.addEventListener("click", function () {
  if (currentLectureIndex < course.lectures.length - 1) {
    const nextIndex = currentLectureIndex + 1;
    const nextLectureItem = course.lectures[nextIndex];

    const isLocked =
      !canAccessAllLectures() && !nextLectureItem.isPreview;

    if (isLocked) {
      alert("You have completed the free preview. Please purchase this course to unlock the remaining lectures.");
      return;
    }

    currentLectureIndex = nextIndex;
    saveProgressToBackend();
    loadLecture();
  }
});

// =========================================
// INITIALIZE
// =========================================

async function initializeCoursePlayer() {
  const courseLoaded = await loadCourseFromBackend();

  if (!courseLoaded) {
    return;
  }

  const hasAccess = await checkCourseAccess();

  setupCoursePurchaseButton();

  if (!hasAccess) {
    return;
  }

  await loadProgressFromBackend();
  await loadLecturesFromBackend();

  updateProgress();
  renderLectures();
  loadLecture();
}
initializeCoursePlayer();

// =========================================
// LOGOUT
// =========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      localStorage.removeItem("hvacToken");
      localStorage.removeItem("hvacCurrentUser");

      window.location.replace("login.html");
    }
  });
}

// =========================================
// PREVENT BACK-BUTTON ACCESS AFTER LOGOUT
// =========================================

window.addEventListener("pageshow", async function () {
  try {
    const response = await fetch("/api/user/profile", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      localStorage.removeItem("hvacCurrentUser");
      localStorage.removeItem("hvacToken");

      window.location.replace("login.html");
    }
  } catch (error) {
    console.error("Authentication Check Error:", error);
    window.location.replace("login.html");
  }
});

const videoQualitySelect = document.getElementById("videoQuality");

if (videoQualitySelect) {
  videoQualitySelect.addEventListener("change", function () {
    const currentTime = lectureVideo.currentTime;
    const wasPlaying = !lectureVideo.paused;
    const selectedQuality = videoQualitySelect.value;

    loadLecture(selectedQuality, currentTime, wasPlaying);
  });
}

// =========================================
// COURSE PLAYER RATING SYSTEM
// =========================================

(function initializeCoursePlayerRatings() {
  const ratingSection = document.getElementById("courseRatingSection");
  if (!ratingSection) return;

  let selectedRating = 0;

  const ratingStars = ratingSection.querySelectorAll(".rating-star");
  const selectedRatingText = document.getElementById("selectedRatingText");
  const ratingReview = document.getElementById("ratingReview");
  const submitRatingBtn = document.getElementById("submitRatingBtn");
  const averageRating = document.getElementById("averageRating");
  const averageRatingStars = document.getElementById("averageRatingStars");
  const totalRatings = document.getElementById("totalRatings");
  const courseReviewsList = document.getElementById("courseReviewsList");

  // SELECT STAR RATING
  ratingStars.forEach(function (star) {
    star.addEventListener("click", function () {
      selectedRating = Number(star.dataset.rating);

      ratingStars.forEach(function (item) {
        const active = Number(item.dataset.rating) <= selectedRating;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      selectedRatingText.textContent =
        selectedRating + " out of 5 stars selected";
    });
  });

  // LOAD COURSE RATINGS AND REVIEWS
  async function loadCourseRatings() {
    try {
      const response = await fetch(
        "/api/ratings/" + encodeURIComponent(courseId),
        { method: "GET" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load course ratings.");
      }

      const average = Number(data.averageRating || 0);
      const count = Number(data.totalRatings || 0);

      averageRating.textContent = average.toFixed(1);
      totalRatings.textContent = count;

      const roundedRating = Math.max(0, Math.min(5, Math.round(average)));

      averageRatingStars.textContent =
        "\u2605".repeat(roundedRating) +
        "\u2606".repeat(5 - roundedRating);

      courseReviewsList.replaceChildren();

      if (!Array.isArray(data.ratings) || data.ratings.length === 0) {
        courseReviewsList.textContent = "No reviews yet.";
        return;
      }

      data.ratings.forEach(function (item) {
        const reviewItem = document.createElement("div");
        reviewItem.className = "course-review-item";

        const reviewHeader = document.createElement("div");
        reviewHeader.className = "course-review-header";

        const name = document.createElement("strong");
        name.className = "course-review-name";
        name.textContent =
          (item.user && item.user.name) || "Student";

        const stars = document.createElement("span");
        stars.className = "course-review-stars";

        const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));

        stars.textContent =
          "\u2605".repeat(rating) +
          "\u2606".repeat(5 - rating);

        reviewHeader.appendChild(name);
        reviewHeader.appendChild(stars);
        reviewItem.appendChild(reviewHeader);

        if (item.review && item.review.trim()) {
          const reviewText = document.createElement("p");
          reviewText.className = "course-review-text";
          reviewText.textContent = item.review;
          reviewItem.appendChild(reviewText);
        }

        courseReviewsList.appendChild(reviewItem);
      });

    } catch (error) {
      console.error("Course Rating Load Error:", error);
      courseReviewsList.textContent = "Unable to load student reviews.";
    }
  }

  // SUBMIT OR UPDATE COURSE RATING
  submitRatingBtn.addEventListener("click", async function () {
    if (!courseId) {
      alert("Course not found.");
      return;
    }

    if (selectedRating === 0) {
      alert("Please select a rating first.");
      return;
    }

    const review = ratingReview.value.trim();

    try {
      submitRatingBtn.disabled = true;
      submitRatingBtn.textContent = "Submitting...";

      const response = await fetch(
        "/api/ratings/" + encodeURIComponent(courseId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            rating: selectedRating,
            review: review
          })
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("hvacToken");
        localStorage.removeItem("hvacCurrentUser");
        localStorage.removeItem("hvacRememberMe");

        alert("Your session has expired. Please login again.");
        window.location.href = "login.html";
        return;
      }

      if (response.status === 403) {
        alert(data.message || "You can rate only courses you have purchased.");
        return;
      }

      if (!response.ok) {
        alert(data.message || "Unable to submit rating.");
        return;
      }

      alert("Your rating has been submitted successfully.");

      selectedRating = 0;

      ratingStars.forEach(function (star) {
        star.classList.remove("active");
        star.setAttribute("aria-pressed", "false");
      });

      selectedRatingText.textContent = "Select a rating";
      ratingReview.value = "";

      await loadCourseRatings();

    } catch (error) {
      console.error("Submit Rating Error:", error);
      alert("Unable to submit rating. Please try again.");

    } finally {
      submitRatingBtn.disabled = false;
      submitRatingBtn.textContent = "Submit Rating";
    }
  });

  loadCourseRatings();
})();