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
      navMenu.classList.contains("active") ? "OPEN" : "CLOSED"
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

    if (
      !navMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
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

    const cart =
        JSON.parse(localStorage.getItem("hvacCart")) || [];

    const cartCountElements =
        document.querySelectorAll(".cart-count");

    cartCountElements.forEach(function (element) {
        element.textContent = cart.length;
    });
}

updateCartCount();