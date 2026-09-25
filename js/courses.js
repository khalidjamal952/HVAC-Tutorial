// =========================
// COURSE DATA
// =========================

const coursesGrid = document.querySelector("#courseGrid");

const noCourses = document.getElementById("noCourses");

let allCourses = [];

const defaultCourses = [
  {
    id: "hvac-fundamentals",
    title: "HVAC Fundamentals",
    category: "ac",
    rating: 4.8,
    students: 125,
    lessons: 25,
    duration: "6 Hours",
    price: 499,
    originalPrice: 999,
    description:
      "Learn the basic concepts of HVAC systems, components and working principles.",
  },
  {
    id: "air-conditioning",
    title: "Air Conditioning Basics",
    category: "ac",
    rating: 4.7,
    students: 98,
    lessons: 20,
    duration: "5 Hours",
    price: 599,
    originalPrice: 1199,
    description:
      "Understand air conditioning systems, components, cooling cycles and basic operation.",
  },
  {
    id: "refrigeration",
    title: "Refrigeration Fundamentals",
    category: "refrigeration",
    rating: 4.9,
    students: 143,
    lessons: 30,
    duration: "8 Hours",
    price: 699,
    originalPrice: 1499,
    description:
      "Learn refrigeration cycles, components, refrigerants and system operation.",
  },
  {
    id: "hvac-electrical",
    title: "HVAC Electrical & Controls",
    category: "electrical",
    rating: 4.8,
    students: 87,
    lessons: 22,
    duration: "6 Hours",
    price: 799,
    originalPrice: 1599,
    description:
      "Learn HVAC electrical systems, wiring, controls and troubleshooting basics.",
  },
  {
    id: "installation-service",
    title: "HVAC Installation & Service",
    category: "service",
    rating: 4.9,
    students: 156,
    lessons: 35,
    duration: "10 Hours",
    price: 899,
    originalPrice: 1799,
    description:
      "Learn practical HVAC installation, maintenance and servicing techniques.",
  },
  {
    id: "troubleshooting",
    title: "HVAC Troubleshooting",
    category: "service",
    rating: 4.8,
    students: 112,
    lessons: 28,
    duration: "7 Hours",
    price: 749,
    originalPrice: 1499,
    description:
      "Learn how to identify HVAC problems and perform systematic troubleshooting.",
  },
];

// =========================
// LOAD ADMIN COURSES
// =========================

function loadCourses() {
  const savedCourses = JSON.parse(localStorage.getItem("hvacAdminCourses"));

  if (savedCourses && savedCourses.length > 0) {
    allCourses = savedCourses;
  } else {
    allCourses = defaultCourses;
  }

  renderCourses();
}

// =========================
// RENDER COURSES
// =========================

// =========================
// RENDER COURSES
// =========================

function renderCourses() {
  if (!coursesGrid) {
    return;
  }

  coursesGrid.innerHTML = "";

  allCourses.forEach(function (course) {
    let courseIcon = "❄️";

    if (course.category === "refrigeration") {
      courseIcon = "🧊";
    } else if (course.category === "electrical") {
      courseIcon = "⚡";
    } else if (course.category === "service") {
      courseIcon = "🛠️";
    }

    let categoryName = "Air Conditioning";

    if (course.category === "refrigeration") {
      categoryName = "Refrigeration";
    } else if (course.category === "electrical") {
      categoryName = "Electrical";
    } else if (course.category === "service") {
      categoryName = "Installation & Service";
    }

    const card = document.createElement("article");

    card.className = "course-card";
    card.dataset.category = course.category;

    card.innerHTML = `
            <div class="course-image">

                <div class="course-image-icon">
                    ${courseIcon}
                </div>

                <span class="course-category">
                    ${categoryName}
                </span>

            </div>

            <div class="course-content">

                <h2>${course.title}</h2>

                <p>
                    ${course.description}
                </p>

                <div class="course-meta">

                    <span>
                        ⭐ ${course.rating || 4.8}
                    </span>

                    <span>
                        👨‍🎓 ${course.students || 0} Students
                    </span>

                </div>

                <div class="course-meta">

                    <span>
                        📚 ${course.lessons || 0} Lessons
                    </span>

                    <span>
                        ⏱️ ${course.duration || "N/A"}
                    </span>

                </div>

                <div class="course-price">

    <div>
        <strong>
            ₹${course.price}
        </strong>

        <del>
            ₹${course.originalPrice || ""}
        </del>
    </div>

    <a
        href="course-details.html?id=${course.id}"
        class="course-btn"
    >
        View Course
    </a>

</div>
            </div>
        `;

    coursesGrid.appendChild(card);
  });

  setupCourseFilters();
}

// =========================
// SEARCH & FILTER
// =========================

const searchInput = document.getElementById("courseSearch");

const searchBtn = document.getElementById("searchBtn");

const filterButtons = document.querySelectorAll(".filter-btn");

let currentCategory = "all";

function filterCourses() {
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const courseCards = document.querySelectorAll(".course-card");

  let visibleCourses = 0;

  courseCards.forEach(function (card) {
    const title = card.querySelector("h2").textContent.toLowerCase();

    const description = card.querySelector("p").textContent.toLowerCase();

    const category = card.dataset.category;

    const matchesSearch =
      title.includes(searchText) || description.includes(searchText);

    const matchesCategory =
      currentCategory === "all" || category === currentCategory;

    if (matchesSearch && matchesCategory) {
      card.style.display = "flex";
      visibleCourses++;
    } else {
      card.style.display = "none";
    }
  });

  if (noCourses) {
    noCourses.style.display = visibleCourses === 0 ? "block" : "none";
  }
}

// =========================
// FILTER EVENTS
// =========================

function setupCourseFilters() {
  if (searchBtn) {
    searchBtn.onclick = function () {
      filterCourses();
    };
  }

  if (searchInput) {
    searchInput.oninput = function () {
      filterCourses();
    };
  }

  filterButtons.forEach(function (button) {
    button.onclick = function () {
      filterButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      currentCategory = button.dataset.category;

      filterCourses();
    };
  });

  filterCourses();
}

// =========================
// START
// =========================

loadCourses();
