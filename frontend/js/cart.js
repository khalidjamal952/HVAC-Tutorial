// =========================================
// CART SYSTEM
// =========================================

const cartItemsContainer = document.getElementById("cartItems");

const emptyCart = document.getElementById("emptyCart");

const cartCount = document.getElementById("cartCount");

const cartSubtotal = document.getElementById("cartSubtotal");

const cartTotal = document.getElementById("cartTotal");

const checkoutBtn = document.getElementById("checkoutBtn");

// =========================================
// GET CART
// =========================================

function getCart() {
  return JSON.parse(localStorage.getItem("hvacCart")) || [];
}

// =========================================
// SAVE CART
// =========================================

function saveCart(cart) {
  localStorage.setItem("hvacCart", JSON.stringify(cart));
}

// =========================================
// GET NUMERIC PRICE
// =========================================

function getPrice(price) {
  return Number(String(price).replace("₹", "").replace(",", "").trim()) || 0;
}

// =========================================
// DISPLAY CART
// =========================================

function displayCart() {
  const cart = getCart();

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    emptyCart.style.display = "block";

    cartCount.textContent = "0";
    cartSubtotal.textContent = "₹0";
    cartTotal.textContent = "₹0";

    checkoutBtn.disabled = true;

    checkoutBtn.style.opacity = "0.5";
    checkoutBtn.style.cursor = "not-allowed";

    return;
  }

  emptyCart.style.display = "none";

  checkoutBtn.disabled = false;

  checkoutBtn.style.opacity = "1";
  checkoutBtn.style.cursor = "pointer";

  let total = 0;

  cart.forEach(function (course, index) {
    const price = getPrice(course.price);

    total += price;

    const cartItem = document.createElement("div");

    cartItem.className = "cart-item";

    cartItem.innerHTML = `

            <div class="cart-item-image">
                🔧
            </div>

            <div class="cart-item-content">

                <h3>
                    ${course.title}
                </h3>

                <p>
                    HVAC Tutorial Course
                </p>

            </div>

            <div class="cart-item-price">

                <strong>
                    ₹${price}
                </strong>

                <button
                    type="button"
                    class="remove-cart-btn"
                    data-index="${index}">
                    Remove
                </button>

            </div>

        `;

    cartItemsContainer.appendChild(cartItem);
  });

  cartCount.textContent = cart.length;

  cartSubtotal.textContent = `₹${total}`;

  cartTotal.textContent = `₹${total}`;

  // =========================================
  // REMOVE COURSE
  // =========================================

  const removeButtons = document.querySelectorAll(".remove-cart-btn");

  removeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const index = Number(button.dataset.index);

      const cart = getCart();

      cart.splice(index, 1);

      saveCart(cart);

      displayCart();
    });
  });
}

// =========================================
// CHECKOUT BUTTON
// =========================================

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function () {
    const cart = getCart();

    if (cart.length === 0) {
      alert("Your cart is empty.");

      return;
    }

    window.location.href = "checkout.html";
  });
}

// =========================================
// INITIAL LOAD
// =========================================

displayCart();
