// =========================
// COURSE DATA
// =========================

const coursesGrid = document.querySelector("#courseGrid");

const noCourses = document.getElementById("noCourses");

let allCourses = [];

// =========================
// LOAD ADMIN COURSES
// =========================
async function loadCourses() {
  try {
    const response = await fetch(
      "https://hvac-tutorial.onrender.com/api/courses",
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Courses Fetch Error:", data.message);

      allCourses = [];
      renderCourses();
      return;
    }

    if (Array.isArray(data.courses)) {
      allCourses = await Promise.all(
        data.courses.map(async function (course) {
          try {
            const ratingResponse = await fetch(
              `https://hvac-tutorial.onrender.com/api/ratings/${course.id}`,
            );

            if (!ratingResponse.ok) {
              return {
                ...course,
                rating: 0,
              };
            }

            const ratingData = await ratingResponse.json();

            return {
              ...course,
              rating: Number(ratingData.averageRating || 0),
            };
          } catch (error) {
            console.error(`Rating Error for ${course.id}:`, error);

            return {
              ...course,
              rating: 0,
            };
          }
        }),
      );
    } else {
      allCourses = [];
    }
    // LOAD COUPONS
    try {
      const token = localStorage.getItem("hvacToken");

      if (!token) {
        allCourses = allCourses.map(function (course) {
          return {
            ...course,
            coupon: null,
          };
        });

        renderCourses();
        return;
      }

      allCourses = await Promise.all(
        allCourses.map(async function (course) {
          try {
            const couponResponse = await fetch(
              `https://hvac-tutorial.onrender.com/api/coupons/available/${course.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!couponResponse.ok) {
              return {
                ...course,
                coupon: null,
              };
            }

            const couponData = await couponResponse.json();

            const coupon =
              Array.isArray(couponData.coupons) && couponData.coupons.length > 0
                ? couponData.coupons[0]
                : null;

            return {
              ...course,
              coupon: coupon,
            };
          } catch (error) {
            console.error(`Coupon Error for ${course.id}:`, error);

            return {
              ...course,
              coupon: null,
            };
          }
        }),
      );
    } catch (couponError) {
      console.error("Coupon Fetch Error:", couponError);
    }
    renderCourses();
  } catch (error) {
    console.error("Courses Backend Error:", error);

    allCourses = [];
    renderCourses();
  }
}

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
                         ${
                           course.coupon
                             ? `
    <div class="course-coupon">
        🎟️ Coupon Available
        <strong>${course.coupon.code}</strong>
        <span>
    Save ${
      course.coupon.discountType === "percentage"
        ? course.coupon.discountValue + "%"
        : "₹" + course.coupon.discountValue
    }
</span>
    </div>
`
                             : ""
                         }
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

createDynamicFilters();
  setupCourseFilters();
}

// =========================
// SEARCH & FILTER
// =========================

const searchInput = document.getElementById("courseSearch");

const searchBtn = document.getElementById("searchBtn");
function createDynamicFilters() {
  const filterContainer = document.querySelector(".course-filter");

  if (!filterContainer) {
    return;
  }

  filterContainer.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "filter-btn active";
  allButton.dataset.category = "all";
  allButton.textContent = "All Courses";

  filterContainer.appendChild(allButton);

  const categories = [];

  allCourses.forEach(function (course) {
    if (course.category && !categories.includes(course.category)) {
      categories.push(course.category);
    }
  });

  categories.forEach(function (category) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "filter-btn";
    button.dataset.category = category;

    button.textContent = category
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });

    filterContainer.appendChild(button);
  });
}
const filterButtons = document.querySelectorAll(".filter-btn");

let currentCategory = "all";

const urlParams = new URLSearchParams(window.location.search);
const urlCategory = urlParams.get("category");

if (
  urlCategory === "ac" ||
  urlCategory === "refrigeration" ||
  urlCategory === "electrical" ||
  urlCategory === "service"
) {
  currentCategory = urlCategory;
}

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

  filterButtons.forEach(function (button) {
    if (button.dataset.category === currentCategory) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
  filterCourses();
}

// =========================
// START
// =========================

loadCourses();
