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
    const response = await fetch("/api/courses");

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
            const ratingResponse = await fetch(`/api/ratings/${course.id}`);

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
      } else {
        const coursesWithCoupons = [];

        for (const course of allCourses) {
          try {
            const couponResponse = await fetch(
              `/api/coupons/available/${course.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!couponResponse.ok) {
              console.warn(
                `Coupon request failed for ${course.id}:`,
                couponResponse.status,
              );

              coursesWithCoupons.push({
                ...course,
                coupon: null,
              });

              continue;
            }

            const couponData = await couponResponse.json();

            const coupon =
              Array.isArray(couponData.coupons) && couponData.coupons.length > 0
                ? couponData.coupons[0]
                : null;

            coursesWithCoupons.push({
              ...course,
              coupon,
            });
          } catch (error) {
            console.error(`Coupon Error for ${course.id}:`, error);

            coursesWithCoupons.push({
              ...course,
              coupon: null,
            });
          }
        }

        allCourses = coursesWithCoupons;
      }
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

// NORMALIZE COURSE CATEGORIES
function normalizeCourseCategory(category) {
  const value = String(category || "").trim().toLowerCase().replace(/\s+/g, " ");

  if (value === "ac" || value.includes("hvac") || value.includes("air conditioning")) return "hvac";
  if (value.includes("vrf") || value.includes("vrv")) return "vrf-vrv";
  if (value.includes("refrigeration")) return "refrigeration";
  if (value.includes("electrical")) return "electrical";
  if (value.includes("service")) return "service";

  return value;
}

function getCourseCategoryLabel(category) {
  const key = normalizeCourseCategory(category);

  if (key === "hvac") return "HVAC Design";
  if (key === "vrf-vrv") return "VRF/VRV Design";
  if (key === "refrigeration") return "Refrigeration";
  if (key === "electrical") return "Electrical";
  if (key === "service") return "Installation & Service";

  return String(category || "Other")
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
function renderCourses() {
  if (!coursesGrid) {
    return;
  }

  coursesGrid.innerHTML = "";

  allCourses.forEach(function (course) {
    const categoryKey = normalizeCourseCategory(course.category);
    let courseIcon = "&#10052;";

    if (categoryKey === "refrigeration") {
      courseIcon = "&#10052;";
    } else if (categoryKey === "electrical") {
      courseIcon = "&#9889;";
    } else if (categoryKey === "service") {
      courseIcon = "&#128295;";
    }

    const categoryName = getCourseCategoryLabel(course.category);

    const card = document.createElement("article");

    card.className = "course-card";
    card.dataset.category = course.category;

    card.innerHTML = `
         <div class="course-image">

    ${
      course.thumbnail
        ? `<img
             src="${course.thumbnail}"
             alt="${course.title}"
             class="course-thumbnail"
             onerror="this.style.display='none'"
           >`
        : `<div class="course-image-icon">${courseIcon}</div>`
    }

    <span class="course-category">
        ${categoryName}
    </span>

</div>

            <div class="course-content">

                <h2>${course.title}</h2>

                <div class="course-description-wrapper">
    <p class="course-description">${course.description || ""}</p>
    ${(course.description || "").length > 120 ? '<button type="button" class="course-read-more-btn" aria-expanded="false">Read More</button>' : ""}
</div>

                <div class="course-meta">

                    <span>
                        &#9733; ${Number(course.rating ?? 0).toFixed(1)}
                    </span>

                    <span>
                        &#127891; ${course.students || 0} Students
                    </span>

                </div>

                <div class="course-meta">

                    <span>
                        &#128218; ${course.lessons || 0} Lessons
                    </span>

                    <span>
                        &#9201; ${course.duration || "N/A"}
                    </span>

                </div>
                         ${
                           course.coupon
                             ? `
    <div class="course-coupon">
        &#127991; Coupon Available
        <strong>${course.coupon.code}</strong>
        <span>
    Save ${
      course.coupon.discountType === "percentage"
        ? course.coupon.discountValue + "%"
        : "&#8377;" + course.coupon.discountValue
    }
</span>
    </div>
`
                             : ""
                         }
                <div class="course-price">

    <div>
        <strong>
            &#8377;${course.price}
        </strong>

        <del>
            &#8377;${course.originalPrice || ""}
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
    const readMoreButton = card.querySelector(".course-read-more-btn");

    if (readMoreButton) {
      readMoreButton.addEventListener("click", function () {
        const description = card.querySelector(".course-description");
        const shouldExpand = !description.classList.contains("expanded");

        document.querySelectorAll(".course-description.expanded").forEach(function (openDescription) {
          openDescription.classList.remove("expanded");

          const openButton = openDescription.parentElement.querySelector(".course-read-more-btn");

          if (openButton) {
            openButton.textContent = "Read More";
            openButton.setAttribute("aria-expanded", "false");
          }
        });

        if (shouldExpand) {
          description.classList.add("expanded");
          readMoreButton.textContent = "Read Less";
          readMoreButton.setAttribute("aria-expanded", "true");
        }
      });
    }
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
    if (
      course.category &&
      !categories.some(item =>
        normalizeCourseCategory(item) === normalizeCourseCategory(course.category)
      )
    ) {
      categories.push(course.category);
    }
  });

  categories.forEach(function (category) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "filter-btn";
    button.dataset.category = category;

    button.textContent = getCourseCategoryLabel(category);

    filterContainer.appendChild(button);
  });
}
// Filter buttons are queried dynamically after rendering.

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
      currentCategory === "all" ||
      normalizeCourseCategory(category) === normalizeCourseCategory(currentCategory);

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

  // Query the newly generated filter buttons every time.
  const filterContainer = document.querySelector(".course-filter");
  const filterButtons = filterContainer
    ? filterContainer.querySelectorAll(".filter-btn")
    : document.querySelectorAll(".filter-btn");

  filterButtons.forEach(function (button) {
    button.onclick = function () {
      currentCategory = button.dataset.category || "all";

      filterButtons.forEach(function (btn) {
        btn.classList.toggle("active", btn === button);
      });

      filterCourses();
    };

    const isActive =
      normalizeCourseCategory(button.dataset.category) ===
      normalizeCourseCategory(currentCategory);

    button.classList.toggle(
      "active",
      currentCategory === "all"
        ? button.dataset.category === "all"
        : isActive
    );
  });

  filterCourses();
}

// =========================
// START
// =========================

loadCourses();
