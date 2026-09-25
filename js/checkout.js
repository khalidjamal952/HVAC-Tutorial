// =========================================
// CHECKOUT SYSTEM
// =========================================

const checkoutForm = document.getElementById("checkoutForm");

const checkoutItems = document.getElementById("checkoutItems");

const checkoutSubtotal = document.getElementById("checkoutSubtotal");

const checkoutTotal = document.getElementById("checkoutTotal");

// =========================================
// GET CART
// =========================================

function getCheckoutCart() {
  return JSON.parse(localStorage.getItem("hvacCart")) || [];
}

// =========================================
// GET PRICE
// =========================================

function getCheckoutPrice(price) {
  return Number(String(price).replace("₹", "").replace(",", "").trim()) || 0;
}

// =========================================
// DISPLAY ORDER SUMMARY
// =========================================

function displayCheckout() {
  const cart = getCheckoutCart();

  checkoutItems.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    checkoutItems.innerHTML = `
            <p class="checkout-empty">
                Your cart is empty.
            </p>
        `;

    checkoutSubtotal.textContent = "₹0";
    checkoutTotal.textContent = "₹0";

    return;
  }

  cart.forEach(function (course) {
    const price = getCheckoutPrice(course.price);

    total += price;

    const item = document.createElement("div");

    item.className = "checkout-item";

    item.innerHTML = `

            <h3>
                ${course.title}
            </h3>

            <strong>
                ₹${price}
            </strong>

        `;

    checkoutItems.appendChild(item);
  });

  checkoutSubtotal.textContent = `₹${total}`;

  checkoutTotal.textContent = `₹${total}`;
}

// =========================================
// FORM SUBMIT
// =========================================

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const cart = getCheckoutCart();

    if (cart.length === 0) {
      alert("Your cart is empty. Please add a course first.");

      window.location.href = "courses.html";

      return;
    }

    const fullName = document.getElementById("fullName").value.trim();

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const city = document.getElementById("city").value.trim();

    const address = document.getElementById("address").value.trim();

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!fullName || !email || !phone || !city || !address) {
      alert("Please fill in all required fields.");

      return;
    }

    if (phone.length < 10) {
      alert("Please enter a valid phone number.");

      return;
    }

    // =========================================
    // GET PAYMENT METHOD
    // =========================================

    const paymentInput = document.querySelector(
      'input[name="payment"]:checked',
    );

    if (!paymentInput) {
      alert("Please select a payment method.");

      return;
    }

    // =========================================
    // CALCULATE TOTAL
    // =========================================

    let total = 0;

    cart.forEach(function (course) {
      total += getCheckoutPrice(course.price);
    });

    // =========================================
    // GET JWT TOKEN
    // =========================================

    const token = localStorage.getItem("hvacToken");

    if (!token) {
      alert("Please login before placing an order.");

      window.location.href = "login.html";

      return;
    }

    // =========================================
    // CREATE ORDER DATA
    // =========================================

    const orderData = {
      customer: {
        fullName: fullName,

        email: email,

        phone: phone,

        city: city,

        address: address,
      },

      courses: cart.map(function (course) {
        return {
          id: course.id,

          title: course.title,

          price: getCheckoutPrice(course.price),
        };
      }),

      total: total,

      paymentMethod: paymentInput.value,
    };

    // =========================================
    // SEND ORDER TO BACKEND
    // =========================================

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: "Bearer " + token,
        },

        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      // =========================================
      // HANDLE ERROR
      // =========================================

      if (!response.ok) {
        alert(data.message || "Order could not be placed.");

        return;
      }

      // =========================================
      // CLEAR CART
      // =========================================

      // Save latest order for success page
      const savedOrders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

      savedOrders.push({
        orderId: data.order?.orderId || data.orderId || "HVAC" + Date.now(),

        customer: orderData.customer,
        courses: orderData.courses,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
      });

      localStorage.setItem("hvacOrders", JSON.stringify(savedOrders));
      localStorage.removeItem("hvacCart");

      // =========================================
      // SUCCESS MESSAGE
      // =========================================

      alert("Order placed successfully!");

      // =========================================
      // REDIRECT
      // =========================================

      window.location.href = "order-success.html";
    } catch (error) {
      console.error("Order Error:", error);

      alert("Unable to connect to server. Please try again.");
    }
  });
}

// =========================================
// INITIAL LOAD
// =========================================

displayCheckout();
