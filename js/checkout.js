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
// FORM SUBMIT - RAZORPAY
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

    // BASIC VALIDATION
    if (!fullName || !email || !phone || !city || !address) {
      alert("Please fill in all required fields.");
      return;
    }

    if (phone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }

    // PAYMENT METHOD
    const paymentInput = document.querySelector(
      'input[name="payment"]:checked',
    );

    if (!paymentInput) {
      alert("Please select a payment method.");
      return;
    }

    // CALCULATE TOTAL
    let total = 0;

    cart.forEach(function (course) {
      total += getCheckoutPrice(course.price);
    });

    // GET TOKEN
    const token = localStorage.getItem("hvacToken");

    if (!token) {
      alert("Please login before making payment.");
      window.location.href = "login.html";
      return;
    }

    try {
      // =========================================
      // STEP 1 - CREATE RAZORPAY ORDER
      // =========================================

      const firstCourse = cart[0];

      const orderResponse = await fetch(
        "http://localhost:5000/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            amount: total,
            courseId: firstCourse.id,
            courseName: firstCourse.title,
          }),
        },
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        alert(orderData.message || "Unable to create payment order.");
        return;
      }

      const razorpayOrder = orderData.order;

      // =========================================
      // STEP 2 - OPEN RAZORPAY CHECKOUT
      // =========================================

      const options = {
        key: "rzp_test_Th1CmeN7wn6UYo",

        amount: razorpayOrder.amount,

        currency: "INR",

        name: "HVAC Tutorial",

        description: "HVAC Course Purchase",

        order_id: razorpayOrder.id,

        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },

        theme: {
          color: "#2563eb",
        },

        handler: async function (paymentResponse) {
          // =========================================
          // STEP 3 - VERIFY PAYMENT
          // =========================================

          try {
            const verifyResponse = await fetch(
              "http://localhost:5000/api/orders/razorpay/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,

                  razorpay_payment_id: paymentResponse.razorpay_payment_id,

                  razorpay_signature: paymentResponse.razorpay_signature,

                  customer: {
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
                }),
              },
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              alert(verifyData.message || "Payment verification failed.");
              return;
            }

            // =========================================
            // PAYMENT SUCCESS
            // =========================================

            localStorage.removeItem("hvacCart");

            alert("Payment successful!");

            window.location.href = "order-success.html";
          } catch (error) {
            console.error("Payment Verification Error:", error);

            alert(
              "Payment was completed, but verification failed. Please contact support.",
            );
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout closed.");
          },
        },
      };

      const razorpay = new Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error("Razorpay Payment Error:", error);

      alert("Unable to connect to payment gateway.");
    }
  });
}

// =========================================
// INITIAL LOAD
// =========================================

displayCheckout();
