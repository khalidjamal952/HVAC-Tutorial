// =========================================
// ORDER SUCCESS
// =========================================

const successOrderId = document.getElementById("successOrderId");
const successPayment = document.getElementById("successPayment");
const successTotal = document.getElementById("successTotal");

// =========================================
// LAST ORDER
// =========================================

let lastOrder = null;

// =========================================
// LOAD LAST ORDER FROM BACKEND
// =========================================

async function loadLastOrder() {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

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

    if (!response.ok) {
      console.error("Orders Fetch Error:", data.message);
      return;
    }

    const orders = data.orders || [];

    // Backend sends latest order first
    if (orders.length > 0) {
      lastOrder = orders[0];
      displayOrder();
    } else {
      console.log("No orders found.");
    }
  } catch (error) {
    console.error("Backend Orders Error:", error);
  }
}

// =========================================
// DISPLAY ORDER
// =========================================

function displayOrder() {
  if (!lastOrder) {
    return;
  }

  // =========================================
  // ORDER ID
  // =========================================

  if (successOrderId) {
    successOrderId.textContent =
      lastOrder.razorpayOrderId || lastOrder._id || "N/A";
  }

  // =========================================
  // TOTAL
  // =========================================

  if (successTotal) {
    successTotal.textContent = `₹${lastOrder.total || 0}`;
  }

  // =========================================
  // PAYMENT METHOD
  // =========================================

  if (successPayment) {
    let paymentName = "Online Payment";

    if (lastOrder.paymentMethod === "upi") {
      paymentName = "UPI";
    } else if (lastOrder.paymentMethod === "card") {
      paymentName = "Credit / Debit Card";
    } else if (lastOrder.paymentMethod === "netbanking") {
      paymentName = "Net Banking";
    } else if (lastOrder.paymentMethod === "wallet") {
      paymentName = "Wallet";
    }

    successPayment.textContent = paymentName;
  }
}

// =========================================
// INITIAL LOAD
// =========================================

loadLastOrder();
