// =========================
// MOBILE NAVIGATION
// =========================

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {
  // Open / Close menu
  menuToggle.addEventListener("click", function (event) {
    event.stopPropagation();

    navMenu.classList.toggle("active");

    console.log(
      "Menu:",
      navMenu.classList.contains("active") ? "OPEN" : "CLOSED",
    );
  });

  // Close menu after clicking any link
  const navLinks = navMenu.querySelectorAll("a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navMenu.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      navMenu.classList.remove("active");
    }
  });
}
// =========================
// CURRENT YEAR
// =========================

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// =========================
// CART COUNT
// =========================

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("hvacCart")) || [];

  const cartCountElements = document.querySelectorAll(".cart-count");

  cartCountElements.forEach(function (element) {
    element.textContent = cart.length;
  });
}

updateCartCount();

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  const savedTheme = localStorage.getItem("hvacTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("hvacTheme", "dark");
      themeToggle.textContent = "☀️";
    } else {
      localStorage.setItem("hvacTheme", "light");
      themeToggle.textContent = "🌙";
    }
  });
}

// ========================================
// NAVBAR LOGIN / LOGOUT
// ========================================
document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("hvacToken");

  const navMenu = document.querySelector(".nav-menu");

  if (!navMenu) {
    return;
  }

  // ==========================================
  // CHECK PURCHASED COURSES
  // ==========================================

  let hasPurchasedCourse = false;

  if (token) {
    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/orders",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data.orders)) {
        hasPurchasedCourse = data.orders.some(function (order) {
          return (
            order.status === "Paid" &&
            Array.isArray(order.courses) &&
            order.courses.length > 0
          );
        });
      }
    } catch (error) {
      console.error("Purchased Course Check Error:", error);
    }
  }

  // ==========================================
  // ADD MY COURSES ONLY IF COURSE PURCHASED
  // ==========================================

  if (token && hasPurchasedCourse) {
    const existingMyCourses = Array.from(navMenu.querySelectorAll("a")).find(
      function (link) {
        return link.textContent.trim() === "My Courses";
      },
    );

    if (!existingMyCourses) {
      const myCoursesLink = document.createElement("a");

      myCoursesLink.textContent = "My Courses";

      // Check whether current page is inside /pages/
      if (window.location.pathname.includes("/pages/")) {
        myCoursesLink.href = "my-courses.html";
      } else {
        myCoursesLink.href = "pages/my-courses.html";
      }

      // Insert My Courses after Courses
      const courseLink = Array.from(navMenu.querySelectorAll("a")).find(
        function (link) {
          return link.textContent.trim() === "Courses";
        },
      );

      if (courseLink) {
        courseLink.insertAdjacentElement("afterend", myCoursesLink);
      } else {
        navMenu.prepend(myCoursesLink);
      }
    }
  }

  // ==========================================
  // LOGIN → LOGOUT
  // ==========================================
  // ==========================================
  // LOGIN → LOGOUT
  // ==========================================

  const navLinks = navMenu.querySelectorAll("a");

  navLinks.forEach(function (link) {
    const text = link.textContent.trim();

    // ==========================================
    // LOGGED-IN USER
    // ==========================================

    if (token && (text === "Login" || text === "Logout")) {
      link.textContent = "Logout";
      link.href = "#";

      link.addEventListener("click", function (event) {
        event.preventDefault();

        localStorage.removeItem("hvacToken");
        localStorage.removeItem("hvacCurrentUser");
        localStorage.removeItem("hvacRememberMe");
        localStorage.removeItem("hvacRedirectAfterLogin");

        window.location.href = "../index.html";
      });
    }
  });
});
