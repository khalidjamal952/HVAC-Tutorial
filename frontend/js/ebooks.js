const API_BASE_URL = "https://hvac-tutorial.onrender.com";

const ebooksGrid = document.getElementById("ebooksGrid");

const ebooksEmpty = document.getElementById("ebooksEmpty");

const ebookSearch = document.getElementById("ebookSearch");

let allEbooks = [];

// =========================================
// LOAD E-BOOKS FROM BACKEND
// =========================================

async function loadEbooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ebooks`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load E-Books.");
    }

    allEbooks = data.ebooks || [];

    renderEbooks(allEbooks);
  } catch (error) {
    console.error("Load E-Books Error:", error);

    if (ebooksGrid) {
      ebooksGrid.innerHTML = `
        <div class="ebooks-error">
          <div class="empty-icon">⚠️</div>
          <h3>Unable to Load E-Books</h3>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }
}

// =========================================
// RENDER E-BOOKS
// =========================================

function renderEbooks(ebooks) {
  if (!ebooksGrid) return;

  ebooksGrid.innerHTML = "";

  if (ebooksEmpty) {
    ebooksEmpty.style.display = ebooks.length === 0 ? "block" : "none";
  }

  if (ebooks.length === 0) {
    return;
  }

  ebooks.forEach(function (ebook) {
    const fileUrl = `${API_BASE_URL}${ebook.filePath}`;

    const card = document.createElement("article");

    card.className = "ebook-card";

    card.innerHTML = `
      <div class="ebook-cover">
        <div class="ebook-pdf-icon">
          📕
        </div>

        <span class="ebook-file-type">
          PDF
        </span>
      </div>

      <div class="ebook-card-content">

        <span class="ebook-category">
          ${escapeHtml(ebook.category)}
        </span>

        <h3>
          ${escapeHtml(ebook.title)}
        </h3>

        <p>
          ${escapeHtml(ebook.description)}
        </p>

        <div class="ebook-meta">

          <span>
            📄 ${escapeHtml(ebook.type || "PDF")}
          </span>

          <span>
            ${
              Number(ebook.price || 0) === 0
                ? "Free"
                : "₹" + Number(ebook.price)
            }
          </span>

        </div>
<div class="ebook-actions">
  <button
    type="button"
    class="ebook-buy-btn"
    data-ebook-id="${ebook._id}"
  >
    💳 Buy Now
  </button>

</div>

      </div>
    `;

    ebooksGrid.appendChild(card);
  });
  setupEbookBuyButtons();
}

function setupEbookBuyButtons() {
  const buyButtons = document.querySelectorAll(".ebook-buy-btn");

  buyButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const ebookId = button.dataset.ebookId;

      const token = localStorage.getItem("hvacToken");

      if (!token) {
        alert("Please login before purchasing an E-Book.");
        window.location.href = "login.html";
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ebook-purchases/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              ebookId: ebookId,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Unable to create payment order.");
          return;
        }

        console.log("E-Book Order Created:", data.order);
        const options = {
          key: "rzp_test_Th1CmeN7wn6UYo",
          amount: data.order.amount,
          currency: data.order.currency,
          name: "HVAC Tutorial",
          description: "E-Book Purchase",
          order_id: data.order.id,

          handler: async function (response) {
            console.log("E-Book Payment Response:", response);
          },

          theme: {
           color: "#0d6efd",
          },
        };

        const razorpay = new Razorpay(options);
        razorpay.open();
      } catch (error) {
        console.error("E-Book Payment Error:", error);
        alert("Unable to connect to payment server.");
      }
    });
  });
}
// =========================================
// SEARCH
// =========================================

if (ebookSearch) {
  ebookSearch.addEventListener("input", function () {
    const searchText = ebookSearch.value.trim().toLowerCase();

    const filtered = allEbooks.filter(function (ebook) {
      return (
        String(ebook.title || "")
          .toLowerCase()
          .includes(searchText) ||
        String(ebook.description || "")
          .toLowerCase()
          .includes(searchText) ||
        String(ebook.category || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

    renderEbooks(filtered);
  });
}

// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================
// INITIAL LOAD
// =========================================

loadEbooks();
