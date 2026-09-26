// =========================================
// ADMIN PAGE SECURITY
// =========================================
const adminPage =
  window.location.pathname.includes("admin.html") ||
  window.location.pathname.includes("admin-courses.html") ||
  window.location.pathname.includes("admin-lectures.html") ||
  window.location.pathname.includes("admin-students.html") ||
  window.location.pathname.includes("admin-orders.html") ||
  window.location.pathname.includes("admin-live-classes.html") ||
  window.location.pathname.includes("admin-certificates.html");

if (adminPage && localStorage.getItem("hvacAdminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}
// =========================================
// ADMIN LOGIN
// =========================================


const adminLoginForm =
  document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const email = document
        .getElementById("adminEmail")
        .value
        .trim()
        .toLowerCase();

      const password =
        document.getElementById("adminPassword").value;

      if (!email || !password) {
        alert("Please enter admin email and password.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/admin-login",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              email: email,
              password: password,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Invalid admin email or password."
          );
          return;
        }

        // Save admin JWT token
        localStorage.setItem(
          "hvacAdminToken",
          data.token
        );

        // Keep existing admin login flag
        localStorage.setItem(
          "hvacAdminLoggedIn",
          "true"
        );

        alert("Admin login successful!");

        window.location.href = "admin.html";
      } catch (error) {
        console.error(
          "Admin Login Error:",
          error
        );

        alert(
          "Unable to connect to server. Please try again."
        );
      }
    }
  );
}
// =========================================
// ADMIN SETUP
// =========================================

const adminSetupForm = document.getElementById("adminSetupForm");

if (adminSetupForm) {
  adminSetupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("setupAdminName").value.trim();

    const email = document
      .getElementById("setupAdminEmail")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("setupAdminPassword").value;

    const confirmPassword = document.getElementById(
      "setupAdminConfirmPassword",
    ).value;

    // =================================
    // VALIDATION
    // =================================

    if (!name || !email || !password) {
      alert("Please fill all required fields.");

      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");

      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");

      return;
    }

    // =================================
    // CREATE ADMIN OBJECT
    // =================================

    const admin = {
      id: "ADMIN" + Date.now(),

      name: name,

      email: email,

      password: password,

      createdAt: new Date().toISOString(),
    };

    // =================================
    // SAVE ADMIN
    // =================================

    localStorage.setItem("hvacAdmin", JSON.stringify(admin));

    alert("Admin account created successfully!");

    // =================================
    // GO TO ADMIN LOGIN
    // =================================

    window.location.href = "admin-login.html";
  });
}

// =========================================
// STUDENT MANAGEMENT
// =========================================

const studentsTableBody = document.getElementById("studentsTableBody");

const studentsEmpty = document.getElementById("studentsEmpty");

const studentTotal = document.getElementById("studentTotal");

const studentSearch = document.getElementById("studentSearch");

if (studentsTableBody) {
  let students = JSON.parse(localStorage.getItem("hvacUsers")) || [];

  // =====================================
  // DISPLAY STUDENTS
  // =====================================

  function displayStudents(studentList) {
    studentsTableBody.innerHTML = "";

    if (studentList.length === 0) {
      studentsEmpty.style.display = "block";

      return;
    }

    studentsEmpty.style.display = "none";

    studentList.forEach(function (student) {
      const row = document.createElement("tr");

      const registeredDate = student.registeredAt
        ? new Date(student.registeredAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "--";

      row.innerHTML = `

                <td class="student-name-cell">
                    ${student.name || "--"}
                </td>

                <td class="student-email-cell">
                    ${student.email || "--"}
                </td>

                <td>
                    ${student.phone || "--"}
                </td>

                <td>
                    ${registeredDate}
                </td>

                <td>

                    <button
                        type="button"
                        class="student-action-btn"
                        data-student-id="${student.id}"
                    >
                        Delete
                    </button>

                </td>

            `;

      studentsTableBody.appendChild(row);
    });

    // =================================
    // DELETE STUDENT
    // =================================

    const deleteButtons = studentsTableBody.querySelectorAll(
      ".student-action-btn",
    );

    deleteButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const studentId = button.dataset.studentId;

        const confirmDelete = confirm(
          "Are you sure you want to delete this student?",
        );

        if (!confirmDelete) {
          return;
        }

        students = students.filter(function (student) {
          return student.id !== studentId;
        });

        localStorage.setItem("hvacUsers", JSON.stringify(students));

        updateStudentCount();

        displayStudents(students);
      });
    });
  }

  // =====================================
  // UPDATE TOTAL STUDENTS
  // =====================================

  function updateStudentCount() {
    if (studentTotal) {
      studentTotal.textContent = "Total Students: " + students.length;
    }
  }

  // =====================================
  // SEARCH STUDENTS
  // =====================================

  if (studentSearch) {
    studentSearch.addEventListener("input", function () {
      const searchText = studentSearch.value.toLowerCase().trim();

      const filteredStudents = students.filter(function (student) {
        const name = (student.name || "").toLowerCase();

        const email = (student.email || "").toLowerCase();

        return name.includes(searchText) || email.includes(searchText);
      });

      displayStudents(filteredStudents);
    });
  }

  // =====================================
  // INITIAL LOAD
  // =====================================

  updateStudentCount();

  displayStudents(students);
}

// =========================================
// ADMIN COURSE MANAGEMENT
// =========================================

const adminCoursesTableBody = document.getElementById("adminCoursesTableBody");

const adminCoursesEmpty = document.getElementById("adminCoursesEmpty");

const adminCourseTotal = document.getElementById("adminCourseTotal");

const adminCourseSearch = document.getElementById("adminCourseSearch");

const addCourseBtn = document.getElementById("addCourseBtn");

const courseModal = document.getElementById("courseModal");

const closeCourseModal = document.getElementById("closeCourseModal");

const cancelCourseBtn = document.getElementById("cancelCourseBtn");

const courseForm = document.getElementById("courseForm");

const courseModalTitle = document.getElementById("courseModalTitle");

if (adminCoursesTableBody) {
  // =====================================
  // DEFAULT HVAC COURSES
  // =====================================

  const defaultCourses = [
    {
      id: "hvac-fundamentals",
      title: "HVAC Fundamentals",
      category: "ac",
      lessons: 25,
      duration: "6 hours",
      price: 499,
      originalPrice: 999,
      students: 125,
      description:
        "Learn the fundamentals of HVAC systems, components and basic working principles.",
    },

    {
      id: "air-conditioning",
      title: "Air Conditioning Basics",
      category: "ac",
      lessons: 20,
      duration: "5 hours",
      price: 599,
      originalPrice: 1199,
      students: 98,
      description:
        "Understand air conditioning systems, components, operation and basic maintenance.",
    },

    {
      id: "refrigeration",
      title: "Refrigeration Fundamentals",
      category: "refrigeration",
      lessons: 30,
      duration: "8 hours",
      price: 699,
      originalPrice: 1499,
      students: 143,
      description:
        "Learn refrigeration cycles, components, systems and practical fundamentals.",
    },

    {
      id: "hvac-electrical",
      title: "HVAC Electrical & Controls",
      category: "electrical",
      lessons: 22,
      duration: "6 hours",
      price: 799,
      originalPrice: 1599,
      students: 87,
      description:
        "Learn HVAC electrical systems, wiring, controls and troubleshooting basics.",
    },

    {
      id: "installation-service",
      title: "HVAC Installation & Service",
      category: "service",
      lessons: 35,
      duration: "10 hours",
      price: 899,
      originalPrice: 1799,
      students: 156,
      description:
        "Learn practical HVAC installation, servicing and maintenance procedures.",
    },

    {
      id: "troubleshooting",
      title: "HVAC Troubleshooting",
      category: "service",
      lessons: 28,
      duration: "7 hours",
      price: 749,
      originalPrice: 1499,
      students: 112,
      description:
        "Learn systematic HVAC troubleshooting and common fault diagnosis techniques.",
    },
  ];

  // =====================================
  // LOAD SAVED COURSES
  // =====================================

  let adminCourses = JSON.parse(localStorage.getItem("hvacAdminCourses"));

  if (!Array.isArray(adminCourses)) {
    adminCourses = defaultCourses;

    localStorage.setItem("hvacAdminCourses", JSON.stringify(adminCourses));
  }

  // =====================================
  // CATEGORY NAME
  // =====================================

  function getCategoryName(category) {
    const categories = {
      ac: "Air Conditioning",

      refrigeration: "Refrigeration",

      electrical: "Electrical",

      service: "Service",
    };

    return categories[category] || category;
  }

  // =====================================
  // DISPLAY COURSES
  // =====================================

  function displayAdminCourses(courseList) {
    adminCoursesTableBody.innerHTML = "";

    if (courseList.length === 0) {
      adminCoursesEmpty.style.display = "block";

      return;
    }

    adminCoursesEmpty.style.display = "none";

    courseList.forEach(function (course) {
      const row = document.createElement("tr");

      row.innerHTML = `

                <td class="course-title-cell">
                    ${course.title}
                </td>

                <td>
                    <span class="course-category-cell">
                        ${getCategoryName(course.category)}
                    </span>
                </td>

                <td>
                    ${course.lessons}
                </td>

                <td class="course-price-cell">
                    ₹${course.price}
                </td>

                <td class="course-student-cell">
                    ${course.students || 0}
                </td>

                <td>

                    <div class="course-action-group">

                        <button
                            type="button"
                            class="course-edit-btn"
                            data-course-id="${course.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="course-delete-btn"
                            data-course-id="${course.id}"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            `;

      adminCoursesTableBody.appendChild(row);
    });

    // =================================
    // EDIT BUTTONS
    // =================================

    const editButtons =
      adminCoursesTableBody.querySelectorAll(".course-edit-btn");

    editButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const courseId = button.dataset.courseId;

        openEditCourse(courseId);
      });
    });

    // =================================
    // DELETE BUTTONS
    // =================================

    const deleteButtons =
      adminCoursesTableBody.querySelectorAll(".course-delete-btn");

    deleteButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const courseId = button.dataset.courseId;

        const course = adminCourses.find(function (item) {
          return item.id === courseId;
        });

        if (!course) {
          return;
        }

        const confirmDelete = confirm(
          "Are you sure you want to delete " + course.title + "?",
        );

        if (!confirmDelete) {
          return;
        }

        adminCourses = adminCourses.filter(function (item) {
          return item.id !== courseId;
        });

        localStorage.setItem("hvacAdminCourses", JSON.stringify(adminCourses));

        updateCourseCount();

        displayAdminCourses(adminCourses);
      });
    });
  }

  // =====================================
  // COURSE COUNT
  // =====================================

  function updateCourseCount() {
    if (adminCourseTotal) {
      adminCourseTotal.textContent = "Total Courses: " + adminCourses.length;
    }
  }

  // =====================================
  // SEARCH COURSES
  // =====================================

  if (adminCourseSearch) {
    adminCourseSearch.addEventListener("input", function () {
      const searchText = adminCourseSearch.value.toLowerCase().trim();

      const filteredCourses = adminCourses.filter(function (course) {
        return (
          course.title.toLowerCase().includes(searchText) ||
          getCategoryName(course.category).toLowerCase().includes(searchText)
        );
      });

      displayAdminCourses(filteredCourses);
    });
  }

  // =====================================
  // OPEN ADD COURSE MODAL
  // =====================================

  function openAddCourse() {
    courseForm.reset();

    courseModalTitle.textContent = "Add New Course";

    courseForm.dataset.editingId = "";

    courseModal.classList.add("active");
  }

  // =====================================
  // OPEN EDIT COURSE
  // =====================================

  function openEditCourse(courseId) {
    const course = adminCourses.find(function (item) {
      return item.id === courseId;
    });

    if (!course) {
      return;
    }

    document.getElementById("courseTitle").value = course.title;

    document.getElementById("courseCategory").value = course.category;

    document.getElementById("courseLessons").value = course.lessons;

    document.getElementById("courseDuration").value = course.duration;

    document.getElementById("coursePrice").value = course.price;

    document.getElementById("courseOriginalPrice").value = course.originalPrice;

    document.getElementById("courseDescription").value = course.description;

    courseForm.dataset.editingId = courseId;

    courseModalTitle.textContent = "Edit Course";

    courseModal.classList.add("active");
  }

  // =====================================
  // CLOSE MODAL
  // =====================================

  function closeCourseModalBox() {
    courseModal.classList.remove("active");

    courseForm.reset();

    courseForm.dataset.editingId = "";
  }

  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", openAddCourse);
  }

  if (closeCourseModal) {
    closeCourseModal.addEventListener("click", closeCourseModalBox);
  }

  if (cancelCourseBtn) {
    cancelCourseBtn.addEventListener("click", closeCourseModalBox);
  }

  // =====================================
  // SAVE COURSE
  // =====================================

  if (courseForm) {
    courseForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const title = document.getElementById("courseTitle").value.trim();

      const category = document.getElementById("courseCategory").value;

      const lessons = parseInt(document.getElementById("courseLessons").value);

      const duration = document.getElementById("courseDuration").value.trim();

      const price = parseInt(document.getElementById("coursePrice").value);

      const originalPrice = parseInt(
        document.getElementById("courseOriginalPrice").value,
      );

      const description = document
        .getElementById("courseDescription")
        .value.trim();

      const editingId = courseForm.dataset.editingId;

      // =============================
      // EDIT EXISTING COURSE
      // =============================

      if (editingId) {
        const course = adminCourses.find(function (item) {
          return item.id === editingId;
        });

        if (course) {
          course.title = title;

          course.category = category;

          course.lessons = lessons;

          course.duration = duration;

          course.price = price;

          course.originalPrice = originalPrice;

          course.description = description;
        }
      }

      // =============================
      // ADD NEW COURSE
      // =============================
      else {
        const newCourse = {
          id: "course-" + Date.now(),

          title: title,

          category: category,

          lessons: lessons,

          duration: duration,

          price: price,

          originalPrice: originalPrice,

          students: 0,

          description: description,
        };

        adminCourses.push(newCourse);
      }

      // =============================
      // SAVE
      // =============================

      localStorage.setItem("hvacAdminCourses", JSON.stringify(adminCourses));

      updateCourseCount();

      displayAdminCourses(adminCourses);

      closeCourseModalBox();

      alert("Course saved successfully!");
    });
  }

  // =====================================
  // INITIAL LOAD
  // =====================================

  updateCourseCount();

  displayAdminCourses(adminCourses);
}

// =========================
// ORDER MANAGEMENT
// =========================

const ordersTableBody = document.getElementById("ordersTableBody");

const orderTotal = document.getElementById("orderTotal");

const ordersEmpty = document.getElementById("ordersEmpty");

const orderSearch = document.getElementById("orderSearch");

let allOrders = [];

function loadAdminOrders() {
  allOrders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

  renderAdminOrders();
}

function renderAdminOrders() {
  if (!ordersTableBody) {
    return;
  }

  ordersTableBody.innerHTML = "";

  const searchText = orderSearch ? orderSearch.value.toLowerCase().trim() : "";

  const filteredOrders = allOrders.filter(function (order) {
    const student = (order.customer?.fullName || "").toLowerCase();

    const email = (order.customer?.email || "").toLowerCase();

    const course = (order.courses || [])
      .map(function (item) {
        return item.title || "";
      })
      .join(" ")
      .toLowerCase();

    return (
      student.includes(searchText) ||
      email.includes(searchText) ||
      course.includes(searchText)
    );
  });

  if (orderTotal) {
    orderTotal.textContent = filteredOrders.length;
  }

  if (filteredOrders.length === 0) {
    if (ordersEmpty) {
      ordersEmpty.style.display = "block";
    }

    return;
  }

  if (ordersEmpty) {
    ordersEmpty.style.display = "none";
  }

  filteredOrders.forEach(function (order) {
    const row = document.createElement("tr");

    // ORDER ID
    const orderId = order.orderId || "N/A";

    // CUSTOMER
    const studentName = order.customer?.fullName || "Unknown";

    const email = order.customer?.email || "N/A";

    // COURSES
    const courseNames = (order.courses || [])
      .map(function (course) {
        return course.title || "Unknown Course";
      })
      .join(", ");

    // AMOUNT
    const amount = Number(order.total) || 0;

    // PAYMENT
    const payment = order.paymentMethod || "N/A";

    // DATE
    let formattedDate = "N/A";

    if (order.orderDate) {
      formattedDate = new Date(order.orderDate).toLocaleDateString("en-IN");
    }

    // STATUS
    const status = order.status || "Pending";

    row.innerHTML = `

            <td>
                <strong>
                    ${orderId}
                </strong>
            </td>

            <td>
                <div class="student-name-cell">
                    ${studentName}
                </div>

                <div class="student-email-cell">
                    ${email}
                </div>
            </td>

            <td>
                ${courseNames}
            </td>

            <td>
                ₹${amount}
            </td>

            <td>
                ${payment}
            </td>

            <td>
                ${formattedDate}
            </td>

            <td>
                <span class="student-status">
                    ${status}
                </span>
            </td>

        `;

    ordersTableBody.appendChild(row);
  });
}

if (orderSearch) {
  orderSearch.addEventListener("input", function () {
    renderAdminOrders();
  });
}

if (ordersTableBody) {
  loadAdminOrders();
}

// =========================
// LECTURE MANAGEMENT
// =========================

const lectureTableBody = document.getElementById("lecturesTableBody");

const lectureTotal = document.getElementById("lectureTotal");

const lecturesEmpty = document.getElementById("lecturesEmpty");

const lectureSearch = document.getElementById("lectureSearch");

const addLectureBtn = document.getElementById("addLectureBtn");

const lectureModal = document.getElementById("lectureModal");

const closeLectureModal = document.getElementById("closeLectureModal");

const cancelLectureBtn = document.getElementById("cancelLectureBtn");

const lectureForm = document.getElementById("lectureForm");

const lectureModalTitle = document.getElementById("lectureModalTitle");

const lectureCourse = document.getElementById("lectureCourse");

const lectureNumber = document.getElementById("lectureNumber");

const lectureTitle = document.getElementById("lectureTitle");

const lectureVideo = document.getElementById("lectureVideo");

const ADMIN_LECTURES_KEY = "hvacAdminLectures";

let allLectures = [];

let editingLectureId = null;

// =========================
// GET COURSES
// =========================

function getAdminCoursesForLectures() {
  return JSON.parse(localStorage.getItem("hvacAdminCourses")) || [];
}

// =========================
// LOAD LECTURES
// =========================

function loadAdminLectures() {
  allLectures = JSON.parse(localStorage.getItem(ADMIN_LECTURES_KEY)) || [];

  populateLectureCourses();

  renderAdminLectures();
}

// =========================
// COURSE DROPDOWN
// =========================

function populateLectureCourses() {
  if (!lectureCourse) {
    return;
  }

  const courses = getAdminCoursesForLectures();

  lectureCourse.innerHTML = `
        <option value="">
            Select Course
        </option>
    `;

  courses.forEach(function (course) {
    const option = document.createElement("option");

    option.value = course.id;

    option.textContent = course.title;

    lectureCourse.appendChild(option);
  });
}

// =========================
// RENDER LECTURES
// =========================

function renderAdminLectures() {
  if (!lectureTableBody) {
    return;
  }

  lectureTableBody.innerHTML = "";

  const searchText = lectureSearch
    ? lectureSearch.value.toLowerCase().trim()
    : "";

  const courses = getAdminCoursesForLectures();

  const filteredLectures = allLectures.filter(function (lecture) {
    const course = courses.find(function (item) {
      return item.id === lecture.courseId;
    });

    const courseName = course ? course.title : "Unknown Course";

    return (
      (lecture.title || "").toLowerCase().includes(searchText) ||
      courseName.toLowerCase().includes(searchText)
    );
  });

  if (lectureTotal) {
    lectureTotal.textContent = filteredLectures.length;
  }

  if (filteredLectures.length === 0) {
    if (lecturesEmpty) {
      lecturesEmpty.style.display = "block";
    }

    return;
  }

  if (lecturesEmpty) {
    lecturesEmpty.style.display = "none";
  }

  filteredLectures.forEach(function (lecture) {
    const row = document.createElement("tr");

    const course = courses.find(function (item) {
      return item.id === lecture.courseId;
    });

    const courseName = course ? course.title : "Unknown Course";

    row.innerHTML = `

            <td>
                <span class="lecture-number-cell">
                    ${lecture.number}
                </span>
            </td>

            <td>
                <strong>
                    ${lecture.title}
                </strong>
            </td>

            <td>
                <span class="lecture-course-cell">
                    ${courseName}
                </span>
            </td>

            <td>
                <span class="lecture-video-cell">
                    🎥 Video
                </span>
            </td>

            <td>

                <div class="course-action-group">

                    <button
                        type="button"
                        class="student-action-btn lecture-edit-btn"
                        data-id="${lecture.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="student-action-btn lecture-delete-btn"
                        data-id="${lecture.id}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        `;

    lectureTableBody.appendChild(row);
  });

  // EDIT BUTTONS

  lectureTableBody
    .querySelectorAll(".lecture-edit-btn")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        openLectureEdit(button.dataset.id);
      });
    });

  // DELETE BUTTONS

  lectureTableBody
    .querySelectorAll(".lecture-delete-btn")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        deleteLecture(button.dataset.id);
      });
    });
}

// =========================
// OPEN ADD MODAL
// =========================

function openLectureAdd() {
  editingLectureId = null;

  if (lectureModalTitle) {
    lectureModalTitle.textContent = "Add New Lecture";
  }

  if (lectureForm) {
    lectureForm.reset();
  }

  populateLectureCourses();

  if (lectureModal) {
    lectureModal.classList.add("active");
  }
}

// =========================
// OPEN EDIT MODAL
// =========================

function openLectureEdit(id) {
  const lecture = allLectures.find(function (item) {
    return item.id === id;
  });

  if (!lecture) {
    return;
  }

  editingLectureId = id;

  lectureModalTitle.textContent = "Edit Lecture";

  lectureCourse.value = lecture.courseId;

  lectureNumber.value = lecture.number;

  lectureTitle.value = lecture.title;

  lectureVideo.value = lecture.video;

  lectureModal.classList.add("active");
}

// =========================
// CLOSE MODAL
// =========================

function closeLectureModalWindow() {
  if (lectureModal) {
    lectureModal.classList.remove("active");
  }

  editingLectureId = null;
}

// =========================
// SAVE LECTURE
// =========================

if (lectureForm) {
  lectureForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const courseId = lectureCourse.value;

    const number = lectureNumber.value;

    const title = lectureTitle.value.trim();

    const video = lectureVideo.value.trim();

    if (!courseId || !number || !title || !video) {
      alert("Please fill all lecture details.");

      return;
    }

    if (editingLectureId) {
      const index = allLectures.findIndex(function (item) {
        return item.id === editingLectureId;
      });

      if (index !== -1) {
        allLectures[index] = {
          ...allLectures[index],

          courseId,
          number: Number(number),
          title,
          video,
        };
      }
    } else {
      const newLecture = {
        id: "LECTURE" + Date.now(),

        courseId,

        number: Number(number),

        title,

        video,

        createdAt: new Date().toISOString(),
      };

      allLectures.push(newLecture);
    }

    localStorage.setItem(ADMIN_LECTURES_KEY, JSON.stringify(allLectures));

    closeLectureModalWindow();

    renderAdminLectures();

    alert(
      editingLectureId
        ? "Lecture updated successfully!"
        : "Lecture added successfully!",
    );
  });
}

// =========================
// DELETE LECTURE
// =========================

function deleteLecture(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this lecture?",
  );

  if (!confirmDelete) {
    return;
  }

  allLectures = allLectures.filter(function (lecture) {
    return lecture.id !== id;
  });

  localStorage.setItem(ADMIN_LECTURES_KEY, JSON.stringify(allLectures));

  renderAdminLectures();

  alert("Lecture deleted successfully!");
}

// =========================
// SEARCH
// =========================

if (lectureSearch) {
  lectureSearch.addEventListener("input", function () {
    renderAdminLectures();
  });
}

// =========================
// ADD BUTTON
// =========================

if (addLectureBtn) {
  addLectureBtn.addEventListener("click", function () {
    openLectureAdd();
  });
}

// =========================
// CLOSE BUTTONS
// =========================

if (closeLectureModal) {
  closeLectureModal.addEventListener("click", function () {
    closeLectureModalWindow();
  });
}

if (cancelLectureBtn) {
  cancelLectureBtn.addEventListener("click", function () {
    closeLectureModalWindow();
  });
}

// =========================
// INITIAL LOAD
// =========================

if (lectureTableBody) {
  loadAdminLectures();
}

// =========================
// LIVE CLASS MANAGEMENT
// =========================

const liveClassTableBody = document.getElementById("liveClassesTableBody");

const liveClassTotal = document.getElementById("liveClassTotal");

const liveClassesEmpty = document.getElementById("liveClassesEmpty");

const liveClassSearch = document.getElementById("liveClassSearch");

const addLiveClassBtn = document.getElementById("addLiveClassBtn");

const liveClassModal = document.getElementById("liveClassModal");

const closeLiveClassModal = document.getElementById("closeLiveClassModal");

const cancelLiveClassBtn = document.getElementById("cancelLiveClassBtn");

const liveClassForm = document.getElementById("liveClassForm");

const liveClassModalTitle = document.getElementById("liveClassModalTitle");

const liveClassTitle = document.getElementById("liveClassTitle");

const liveClassCourse = document.getElementById("liveClassCourse");

const liveClassDate = document.getElementById("liveClassDate");

const liveClassTime = document.getElementById("liveClassTime");

const liveClassInstructor = document.getElementById("liveClassInstructor");

const liveClassLink = document.getElementById("liveClassLink");

const liveClassDescription = document.getElementById("liveClassDescription");

const ADMIN_LIVE_CLASSES_KEY = "hvacAdminLiveClasses";

let allLiveClasses = [];

let editingLiveClassId = null;

// =========================
// GET COURSES
// =========================

function getLiveClassCourses() {
  return JSON.parse(localStorage.getItem("hvacAdminCourses")) || [];
}

// =========================
// LOAD LIVE CLASSES
// =========================

function loadAdminLiveClasses() {
  allLiveClasses =
    JSON.parse(localStorage.getItem(ADMIN_LIVE_CLASSES_KEY)) || [];

  populateLiveClassCourses();

  renderAdminLiveClasses();
}

// =========================
// COURSE DROPDOWN
// =========================

function populateLiveClassCourses() {
  if (!liveClassCourse) {
    return;
  }

  const courses = getLiveClassCourses();

  liveClassCourse.innerHTML = `
        <option value="">
            Select Course
        </option>
    `;

  courses.forEach(function (course) {
    const option = document.createElement("option");

    option.value = course.id;

    option.textContent = course.title;

    liveClassCourse.appendChild(option);
  });
}

// =========================
// GET CLASS STATUS
// =========================

function getLiveClassStatus(date, time) {
  if (!date || !time) {
    return "upcoming";
  }

  const classDateTime = new Date(`${date}T${time}`);

  const now = new Date();

  const endTime = new Date(classDateTime.getTime() + 60 * 60 * 1000);

  if (now < classDateTime) {
    return "upcoming";
  }

  if (now >= classDateTime && now <= endTime) {
    return "live";
  }

  return "completed";
}

// =========================
// RENDER LIVE CLASSES
// =========================

function renderAdminLiveClasses() {
  if (!liveClassTableBody) {
    return;
  }

  liveClassTableBody.innerHTML = "";

  const searchText = liveClassSearch
    ? liveClassSearch.value.toLowerCase().trim()
    : "";

  const courses = getLiveClassCourses();

  const filteredClasses = allLiveClasses.filter(function (liveClass) {
    const course = courses.find(function (item) {
      return item.id === liveClass.courseId;
    });

    const courseName = course ? course.title : "Unknown Course";

    return (
      (liveClass.title || "").toLowerCase().includes(searchText) ||
      courseName.toLowerCase().includes(searchText) ||
      (liveClass.instructor || "").toLowerCase().includes(searchText)
    );
  });

  if (liveClassTotal) {
    liveClassTotal.textContent = filteredClasses.length;
  }

  if (filteredClasses.length === 0) {
    if (liveClassesEmpty) {
      liveClassesEmpty.style.display = "block";
    }

    return;
  }

  if (liveClassesEmpty) {
    liveClassesEmpty.style.display = "none";
  }

  filteredClasses.forEach(function (liveClass) {
    const row = document.createElement("tr");

    const course = courses.find(function (item) {
      return item.id === liveClass.courseId;
    });

    const courseName = course ? course.title : "Unknown Course";

    const status = getLiveClassStatus(liveClass.date, liveClass.time);

    let statusText = "Upcoming";

    let statusClass = "live-class-upcoming";

    if (status === "live") {
      statusText = "Live Now";

      statusClass = "live-class-live";
    } else if (status === "completed") {
      statusText = "Completed";

      statusClass = "live-class-completed";
    }

    row.innerHTML = `

            <td>
                <strong>
                    ${liveClass.title}
                </strong>
            </td>

            <td>
                ${courseName}
            </td>

            <td>
                ${liveClass.date}
            </td>

            <td>
                ${liveClass.time}
            </td>

            <td>
                ${liveClass.instructor}
            </td>

            <td>
                <span class="live-class-status ${statusClass}">
                    ${statusText}
                </span>
            </td>

            <td>

                <div class="course-action-group">

                    <button
                        type="button"
                        class="student-action-btn live-class-edit-btn"
                        data-id="${liveClass.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="student-action-btn live-class-delete-btn"
                        data-id="${liveClass.id}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        `;

    liveClassTableBody.appendChild(row);
  });

  // EDIT

  liveClassTableBody
    .querySelectorAll(".live-class-edit-btn")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        openLiveClassEdit(button.dataset.id);
      });
    });

  // DELETE

  liveClassTableBody
    .querySelectorAll(".live-class-delete-btn")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        deleteLiveClass(button.dataset.id);
      });
    });
}

// =========================
// OPEN ADD MODAL
// =========================

function openLiveClassAdd() {
  editingLiveClassId = null;

  if (liveClassModalTitle) {
    liveClassModalTitle.textContent = "Add Live Class";
  }

  if (liveClassForm) {
    liveClassForm.reset();
  }

  populateLiveClassCourses();

  if (liveClassModal) {
    liveClassModal.classList.add("active");
  }
}

// =========================
// OPEN EDIT MODAL
// =========================

function openLiveClassEdit(id) {
  const liveClass = allLiveClasses.find(function (item) {
    return item.id === id;
  });

  if (!liveClass) {
    return;
  }

  editingLiveClassId = id;

  liveClassModalTitle.textContent = "Edit Live Class";

  liveClassCourse.value = liveClass.courseId;

  liveClassTitle.value = liveClass.title;

  liveClassDate.value = liveClass.date;

  liveClassTime.value = liveClass.time;

  liveClassInstructor.value = liveClass.instructor;

  liveClassLink.value = liveClass.link;

  liveClassDescription.value = liveClass.description || "";

  liveClassModal.classList.add("active");
}

// =========================
// CLOSE MODAL
// =========================

function closeLiveClassModalWindow() {
  if (liveClassModal) {
    liveClassModal.classList.remove("active");
  }

  editingLiveClassId = null;
}

// =========================
// SAVE LIVE CLASS
// =========================

if (liveClassForm) {
  liveClassForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = liveClassTitle.value.trim();

    const courseId = liveClassCourse.value;

    const date = liveClassDate.value;

    const time = liveClassTime.value;

    const instructor = liveClassInstructor.value.trim();

    const link = liveClassLink.value.trim();

    const description = liveClassDescription.value.trim();

    if (!title || !courseId || !date || !time || !instructor || !link) {
      alert("Please fill all required fields.");

      return;
    }

    if (editingLiveClassId) {
      const index = allLiveClasses.findIndex(function (item) {
        return item.id === editingLiveClassId;
      });

      if (index !== -1) {
        allLiveClasses[index] = {
          ...allLiveClasses[index],

          title,
          courseId,
          date,
          time,
          instructor,
          link,
          description,
        };
      }
    } else {
      const newLiveClass = {
        id: "LIVE" + Date.now(),

        title,
        courseId,
        date,
        time,
        instructor,
        link,
        description,

        createdAt: new Date().toISOString(),
      };

      allLiveClasses.push(newLiveClass);
    }

    localStorage.setItem(
      ADMIN_LIVE_CLASSES_KEY,
      JSON.stringify(allLiveClasses),
    );

    closeLiveClassModalWindow();

    renderAdminLiveClasses();

    alert(
      editingLiveClassId
        ? "Live class updated successfully!"
        : "Live class added successfully!",
    );
  });
}

// =========================
// DELETE LIVE CLASS
// =========================

function deleteLiveClass(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this live class?",
  );

  if (!confirmDelete) {
    return;
  }

  allLiveClasses = allLiveClasses.filter(function (liveClass) {
    return liveClass.id !== id;
  });

  localStorage.setItem(ADMIN_LIVE_CLASSES_KEY, JSON.stringify(allLiveClasses));

  renderAdminLiveClasses();

  alert("Live class deleted successfully!");
}

// =========================
// SEARCH
// =========================

if (liveClassSearch) {
  liveClassSearch.addEventListener("input", function () {
    renderAdminLiveClasses();
  });
}

// =========================
// ADD BUTTON
// =========================

if (addLiveClassBtn) {
  addLiveClassBtn.addEventListener("click", function () {
    openLiveClassAdd();
  });
}

// =========================
// CLOSE BUTTONS
// =========================

if (closeLiveClassModal) {
  closeLiveClassModal.addEventListener("click", function () {
    closeLiveClassModalWindow();
  });
}

if (cancelLiveClassBtn) {
  cancelLiveClassBtn.addEventListener("click", function () {
    closeLiveClassModalWindow();
  });
}

// =========================
// INITIAL LOAD
// =========================

if (liveClassTableBody) {
  loadAdminLiveClasses();
}

// =========================
// CERTIFICATE MANAGEMENT
// =========================

const certificatesTableBody = document.getElementById("certificatesTableBody");

const certificateTotal = document.getElementById("certificateTotal");

const certificatesEmpty = document.getElementById("certificatesEmpty");

const certificateSearch = document.getElementById("certificateSearch");

let allCertificates = [];

// =========================
// LOAD CERTIFICATES
// =========================

function loadAdminCertificates() {
  allCertificates = [];

  const orders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

  const adminCourses =
    JSON.parse(localStorage.getItem("hvacAdminCourses")) || [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key || !key.startsWith("hvacCertificate_") || key.endsWith("_date")) {
      continue;
    }

    const certificateId = localStorage.getItem(key);

    if (!certificateId) {
      continue;
    }

    const certificateData = key.replace("hvacCertificate_", "");

    const separatorIndex = certificateData.indexOf("_");

    if (separatorIndex === -1) {
      continue;
    }

    const courseId = certificateData.substring(separatorIndex + 1);

    // Find student's order using course ID
    const matchingOrder = orders.find(function (order) {
      return (
        order.customer &&
        Array.isArray(order.courses) &&
        order.courses.some(function (course) {
          return course.id === courseId;
        })
      );
    });

    if (!matchingOrder) {
      continue;
    }

    // Find course details
    let course = matchingOrder.courses.find(function (item) {
      return item.id === courseId;
    });

    if (!course) {
      course = adminCourses.find(function (item) {
        return item.id === courseId;
      });
    }

    if (!course) {
      continue;
    }

    const certificateDate = localStorage.getItem(key + "_date");

    allCertificates.push({
      certificateId: certificateId,

      studentName: matchingOrder.customer.fullName,

      studentEmail: matchingOrder.customer.email,

      courseId: courseId,

      courseName: course.title,

      issueDate: certificateDate,

      userId: null,

      status: "Valid",
    });
  }

  renderAdminCertificates();
}

// =========================
// RENDER CERTIFICATES
// =========================

function renderAdminCertificates() {
  if (!certificatesTableBody) {
    return;
  }

  certificatesTableBody.innerHTML = "";

  const searchText = certificateSearch
    ? certificateSearch.value.toLowerCase().trim()
    : "";

  const filteredCertificates = allCertificates.filter(function (certificate) {
    return (
      certificate.certificateId.toLowerCase().includes(searchText) ||
      certificate.studentName.toLowerCase().includes(searchText) ||
      certificate.studentEmail.toLowerCase().includes(searchText) ||
      certificate.courseName.toLowerCase().includes(searchText)
    );
  });

  if (certificateTotal) {
    certificateTotal.textContent = filteredCertificates.length;
  }

  if (filteredCertificates.length === 0) {
    if (certificatesEmpty) {
      certificatesEmpty.style.display = "block";
    }

    return;
  }

  if (certificatesEmpty) {
    certificatesEmpty.style.display = "none";
  }

  filteredCertificates.forEach(function (certificate) {
    const row = document.createElement("tr");

    const formattedDate = certificate.issueDate
      ? new Date(certificate.issueDate).toLocaleDateString("en-IN")
      : "N/A";

    row.innerHTML = `

                <td>
                    <span class="certificate-id-cell">
                        ${certificate.certificateId}
                    </span>
                </td>

                <td>

                    <div class="certificate-student-cell">
                        ${certificate.studentName}
                    </div>

                    <div class="student-email-cell">
                        ${certificate.studentEmail}
                    </div>

                </td>

                <td>
                    <span class="certificate-course-cell">
                        ${certificate.courseName}
                    </span>
                </td>

                <td>
                    ${formattedDate}
                </td>

                <td>

                    <span class="certificate-status">
                        ${certificate.status}
                    </span>

                </td>

                <td>

                    <div class="course-action-group">
     <a
    href="certificate.html?id=${certificate.courseId}&certificateId=${encodeURIComponent(certificate.certificateId)}&studentName=${encodeURIComponent(certificate.studentName)}&studentEmail=${encodeURIComponent(certificate.studentEmail)}&courseName=${encodeURIComponent(certificate.courseName)}&issueDate=${encodeURIComponent(certificate.issueDate || "")}&admin=true"
    class="admin-view-btn"
>
    View
</a>

                    </div>

                </td>

            `;

    certificatesTableBody.appendChild(row);
  });
}

// =========================
// SEARCH
// =========================

if (certificateSearch) {
  certificateSearch.addEventListener("input", function () {
    renderAdminCertificates();
  });
}

// =========================
// INITIAL LOAD
// =========================

if (certificatesTableBody) {
  loadAdminCertificates();
}

// =========================================
// ADMIN LOGOUT
// =========================================

const adminLogoutBtn = document.getElementById("adminLogoutBtn");

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("hvacAdminLoggedIn");

    window.location.href = "admin-login.html";
  });
}

// =========================================
// ADMIN DASHBOARD STATISTICS
// =========================================

if (document.getElementById("adminCourseCount")) {
  const adminCourseCount = document.getElementById("adminCourseCount");

  const adminStudentCount = document.getElementById("adminStudentCount");

  const adminOrderCount = document.getElementById("adminOrderCount");

  const adminCertificateCount = document.getElementById(
    "adminCertificateCount",
  );

  // TOTAL COURSES
  const adminCourses =
    JSON.parse(localStorage.getItem("hvacAdminCourses")) || [];

  adminCourseCount.textContent = adminCourses.length;

  // TOTAL STUDENTS
  const students = JSON.parse(localStorage.getItem("hvacUsers")) || [];

  adminStudentCount.textContent = students.length;

  // TOTAL ORDERS
  const orders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

  adminOrderCount.textContent = orders.length;

  // TOTAL CERTIFICATES

  // TOTAL CERTIFICATES
  let certificateCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("hvacCertificate_") && !key.endsWith("_date")) {
      certificateCount++;
    }
  }

  adminCertificateCount.textContent = certificateCount;
}
