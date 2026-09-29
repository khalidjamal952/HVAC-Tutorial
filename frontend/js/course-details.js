// =========================================
// COURSE DETAILS DATA
// =========================================

const courses = {
  "hvac-fundamentals": {
    title: "HVAC Fundamentals",
    category: "Air Conditioning",
    icon: "❄️",
    description:
      "Learn the fundamentals of HVAC systems, components, cooling principles and basic operation.",
    rating: "4.8",
    students: "125+",
    lessons: "25",
    hours: "6",
    price: "₹499",
    oldPrice: "₹999",
  },

  "air-conditioning": {
    title: "Air Conditioning Basics",
    category: "Air Conditioning",
    icon: "🧊",
    description:
      "Understand AC components, refrigeration cycle, cooling process and basic AC operation.",
    rating: "4.7",
    students: "98+",
    lessons: "20",
    hours: "5",
    price: "₹599",
    oldPrice: "₹1,199",
  },

  refrigeration: {
    title: "Refrigeration Fundamentals",
    category: "Refrigeration",
    icon: "🧊",
    description:
      "Learn refrigeration cycles, compressors, condensers, evaporators and refrigerants.",
    rating: "4.9",
    students: "143+",
    lessons: "30",
    hours: "8",
    price: "₹699",
    oldPrice: "₹1,499",
  },

  "hvac-electrical": {
    title: "HVAC Electrical & Controls",
    category: "Electrical",
    icon: "⚡",
    description:
      "Understand HVAC wiring, electrical components, controls and basic troubleshooting.",
    rating: "4.8",
    students: "87+",
    lessons: "22",
    hours: "6",
    price: "₹799",
    oldPrice: "₹1,599",
  },

  "installation-service": {
    title: "HVAC Installation & Service",
    category: "Installation & Service",
    icon: "🔧",
    description:
      "Learn practical HVAC installation, servicing procedures, tools, maintenance and safety practices.",
    rating: "4.9",
    students: "156+",
    lessons: "35",
    hours: "10",
    price: "₹899",
    oldPrice: "₹1,799",
  },

  troubleshooting: {
    title: "HVAC Troubleshooting",
    category: "Installation & Service",
    icon: "🛠️",
    description:
      "Identify common HVAC problems, diagnose faults and understand practical troubleshooting methods.",
    rating: "4.8",
    students: "112+",
    lessons: "28",
    hours: "7",
    price: "₹749",
    oldPrice: "₹1,499",
  },
};

// =========================================
// GET COURSE ID FROM URL
// =========================================

const urlParams = new URLSearchParams(window.location.search);

const courseId = urlParams.get("id");

let course = null;

async function loadCourseDetails() {
  const response = await fetch(
    "https://hvac-tutorial.onrender.com/api/courses",
  );

  const data = await response.json();

  if (!response.ok || !Array.isArray(data.courses)) {
    alert("Unable to load courses.");
    return;
  }

  course = data.courses.find(function (item) {
    return item.id === courseId;
  });

  if (!course) {
    alert("Course not found.");
    window.location.href = "courses.html";
    return;
  }

  // =========================================
  // LOAD COURSE DETAILS
  // =========================================
  if (course) {
    document.title = `${course.title} | HVAC Tutorial`;

    const title = document.getElementById("courseTitle");

    const description = document.getElementById("courseDescription");

    const category = document.querySelector(".course-details-category");

    if (title) {
      title.textContent = course.title;
    }

    if (description) {
      description.textContent = course.description || "";
    }

    if (category) {
      category.textContent = course.category || "";
    }

    // Course Stats
    const stats = document.querySelectorAll(".course-details-stats div");

    if (stats.length >= 4) {
      stats[1].querySelector("strong").textContent =
        `👨‍🎓 ${course.students || 0}`;

      stats[2].querySelector("strong").textContent =
        `📚 ${course.lessons || 0}`;

      stats[3].querySelector("strong").textContent =
        `⏱️ ${course.duration || ""}`;
    }

    // Price
    const price = document.querySelector(".course-price-large strong");

    const oldPrice = document.querySelector(".course-price-large del");

    if (price) {
      price.textContent = `₹${course.price}`;
    }

    if (oldPrice) {
      oldPrice.textContent = `₹${course.originalPrice}`;
    }
  }
}

// =========================================
// ENROLL BUTTON
// =========================================

const enrollBtn = document.getElementById("enrollBtn");

if (enrollBtn) {
  enrollBtn.addEventListener("click", function () {
    if (!course) {
      alert("Course not found.");
      return;
    }

    alert(`${course.title} selected for enrollment.`);
  });
}

// =========================================
// ADD TO CART
// =========================================

const cartBtn = document.getElementById("cartBtn");

if (cartBtn) {
  cartBtn.addEventListener("click", function () {
    if (!course) {
      alert("Course not found.");
      return;
    }

    let cart = JSON.parse(localStorage.getItem("hvacCart")) || [];

    const alreadyAdded = cart.some((item) => item.id === courseId);

    if (alreadyAdded) {
      alert("This course is already in your cart.");

      return;
    }

    cart.push({
      id: courseId,
      title: course.title,
      price: course.price,
    });

    localStorage.setItem("hvacCart", JSON.stringify(cart));

    // Update cart count immediately
    updateCartCount();
    cartBtn.textContent = "✓ Added to Cart";

    alert(`${course.title} has been added to your cart.`);
  });
}

loadCourseDetails();
