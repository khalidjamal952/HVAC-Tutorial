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
    themeToggle.textContent = "â˜€ï¸";
  }

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("hvacTheme", "dark");
      themeToggle.textContent = "â˜€ï¸";
    } else {
      localStorage.setItem("hvacTheme", "light");
      themeToggle.textContent = "\uD83C\uDF19";
    }
  });
}

// ========================================
// NAVBAR LOGIN / LOGOUT
// ========================================
document.addEventListener("DOMContentLoaded", async function () {
  const isLoggedIn = !!localStorage.getItem("hvacCurrentUser");

  const navMenu = document.querySelector(".nav-menu");

  if (!navMenu) {
    return;
  }

  // ==========================================
  // CHECK PURCHASED COURSES
  // ==========================================

  let hasPurchasedCourse = false;

  if (isLoggedIn) {
    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("hvacToken");
        localStorage.removeItem("hvacCurrentUser");
        localStorage.removeItem("hvacRememberMe");
        localStorage.removeItem("hvacRedirectAfterLogin");

        window.location.href = window.location.pathname.includes("/pages/")
          ? "login.html"
          : "pages/login.html";

        return;
      }
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

  if (isLoggedIn && hasPurchasedCourse) {
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

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (event) {
      event.preventDefault();

      logoutBtn.textContent = "Logging out...";
      logoutBtn.style.pointerEvents = "none";

      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Logout API failed:", response.status);
        }
      } catch (error) {
        console.error("Logout Error:", error);
      } finally {
        localStorage.removeItem("hvacToken");
        localStorage.removeItem("hvacCurrentUser");
        localStorage.removeItem("hvacRememberMe");
        localStorage.removeItem("hvacRedirectAfterLogin");

        window.location.href = "../index.html";
      }
    });
  }
});


// =========================================
// HVAC 3D MOUSE FOLLOW INTERACTION
// =========================================

document.addEventListener("DOMContentLoaded", function () {
  const card = document.querySelector(".hvac-card");

  if (!card) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  if (window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  card.addEventListener("mousemove", function (event) {
    const rect = card.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 22;
    const rotateX = (0.5 - y) * 22;

    card.style.animation = "none";
    card.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.03)`;
  });

  card.addEventListener("mouseleave", function () {
    card.style.transform = "";
    card.style.animation = "";
  });
});


// ========================================
// LIVE COURSE PURCHASE NOTIFICATIONS
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("purchaseNotification");
  const nameElement = document.getElementById("purchaseStudentName");
  const courseElement = document.getElementById("purchaseCourseName");
  const closeButton = document.getElementById("closePurchaseNotification");

  if (!popup || !nameElement || !courseElement) return;

  const seenPurchases = new Set();
  const notificationQueue = [];

  let isShowing = false;
  let hideTimer = null;

  function getPurchaseKey(item) {
    return [
      item.studentName,
      item.courseName,
      item.purchasedAt
    ].join("|");
  }

  function hideNotification() {
    popup.classList.remove("show");

    setTimeout(function () {
      popup.style.display = "none";
      isShowing = false;
      showNextNotification();
    }, 550);
  }

  function showNextNotification() {
    if (isShowing || notificationQueue.length === 0) return;

    const item = notificationQueue.shift();

    nameElement.textContent = item.studentName || "A student";
    courseElement.textContent = item.courseName || "a course";

    popup.style.display = "block";

    requestAnimationFrame(function () {
      popup.classList.add("show");
    });

    isShowing = true;

    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideNotification, 6500);
  }

  if (closeButton) {
    closeButton.addEventListener("click", function () {
      clearTimeout(hideTimer);
      hideNotification();
    });
  }

  async function loadPurchaseNotifications(isFirstLoad = false) {
    try {
      const response = await fetch(
        "/api/orders/recent-course-purchases",
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (!data.success || !Array.isArray(data.notifications)) return;

      const purchases = data.notifications
        .filter(function (item) {
          return item.studentName && item.courseName && item.purchasedAt;
        })
        .sort(function (a, b) {
          return new Date(b.purchasedAt) - new Date(a.purchasedAt);
        });

      if (isFirstLoad) {
        purchases.forEach(function (item) {
          seenPurchases.add(getPurchaseKey(item));
        });

        const latestPurchase = purchases[0];

        if (
          latestPurchase &&
          Date.now() - new Date(latestPurchase.purchasedAt).getTime()
            <= 24 * 60 * 60 * 1000
        ) {
          notificationQueue.push(latestPurchase);
          showNextNotification();
        }

        return;
      }

      const newPurchases = [];

      purchases.forEach(function (item) {
        const key = getPurchaseKey(item);

        if (!seenPurchases.has(key)) {
          seenPurchases.add(key);
          newPurchases.push(item);
        }
      });

      newPurchases.reverse().forEach(function (item) {
        notificationQueue.push(item);
      });

      showNextNotification();

    } catch (error) {
      console.error("Purchase Notification Error:", error);
    }
  }

  loadPurchaseNotifications(true);

  setInterval(function () {
    loadPurchaseNotifications(false);
  }, 30000);
});

