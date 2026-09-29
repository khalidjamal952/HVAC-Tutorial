const API_BASE_URL = "https://hvac-tutorial.onrender.com";

let coupons = [];
let courses = [];
let editingCouponId = null;

const couponModal = document.getElementById("couponModal");
const couponModalTitle = document.getElementById("couponModalTitle");
const couponForm = document.getElementById("couponForm");

const couponCode = document.getElementById("couponCode");
const couponDiscountType = document.getElementById("couponDiscountType");
const couponDiscountValue = document.getElementById("couponDiscountValue");
const couponMinOrder = document.getElementById("couponMinOrder");
const couponMaxDiscount = document.getElementById("couponMaxDiscount");
const couponStartDate = document.getElementById("couponStartDate");
const couponExpiryDate = document.getElementById("couponExpiryDate");
const couponUsageLimit = document.getElementById("couponUsageLimit");
const couponPerUserLimit = document.getElementById("couponPerUserLimit");
const couponCourse = document.getElementById("couponCourse");
const couponActive = document.getElementById("couponActive");

const addCouponBtn = document.getElementById("addCouponBtn");
const closeCouponModal = document.getElementById("closeCouponModal");
const cancelCouponBtn = document.getElementById("cancelCouponBtn");

const adminCouponsTableBody = document.getElementById("adminCouponsTableBody");

const adminCouponsEmpty = document.getElementById("adminCouponsEmpty");

const adminCouponTotal = document.getElementById("adminCouponTotal");

const adminCouponSearch = document.getElementById("adminCouponSearch");

/* =========================
   ADMIN TOKEN
========================= */

function getAdminToken() {
  return localStorage.getItem("hvacAdminToken");
}

/* =========================
   LOAD COURSES
========================= */

async function loadCoursesForCoupons() {
  const token = getAdminToken();

  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/courses`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Courses Fetch Error:", data.message);
      return;
    }

    courses = Array.isArray(data.courses) ? data.courses : [];

    couponCourse.innerHTML = '<option value="">All Courses</option>';

    courses.forEach(function (course) {
      const option = document.createElement("option");

      option.value = course.id;
      option.textContent = course.title;

      couponCourse.appendChild(option);
    });
  } catch (error) {
    console.error("Load Courses Error:", error);
  }
}

/* =========================
   LOAD COUPONS
========================= */

async function loadCoupons() {
  const token = getAdminToken();

  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/admin`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Coupons Fetch Error:", data.message);
      return;
    }

    coupons = Array.isArray(data.coupons) ? data.coupons : [];

    renderCoupons();
  } catch (error) {
    console.error("Load Coupons Error:", error);
  }
}

/* =========================
   RENDER COUPONS
========================= */

function renderCoupons() {
  const searchText = (adminCouponSearch.value || "").trim().toLowerCase();

  const filteredCoupons = coupons.filter(function (coupon) {
    return coupon.code.toLowerCase().includes(searchText);
  });

  adminCouponTotal.textContent = "Total Coupons: " + coupons.length;

  adminCouponsTableBody.innerHTML = "";

  if (filteredCoupons.length === 0) {
    adminCouponsEmpty.style.display = "block";
    return;
  }

  adminCouponsEmpty.style.display = "none";

  filteredCoupons.forEach(function (coupon) {
    const row = document.createElement("tr");

    const discountText =
      coupon.discountType === "percentage"
        ? `${coupon.discountValue}%`
        : `₹${coupon.discountValue}`;

    const usageText =
      coupon.usageLimit === null || coupon.usageLimit === undefined
        ? `${coupon.usedCount || 0} / Unlimited`
        : `${coupon.usedCount || 0} / ${coupon.usageLimit}`;

    const expiryDate = new Date(coupon.expiryDate).toLocaleDateString("en-IN");

    const statusText = coupon.active ? "Active" : "Inactive";

    row.innerHTML = `
      <td>
        <strong>${coupon.code}</strong>
      </td>

      <td>${discountText}</td>

      <td>₹${coupon.minOrderAmount || 0}</td>

      <td>${expiryDate}</td>

      <td>${usageText}</td>

      <td>${statusText}</td>

      <td>
        <button
          type="button"
          class="admin-secondary-btn edit-coupon-btn"
          data-id="${coupon._id}"
        >
          Edit
        </button>

        <button
          type="button"
          class="admin-danger-btn delete-coupon-btn"
          data-id="${coupon._id}"
        >
          Delete
        </button>
      </td>
    `;

    adminCouponsTableBody.appendChild(row);
  });
}

/* =========================
   OPEN MODAL
========================= */

function openCouponModal(coupon = null) {
  couponModal.style.display = "flex";

  if (coupon) {
    editingCouponId = coupon._id;

    couponModalTitle.textContent = "Edit Coupon";

    couponCode.value = coupon.code || "";
    couponDiscountType.value = coupon.discountType || "";

    couponDiscountValue.value = coupon.discountValue ?? "";

    couponMinOrder.value = coupon.minOrderAmount ?? 0;

    couponMaxDiscount.value = coupon.maxDiscount ?? "";

    couponStartDate.value = coupon.startDate
      ? coupon.startDate.substring(0, 10)
      : "";

    couponExpiryDate.value = coupon.expiryDate
      ? coupon.expiryDate.substring(0, 10)
      : "";

    couponUsageLimit.value = coupon.usageLimit ?? "";

    couponPerUserLimit.value = coupon.perUserLimit ?? 1;

    couponCourse.value =
      Array.isArray(coupon.courseIds) && coupon.courseIds.length > 0
        ? coupon.courseIds[0]
        : "";

    couponActive.value = coupon.active ? "true" : "false";
  } else {
    editingCouponId = null;

    couponModalTitle.textContent = "Add New Coupon";

    couponForm.reset();

    couponMinOrder.value = 0;
    couponPerUserLimit.value = 1;
    couponActive.value = "true";
  }
}

/* =========================
   CLOSE MODAL
========================= */

function closeCouponModalHandler() {
  couponModal.style.display = "none";
  editingCouponId = null;
  couponForm.reset();

  couponMinOrder.value = 0;
  couponPerUserLimit.value = 1;
  couponActive.value = "true";
}

/* =========================
   SAVE COUPON
========================= */

couponForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const token = getAdminToken();

  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  const selectedCourse = couponCourse.value.trim();

  const payload = {
    code: couponCode.value.trim().toUpperCase(),

    discountType: couponDiscountType.value,

    discountValue: Number(couponDiscountValue.value),

    minOrderAmount: Number(couponMinOrder.value || 0),

    maxDiscount:
      couponMaxDiscount.value === "" ? null : Number(couponMaxDiscount.value),

    startDate: couponStartDate.value || undefined,

    expiryDate: couponExpiryDate.value,

    usageLimit:
      couponUsageLimit.value === "" ? null : Number(couponUsageLimit.value),

    perUserLimit: Number(couponPerUserLimit.value || 1),

    courseIds: selectedCourse ? [selectedCourse] : [],

    active: couponActive.value === "true",
  };

  try {
    let response;

    if (editingCouponId) {
      response = await fetch(
        `${API_BASE_URL}/api/coupons/admin/${editingCouponId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(payload),
        },
      );
    } else {
      response = await fetch(`${API_BASE_URL}/api/coupons/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Unable to save coupon.");
      return;
    }

    alert(data.message || "Coupon saved successfully.");

    closeCouponModalHandler();
    await loadCoupons();
  } catch (error) {
    console.error("Save Coupon Error:", error);

    alert("Unable to connect to the backend.");
  }
});

/* =========================
   EDIT / DELETE
========================= */

adminCouponsTableBody.addEventListener("click", async function (event) {
  const editButton = event.target.closest(".edit-coupon-btn");

  const deleteButton = event.target.closest(".delete-coupon-btn");

  if (editButton) {
    const couponId = editButton.dataset.id;

    const coupon = coupons.find(function (item) {
      return item._id === couponId;
    });

    if (coupon) {
      openCouponModal(coupon);
    }
  }

  if (deleteButton) {
    const couponId = deleteButton.dataset.id;

    const coupon = coupons.find(function (item) {
      return item._id === couponId;
    });

    if (!coupon) {
      return;
    }

    const confirmed = confirm(`Delete coupon "${coupon.code}"?`);

    if (!confirmed) {
      return;
    }

    const token = getAdminToken();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/coupons/admin/${couponId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete coupon.");
        return;
      }

      alert(data.message || "Coupon deleted successfully.");

      await loadCoupons();
    } catch (error) {
      console.error("Delete Coupon Error:", error);

      alert("Unable to connect to the backend.");
    }
  }
});

/* =========================
   BUTTON EVENTS
========================= */

addCouponBtn.addEventListener("click", function () {
  openCouponModal();
});

closeCouponModal.addEventListener("click", closeCouponModalHandler);

cancelCouponBtn.addEventListener("click", closeCouponModalHandler);

adminCouponSearch.addEventListener("input", renderCoupons);

/* =========================
   INITIAL LOAD
========================= */

async function initializeCouponsPage() {
  await loadCoursesForCoupons();
  await loadCoupons();
}

initializeCouponsPage();
