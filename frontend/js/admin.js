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
    window.location.pathname.includes("admin-certificates.html") ||
    window.location.pathname.includes("admin-coupons.html");

  const adminToken = localStorage.getItem("hvacAdminToken");

  if (adminPage && !adminToken) {
    window.location.href = "admin-login.html";
  }
  // =========================================
  // ADMIN LOGIN
  // =========================================
  const adminLoginForm = document.getElementById("adminLoginForm");

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document
        .getElementById("adminEmail")
        .value.trim()
        .toLowerCase();

      const password = document.getElementById("adminPassword").value;

      if (!email || !password) {
        alert("Please enter admin email and password.");
        return;
      }

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/admin/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              password: password,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Invalid admin email or password.");
          return;
        }

        // Save admin JWT token
        localStorage.setItem("hvacAdminToken", data.token);

        alert("Admin login successful!");

        window.location.href = "admin.html";
      } catch (error) {
        console.error("Admin Login Error:", error);

        alert("Unable to connect to server. Please try again.");
      }
    });
  }
  // =========================================
  // ADMIN SETUP
  // =========================================

  const adminSetupForm = document.getElementById("adminSetupForm");

  if (adminSetupForm) {
    adminSetupForm.addEventListener("submit", async function (event) {
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

      // ================================
      // VALIDATION
      // ================================

      if (!name || !email || !password || !confirmPassword) {
        alert("Please fill all required fields.");
        return;
      }

      if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }

      if (!/[A-Z]/.test(password)) {
        alert("Password must contain at least one uppercase letter.");
        return;
      }

      if (!/[a-z]/.test(password)) {
        alert("Password must contain at least one lowercase letter.");
        return;
      }

      if (!/[0-9]/.test(password)) {
        alert("Password must contain at least one number.");
        return;
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        alert("Password must contain at least one special character.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      // ================================
      // CREATE ADMIN
      // ================================

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/admin/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              email: email,
              password: password,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to create admin account.");
          return;
        }

        alert("Admin account created successfully!");

        adminSetupForm.reset();

        window.location.href = "admin-login.html";
      } catch (error) {
        console.error("Admin Setup Error:", error);

        alert("Unable to connect to server. Please try again.");
      }
    });
  }

  // =========================================
  // STUDENT MANAGEMENT
  // =========================================

  const studentsTableBody = document.getElementById("studentsTableBody");

  const studentsEmpty = document.getElementById("studentsEmpty");

  const studentTotal = document.getElementById("studentTotal");

  const studentSearch = document.getElementById("studentSearch");

  // =========================================
  // STUDENT MANAGEMENT - BACKEND
  // =========================================

  if (studentsTableBody) {
    let students = [];

    // =====================================
    // LOAD STUDENTS FROM BACKEND
    // =====================================

    async function loadStudents() {
      const adminToken = localStorage.getItem("hvacAdminToken");

      if (!adminToken) {
        console.error("Admin token not found.");
        return;
      }

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/user/admin/students",
          {
            method: "GET",
            headers: {
              Authorization: "Bearer " + adminToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Students Fetch Error:", data.message);
          return;
        }

        students = Array.isArray(data.students) ? data.students : [];

        updateStudentCount();
        displayStudents(students);
      } catch (error) {
        console.error("Backend Students Error:", error);
      }
    }

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

        const registeredDate =
          student.registeredAt || student.createdAt
            ? new Date(
                student.registeredAt || student.createdAt,
              ).toLocaleDateString("en-IN", {
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
              data-student-id="${student._id || student.id}"
            >
              Delete
            </button>
          </td>
        `;

        studentsTableBody.appendChild(row);
      });

      // =====================================
      // DELETE STUDENT
      // =====================================

      const deleteButtons = studentsTableBody.querySelectorAll(
        ".student-action-btn",
      );

      deleteButtons.forEach(function (button) {
        button.addEventListener("click", async function () {
          const studentId = button.dataset.studentId;

          const confirmDelete = confirm(
            "Are you sure you want to delete this student?",
          );

          if (!confirmDelete) {
            return;
          }

          const adminToken = localStorage.getItem("hvacAdminToken");

          try {
            const response = await fetch(
              "https://hvac-tutorial.onrender.com/api/user/admin/students/" +
                studentId,
              {
                method: "DELETE",
                headers: {
                  Authorization: "Bearer " + adminToken,
                },
              },
            );

            const data = await response.json();

            if (!response.ok) {
              alert(data.message || "Unable to delete student.");
              return;
            }

            alert("Student deleted successfully!");

            await loadStudents();
          } catch (error) {
            console.error("Delete Student Error:", error);

            alert("Server error while deleting student.");
          }
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

    loadStudents();
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
    let adminCourses = [];

    async function loadAdminCourses() {
      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/courses",
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Admin Courses Fetch Error:", data.message);
          return;
        }

        if (Array.isArray(data.courses)) {
          adminCourses = data.courses;
        } else {
          adminCourses = [];
        }

        updateCourseCount();
        populateCourseCategories();
        displayAdminCourses(adminCourses);
      } catch (error) {
        console.error("Admin Courses Backend Error:", error);
      }
    }

    loadAdminCourses();
    loadCategories();

    function populateCourseCategories() {
      const categorySelect = document.getElementById("courseCategory");

      if (!categorySelect) return;

      const categories = [];

      adminCourses.forEach(function (course) {
        if (course.category && !categories.includes(course.category)) {
          categories.push(course.category);
        }
      });

      categorySelect.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select Category";
      categorySelect.appendChild(defaultOption);

      categories.forEach(function (category) {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = getCategoryName(category);

        categorySelect.appendChild(option);
      });
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
    async function loadCategories() {
      const categorySelect = document.getElementById("courseCategory");

      if (!categorySelect) return;

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/categories",
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Categories Fetch Error:", data.message);
          return;
        }

        categorySelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Category";
        categorySelect.appendChild(defaultOption);

        const categories = Array.isArray(data.categories) ? data.categories : [];

        categories.forEach(function (category) {
          const option = document.createElement("option");

          option.value = category.name;
          option.textContent = category.name;

          categorySelect.appendChild(option);
        });
      } catch (error) {
        console.error("Load Categories Error:", error);
      }
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
        button.addEventListener("click", async function () {
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

          const adminToken = localStorage.getItem("hvacAdminToken");

          try {
            const response = await fetch(
              "https://hvac-tutorial.onrender.com/api/courses/admin/" + courseId,
              {
                method: "DELETE",
                headers: {
                  Authorization: "Bearer " + adminToken,
                },
              },
            );

            const data = await response.json();

            if (!response.ok) {
              alert(data.message || "Unable to delete course.");
              return;
            }

            alert("Course deleted successfully!");

            loadAdminCourses();
          } catch (error) {
            console.error("Delete Course Error:", error);
            alert("Server error while deleting course.");
          }
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
    // ADD NEW CATEGORY
    // =====================================

    const addCategoryBtn = document.getElementById("addCategoryBtn");

    if (addCategoryBtn) {
      addCategoryBtn.addEventListener("click", async function () {
        const categoryName = prompt("Enter new category name:");

        if (!categoryName || !categoryName.trim()) {
          return;
        }

        const adminToken = localStorage.getItem("hvacAdminToken");

        if (!adminToken) {
          alert("Admin authentication required. Please login again.");
          return;
        }

        try {
          const response = await fetch(
            "https://hvac-tutorial.onrender.com/api/categories",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + adminToken,
              },
              body: JSON.stringify({
                name: categoryName.trim(),
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Unable to add category.");
            return;
          }

          alert("Category added successfully!");

          await loadCategories();

          document.getElementById("courseCategory").value = data.category.name;
        } catch (error) {
          console.error("Add Category Error:", error);
          alert("Server error while adding category.");
        }
      });
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
      courseForm.addEventListener("submit", async function (event) {
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

        const adminToken = localStorage.getItem("hvacAdminToken");

        try {
          // =============================
          // EDIT EXISTING COURSE
          // =============================

          if (editingId) {
            const response = await fetch(
              "https://hvac-tutorial.onrender.com/api/courses/admin/" + editingId,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + adminToken,
                },
                body: JSON.stringify({
                  title: title,
                  category: category,
                  lessons: lessons,
                  duration: duration,
                  price: price,
                  originalPrice: originalPrice,
                  students: 0,
                  description: description,
                }),
              },
            );

            const data = await response.json();

            if (!response.ok) {
              alert(data.message || "Unable to update course.");
              return;
            }

            alert("Course updated successfully!");
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

            const response = await fetch(
              "https://hvac-tutorial.onrender.com/api/courses/admin",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + adminToken,
                },
                body: JSON.stringify(newCourse),
              },
            );

            const data = await response.json();

            if (!response.ok) {
              alert(data.message || "Unable to add course.");
              return;
            }

            alert("Course added successfully!");
          }

          delete courseForm.dataset.editingId;

          closeCourseModalBox();

          loadAdminCourses();
        } catch (error) {
          console.error("Save Course Error:", error);

          alert("Server error while saving course.");
        }
      });
    }
  }

  // =========================
  // ORDER MANAGEMENT
  // =========================

  const ordersTableBody = document.getElementById("ordersTableBody");

  const orderTotal = document.getElementById("orderTotal");

  const ordersEmpty = document.getElementById("ordersEmpty");

  const orderSearch = document.getElementById("orderSearch");

  let allOrders = [];

  async function loadAdminOrders() {
    const token = localStorage.getItem("hvacAdminToken");

    if (!token) {
      console.error("Admin token not found.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/orders/admin/all",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Admin Orders Fetch Error:", data.message);
        return;
      }

      if (Array.isArray(data.orders)) {
        allOrders = data.orders;
      } else {
        allOrders = [];
      }

      renderAdminOrders();
    } catch (error) {
      console.error("Admin Orders Error:", error);
    }
  }
  function renderAdminOrders() {
    if (!ordersTableBody) {
      return;
    }

    ordersTableBody.innerHTML = "";

    const searchText = orderSearch ? orderSearch.value.toLowerCase().trim() : "";

    // const filteredOrders = allOrders.filter(function (order) {
    //   const student = (order.customer?.fullName || "").toLowerCase();

    //   const email = (order.customer?.email || "").toLowerCase();

    //   const course = (order.courses || [])
    //     .map(function (item) {
    //       return item.title || "";
    //     })
    //     .join(" ")
    //     .toLowerCase();

    //   return (
    //     student.includes(searchText) ||
    //     email.includes(searchText) ||
    //     course.includes(searchText)
    //   );
    // });

    const filteredOrders = allOrders.filter(function (order) {
      // Sirf successful/paid orders show honge
      if (order.status !== "Paid") {
        return false;
      }

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
      const orderId = order._id || "N/A";
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

      if (order.createdAt) {
        formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN");
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
                <td>
      <button
          type="button"
          class="order-delete-btn"
          data-order-id="${orderId}"
      >
          Delete
      </button>
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

  // ==========================================
  // DELETE ORDER
  // ==========================================

  document.addEventListener("click", async function (event) {
    if (!event.target.classList.contains("order-delete-btn")) {
      return;
    }

    const orderId = event.target.dataset.orderId;

    if (!orderId) {
      return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this order?");

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("hvacAdminToken");

    if (!token) {
      alert("Admin authentication required.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/orders/admin/" + orderId,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete order.");
        return;
      }

      alert("Order deleted successfully.");

      loadAdminOrders();
    } catch (error) {
      console.error("Delete Order Error:", error);

      alert("Server error while deleting order.");
    }
  });
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
  const lectureThumbnail = document.getElementById("lectureThumbnail");
  const lectureDescription = document.getElementById("lectureDescription");

  let allLectures = [];

  let editingLectureId = null;

  // =========================
  // GET COURSES
  // =========================

  // =========================
  // LOAD LECTURES
  // =========================
  async function loadAdminLectures() {
    const adminToken = localStorage.getItem("hvacAdminToken");

    if (!adminToken) {
      alert("Admin authentication required. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/lectures/admin",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + adminToken,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load lectures.");
        return;
      }

      allLectures = data.lectures || [];

      populateLectureCourses();
      renderAdminLectures();
    } catch (error) {
      console.error("Load Admin Lectures Error:", error);

      alert("Unable to load lectures. Please check the server.");
    }
  }

  // =========================
  // COURSE DROPDOWN
  // =========================
  async function populateLectureCourses() {
    if (!lectureCourse) {
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/courses",
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Lecture Courses Error:", data.message);
        return;
      }

      const courses = Array.isArray(data.courses) ? data.courses : [];

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
    } catch (error) {
      console.error("Populate Lecture Courses Error:", error);
    }
  }
  async function renderAdminLectures() {
    if (!lectureTableBody) {
      return;
    }

    lectureTableBody.innerHTML = "";

    const searchText = lectureSearch
      ? lectureSearch.value.toLowerCase().trim()
      : "";

    let courses = [];

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/courses",
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data.courses)) {
        courses = data.courses;
      }
    } catch (error) {
      console.error("Render Lecture Courses Error:", error);
    }

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
      console.log("LECTURE OBJECT:", lecture);
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
  data-id="${lecture._id}"
  >
    Edit
  </button>

          <button
    type="button"
    class="student-action-btn lecture-delete-btn"
    data-id="${lecture._id}"
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
      return item._id === id;
    });

    if (!lecture) {
      return;
    }

    editingLectureId = id;

    lectureModalTitle.textContent = "Edit Lecture";

    lectureCourse.value = lecture.courseId;

    lectureNumber.value = lecture.number;

    lectureTitle.value = lecture.title;
    lectureDescription.value = lecture.description || "";

    // lectureVideo.value = lecture.video;
    lectureVideo.value = "";

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
    lectureForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const courseId = lectureCourse.value;
      const number = lectureNumber.value;
      const title = lectureTitle.value.trim();
      const description = lectureDescription.value.trim();
      const videoFile = lectureVideo.files[0];
      const thumbnailFile = lectureThumbnail.files[0];

      if (!courseId || !number || !title) {
        alert("Please fill all lecture details.");
        return;
      }

      const adminToken = localStorage.getItem("hvacAdminToken");
      // =========================
      // EDIT EXISTING LECTURE
      // =========================

      if (editingLectureId) {
        try {
          const response = await fetch(
            "https://hvac-tutorial.onrender.com/api/lectures/" + editingLectureId,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + adminToken,
              },
              body: JSON.stringify({
                courseId: courseId,
                number: number,
                title: title,
                description: description,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Failed to update lecture.");
            return;
          }

          alert("Lecture updated successfully!");

          closeLectureModalWindow();
          lectureForm.reset();

          await loadAdminLectures();

          return;
        } catch (error) {
          console.error("Edit Lecture Error:", error);

          alert("Unable to update lecture. Please check the server.");

          return;
        }
      }
      if (!adminToken) {
        alert("Admin authentication required. Please login again.");
        return;
      }

      const formData = new FormData();

      formData.append("courseId", courseId);
      formData.append("number", number);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("video", videoFile);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/lectures",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + adminToken,
            },
            body: formData,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to upload lecture.");
          return;
        }

        alert("Lecture added successfully!");

        closeLectureModalWindow();

        lectureForm.reset();

        loadAdminLectures();
      } catch (error) {
        console.error("Add Lecture Error:", error);

        alert("Unable to upload lecture. Please check the server.");
      }
    });
  }

  // =========================
  // DELETE LECTURE
  // =========================

  async function deleteLecture(id) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this lecture?",
    );

    if (!confirmDelete) {
      return;
    }

    const adminToken = localStorage.getItem("hvacAdminToken");

    if (!adminToken) {
      alert("Admin authentication required. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/lectures/" + id,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + adminToken,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete lecture.");
        return;
      }

      alert("Lecture deleted successfully!");

      await loadAdminLectures();
    } catch (error) {
      console.error("Delete Lecture Error:", error);
      alert("Server error while deleting lecture.");
    }
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

  let allLiveClasses = [];

  let editingLiveClassId = null;

  // =========================
  // LOAD LIVE CLASSES
  // =========================

  async function loadAdminLiveClasses() {
    const adminToken = localStorage.getItem("hvacAdminToken");

    if (!adminToken) {
      console.error("Admin token not found.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/live-classes/admin",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + adminToken,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Live Classes Fetch Error:", data.message);
        return;
      }

      allLiveClasses = Array.isArray(data.liveClasses) ? data.liveClasses : [];

      await populateLiveClassCourses();

      renderAdminLiveClasses();
    } catch (error) {
      console.error("Load Admin Live Classes Error:", error);
    }
  }

  // =========================
  // COURSE DROPDOWN
  // =========================

  async function populateLiveClassCourses() {
    if (!liveClassCourse) {
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/courses",
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Live Class Courses Error:", data.message);
        return;
      }

      const courses = Array.isArray(data.courses) ? data.courses : [];

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
    } catch (error) {
      console.error("Populate Live Class Courses Error:", error);
    }
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

  async function renderAdminLiveClasses() {
    if (!liveClassTableBody) {
      return;
    }

    liveClassTableBody.innerHTML = "";

    const searchText = liveClassSearch
      ? liveClassSearch.value.toLowerCase().trim()
      : "";

    let courses = [];

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/courses",
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data.courses)) {
        courses = data.courses;
      }
    } catch (error) {
      console.error("Render Live Class Courses Error:", error);
    }

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
              data-id="${liveClass._id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="student-action-btn live-class-delete-btn"
              data-id="${liveClass._id}"
            >
              Delete
            </button>

          </div>
        </td>
      `;

      liveClassTableBody.appendChild(row);
    });

    // =========================
    // EDIT
    // =========================

    liveClassTableBody
      .querySelectorAll(".live-class-edit-btn")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          openLiveClassEdit(button.dataset.id);
        });
      });

    // =========================
    // DELETE
    // =========================

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
      return item._id === id;
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
    liveClassForm.addEventListener("submit", async function (event) {
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

      const adminToken = localStorage.getItem("hvacAdminToken");

      if (!adminToken) {
        alert("Admin authentication required. Please login again.");
        return;
      }

      try {
        // =========================
        // EDIT
        // =========================

        if (editingLiveClassId) {
          const response = await fetch(
            "https://hvac-tutorial.onrender.com/api/live-classes/admin/" +
              editingLiveClassId,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + adminToken,
              },
              body: JSON.stringify({
                title: title,
                courseId: courseId,
                date: date,
                time: time,
                instructor: instructor,
                link: link,
                description: description,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Unable to update live class.");
            return;
          }

          alert("Live class updated successfully!");
        }

        // =========================
        // ADD
        // =========================
        else {
          const response = await fetch(
            "https://hvac-tutorial.onrender.com/api/live-classes/admin",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + adminToken,
              },
              body: JSON.stringify({
                title: title,
                courseId: courseId,
                date: date,
                time: time,
                instructor: instructor,
                link: link,
                description: description,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Unable to add live class.");
            return;
          }

          alert("Live class added successfully!");
        }

        closeLiveClassModalWindow();

        liveClassForm.reset();

        await loadAdminLiveClasses();
      } catch (error) {
        console.error("Save Live Class Error:", error);

        alert("Server error while saving live class.");
      }
    });
  }

  // =========================
  // DELETE LIVE CLASS
  // =========================

  async function deleteLiveClass(id) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this live class?",
    );

    if (!confirmDelete) {
      return;
    }

    const adminToken = localStorage.getItem("hvacAdminToken");

    if (!adminToken) {
      alert("Admin authentication required. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/live-classes/admin/" + id,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + adminToken,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete live class.");
        return;
      }

      alert("Live class deleted successfully!");

      await loadAdminLiveClasses();
    } catch (error) {
      console.error("Delete Live Class Error:", error);

      alert("Server error while deleting live class.");
    }
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

  async function loadAdminCertificates() {
    allCertificates = [];

    const adminToken = localStorage.getItem("hvacAdminToken");

    if (!adminToken) {
      console.error("Admin token not found.");
      renderAdminCertificates();
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/certificates/admin/all",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + adminToken,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Admin Certificates Fetch Error:", data.message);
        renderAdminCertificates();
        return;
      }

      if (Array.isArray(data.certificates)) {
        allCertificates = data.certificates.map(function (certificate) {
          return {
            certificateId: certificate.certificateId,
            _id: certificate._id,
            studentName: certificate.user?.name || "N/A",

            studentEmail: certificate.user?.email || "N/A",

            courseId: certificate.courseId,

            courseName: certificate.courseName,

            issueDate: certificate.completionDate,

            userId: certificate.user?._id || null,

            status: certificate.status || "Valid",
          };
        });
      } else {
        allCertificates = [];
      }

      renderAdminCertificates();
    } catch (error) {
      console.error("Admin Certificates Error:", error);

      allCertificates = [];
      renderAdminCertificates();
    }
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

          <button
              type="button"
              class="certificate-delete-btn"
              data-certificate-id="${certificate._id}"
          >
              Delete
          </button>

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

  // ==========================================
  // DELETE CERTIFICATE
  // ==========================================

  document.addEventListener("click", async function (event) {
    if (!event.target.classList.contains("certificate-delete-btn")) {
      return;
    }

    const certificateId = event.target.dataset.certificateId;

    if (!certificateId) {
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete this certificate?",
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("hvacAdminToken");

    if (!token) {
      alert("Admin authentication required.");
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/certificates/admin/" +
          certificateId,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete certificate.");
        return;
      }

      alert("Certificate deleted successfully.");

      loadAdminCertificates();
    } catch (error) {
      console.error("Delete Certificate Error:", error);

      alert("Server error while deleting certificate.");
    }
  });
  // =========================================
  // ADMIN LOGOUT
  // =========================================

  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", function (event) {
      event.preventDefault();

      // Remove admin authentication data
      localStorage.removeItem("hvacAdminToken");

      // Redirect to admin login
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
    async function loadAdminCourseCount() {
      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/courses",
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Course Count Error:", data.message);
          return;
        }

        if (adminCourseCount) {
          adminCourseCount.textContent = Array.isArray(data.courses)
            ? data.courses.length
            : 0;
        }
      } catch (error) {
        console.error("Course Count Backend Error:", error);
      }
    }

    loadAdminCourseCount();

    // TOTAL STUDENTS FROM BACKEND

    const studentsAdminToken = localStorage.getItem("hvacAdminToken");

    if (adminStudentCount && studentsAdminToken) {
      fetch("https://hvac-tutorial.onrender.com/api/user/admin/students", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + studentsAdminToken,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (Array.isArray(data.students)) {
            adminStudentCount.textContent = data.students.length;
          } else {
            adminStudentCount.textContent = "0";
          }
        })
        .catch(function (error) {
          console.error("Students Count Fetch Error:", error);

          adminStudentCount.textContent = "0";
        });
    }

    // TOTAL ORDERS FROM BACKEND

    const adminToken = localStorage.getItem("hvacAdminToken");

    if (adminOrderCount && adminToken) {
      fetch("https://hvac-tutorial.onrender.com/api/orders/admin/all", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + adminToken,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (Array.isArray(data.orders)) {
            const paidOrders = data.orders.filter(function (order) {
              return ["Paid", "Completed", "Success", "Successful"].includes(
                order.status,
              );
            });

            adminOrderCount.textContent = paidOrders.length;
          } else {
            adminOrderCount.textContent = "0";
          }
        })
        .catch(function (error) {
          console.error("Orders Count Fetch Error:", error);
          adminOrderCount.textContent = "0";
        });
    }

    // TOTAL REVENUE FROM BACKEND
    const adminRevenue = document.getElementById("adminRevenue");

    if (adminRevenue && adminToken) {
      fetch("https://hvac-tutorial.onrender.com/api/orders/admin/revenue", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + adminToken,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.totalRevenue !== undefined) {
            adminRevenue.textContent =
              "₹" + Number(data.totalRevenue).toLocaleString("en-IN");
          }
        })
        .catch(function (error) {
          console.error("Revenue Fetch Error:", error);
        });
    }

    // TOTAL CERTIFICATES
    // TOTAL CERTIFICATES FROM BACKEND
    // const adminToken = localStorage.getItem("hvacAdminToken");

    if (adminCertificateCount && adminToken) {
      fetch("https://hvac-tutorial.onrender.com/api/certificates/admin/all", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + adminToken,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (Array.isArray(data.certificates)) {
            adminCertificateCount.textContent = data.certificates.length;
          } else {
            adminCertificateCount.textContent = "0";
          }
        })
        .catch(function (error) {
          console.error("Certificates Count Fetch Error:", error);

          adminCertificateCount.textContent = "0";
        });
    }
  }

  const setupPasswordToggle = document.getElementById("setupPasswordToggle");

  const setupAdminPassword = document.getElementById("setupAdminPassword");

  if (setupPasswordToggle && setupAdminPassword) {
    setupPasswordToggle.addEventListener("click", function () {
      if (setupAdminPassword.type === "password") {
        setupAdminPassword.type = "text";
        setupPasswordToggle.textContent = "🙈";
        setupPasswordToggle.setAttribute("aria-label", "Hide password");
      } else {
        setupAdminPassword.type = "password";
        setupPasswordToggle.textContent = "👁️";
        setupPasswordToggle.setAttribute("aria-label", "Show password");
      }
    });
  }

  const setupConfirmPasswordToggle = document.getElementById(
    "setupConfirmPasswordToggle",
  );

  const setupAdminConfirmPassword = document.getElementById(
    "setupAdminConfirmPassword",
  );

  if (setupConfirmPasswordToggle && setupAdminConfirmPassword) {
    setupConfirmPasswordToggle.addEventListener("click", function () {
      if (setupAdminConfirmPassword.type === "password") {
        setupAdminConfirmPassword.type = "text";
        setupConfirmPasswordToggle.textContent = "🙈";
        setupConfirmPasswordToggle.setAttribute("aria-label", "Hide password");
      } else {
        setupAdminConfirmPassword.type = "password";
        setupConfirmPasswordToggle.textContent = "👁️";
        setupConfirmPasswordToggle.setAttribute("aria-label", "Show password");
      }
    });
  }

  const adminLoginPasswordToggle = document.getElementById(
    "adminLoginPasswordToggle",
  );

  const adminLoginPassword = document.getElementById("adminPassword");

  if (adminLoginPasswordToggle && adminLoginPassword) {
    adminLoginPasswordToggle.addEventListener("click", function () {
      if (adminLoginPassword.type === "password") {
        adminLoginPassword.type = "text";
        adminLoginPasswordToggle.textContent = "🙈";
        adminLoginPasswordToggle.setAttribute("aria-label", "Hide password");
      } else {
        adminLoginPassword.type = "password";
        adminLoginPasswordToggle.textContent = "👁️";
        adminLoginPasswordToggle.setAttribute("aria-label", "Show password");
      }
    });
  }

  // ==========================================
  // ADMIN RESET PASSWORD - SHOW / HIDE
  // ==========================================

  const adminNewPasswordToggle = document.getElementById(
    "adminNewPasswordToggle",
  );

  const adminNewPassword = document.getElementById("adminNewPassword");

  if (adminNewPasswordToggle && adminNewPassword) {
    adminNewPasswordToggle.addEventListener("click", function () {
      if (adminNewPassword.type === "password") {
        adminNewPassword.type = "text";
        adminNewPasswordToggle.textContent = "🙈";
        adminNewPasswordToggle.setAttribute("aria-label", "Hide password");
      } else {
        adminNewPassword.type = "password";
        adminNewPasswordToggle.textContent = "👁️";
        adminNewPasswordToggle.setAttribute("aria-label", "Show password");
      }
    });
  }

  const adminConfirmPasswordToggle = document.getElementById(
    "adminConfirmPasswordToggle",
  );

  const adminConfirmPassword = document.getElementById("adminConfirmPassword");

  if (adminConfirmPasswordToggle && adminConfirmPassword) {
    adminConfirmPasswordToggle.addEventListener("click", function () {
      if (adminConfirmPassword.type === "password") {
        adminConfirmPassword.type = "text";
        adminConfirmPasswordToggle.textContent = "🙈";
        adminConfirmPasswordToggle.setAttribute("aria-label", "Hide password");
      } else {
        adminConfirmPassword.type = "password";
        adminConfirmPasswordToggle.textContent = "👁️";
        adminConfirmPasswordToggle.setAttribute("aria-label", "Show password");
      }
    });
  }

  // ==========================================
  // ADMIN FORGOT PASSWORD
  // ==========================================

  const adminForgotPasswordForm = document.getElementById(
    "adminForgotPasswordForm",
  );

  if (adminForgotPasswordForm) {
    adminForgotPasswordForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document
        .getElementById("adminForgotEmail")
        .value.trim()
        .toLowerCase();

      if (!email) {
        alert("Please enter your admin email.");
        return;
      }

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/admin/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Unable to process password reset request.");
          return;
        }

        alert(data.message || "Password reset request submitted successfully.");

        if (data.resetUrl) {
          window.location.href = data.resetUrl;
        }
      } catch (error) {
        console.error("Admin Forgot Password Error:", error);

        alert("Unable to connect to server. Please try again.");
      }
    });
  }

  // ==========================================
  // ADMIN RESET PASSWORD
  // ==========================================

  const adminResetPasswordForm = document.getElementById(
    "adminResetPasswordForm",
  );

  if (adminResetPasswordForm) {
    adminResetPasswordForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const newPassword = document.getElementById("adminNewPassword").value;

      const confirmPassword = document.getElementById(
        "adminConfirmPassword",
      ).value;

      // Get reset token from URL
      const urlParams = new URLSearchParams(window.location.search);

      const token = urlParams.get("token");

      if (!token) {
        alert("Invalid or missing password reset link.");
        return;
      }

      if (!newPassword || !confirmPassword) {
        alert("Please fill all required fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      if (newPassword.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }

      if (!/[A-Z]/.test(newPassword)) {
        alert("Password must contain at least one uppercase letter.");
        return;
      }

      if (!/[a-z]/.test(newPassword)) {
        alert("Password must contain at least one lowercase letter.");
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        alert("Password must contain at least one number.");
        return;
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        alert("Password must contain at least one special character.");
        return;
      }

      try {
        const response = await fetch(
          "https://hvac-tutorial.onrender.com/api/admin/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: token,
              password: newPassword,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Unable to reset password.");
          return;
        }

        alert(data.message || "Admin password reset successfully.");

        window.location.href = "admin-login.html";
      } catch (error) {
        console.error("Admin Reset Password Error:", error);

        alert("Unable to connect to server. Please try again.");
      }
    });
  }
