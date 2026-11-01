// const API_BASE_URL = "";
const API_BASE_URL = "";

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
          <div class="empty-icon">âš ï¸</div>
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

async function renderEbooks(ebooks) {
  if (!ebooksGrid) return;

  ebooksGrid.innerHTML = "";

  if (ebooksEmpty) {
    ebooksEmpty.style.display = ebooks.length === 0 ? "block" : "none";
  }

  if (ebooks.length === 0) return;

  for (const ebook of ebooks) {
    const isPurchased = await checkEbookPurchase(ebook._id);
    const supportDocuments = isPurchased
      ? await loadSupportDocuments(ebook._id)
      : [];

    const card = document.createElement("article");
    card.className = "ebook-card";

    const supportHTML = supportDocuments.length
      ? `
        <div class="ebook-support-section">
          <h4>Support Documents (${supportDocuments.length})</h4>
          <div class="ebook-support-list">
            ${supportDocuments.map((doc) => `
              <div class="ebook-support-item">
                <span class="ebook-support-name">
                  ${escapeHtml(doc.fileName)}
                </span>
                <div class="ebook-support-actions">
                  <button
                    type="button"
                    class="ebook-support-read-btn"
                    data-ebook-id="${escapeHtml(ebook._id)}"
                    data-document-id="${escapeHtml(doc.id)}"
                  >Read</button>
                  <button
                    type="button"
                    class="ebook-support-download-btn"
                    data-ebook-id="${escapeHtml(ebook._id)}"
                    data-document-id="${escapeHtml(doc.id)}"
                  >Download</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `
      : isPurchased
        ? `<p class="ebook-no-support-docs">No support documents available.</p>`
        : "";

    card.innerHTML = `
      <div class="ebook-cover">
        <div class="ebook-pdf-icon">&#128213;</div>
        <span class="ebook-file-type">PDF</span>
      </div>

      <div class="ebook-card-content">
        <span class="ebook-category">
          ${escapeHtml(ebook.category)}
        </span>

        <h3>${escapeHtml(ebook.title)}</h3>

        <p>${escapeHtml(ebook.description)}</p>

        <div class="ebook-meta">
          <span>&#128196; ${escapeHtml(ebook.type || "PDF")}</span>
          <span>
            ${
              Number(ebook.price || 0) === 0
                ? "Free"
                : "&#8377;" + Number(ebook.price)
            }
          </span>
        </div>

        <div class="ebook-actions">
          ${
            isPurchased
              ? `
                <button
                  type="button"
                  class="ebook-read-btn"
                  data-ebook-id="${escapeHtml(ebook._id)}"
                >&#128214; Read PDF</button>

                <button
                  type="button"
                  class="ebook-download-btn"
                  data-ebook-id="${escapeHtml(ebook._id)}"
                >&#11015; Download PDF</button>
              `
              : `
                <button
                  type="button"
                  class="ebook-buy-btn"
                  data-ebook-id="${escapeHtml(ebook._id)}"
                >&#128179; Buy Now</button>
              `
          }
        </div>

        ${supportHTML}
      </div>
    `;

    ebooksGrid.appendChild(card);
  }

  setupEbookBuyButtons();
  setupSupportDocumentButtons();
}


// =========================================
// LOAD PURCHASED SUPPORT DOCUMENTS
// =========================================

async function loadSupportDocuments(ebookId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ebook-purchases/${encodeURIComponent(ebookId)}/support-documents`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Support Documents Error:", data.message);
      return [];
    }

    return Array.isArray(data.documents) ? data.documents : [];
  } catch (error) {
    console.error("Load Support Documents Error:", error);
    return [];
  }
}


// =========================================
// SUPPORT DOCUMENT READ / DOWNLOAD
// =========================================

function setupSupportDocumentButtons() {
  document.querySelectorAll(".ebook-support-read-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openSupportDocument(button, "read");
    });
  });

  document.querySelectorAll(".ebook-support-download-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openSupportDocument(button, "download");
    });
  });
}

async function openSupportDocument(button, action) {
  const ebookId = button.dataset.ebookId;
  const documentId = button.dataset.documentId;

  // Open a tab immediately to avoid browser popup blocking.
  const newTab = action === "read"
    ? window.open("about:blank", "_blank")
    : null;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ebook-purchases/${encodeURIComponent(ebookId)}/support-documents/${encodeURIComponent(documentId)}?action=${action}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.url) {
      if (newTab) newTab.close();
      alert(data.message || "Unable to access support document.");
      return;
    }

    if (action === "read") {
      if (newTab) {
        newTab.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } else {
      const link = document.createElement("a");
      link.href = data.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
    }
  } catch (error) {
    if (newTab) newTab.close();
    console.error("Support Document Access Error:", error);
    alert("Unable to access support document.");
  }
}

async function checkEbookPurchase(ebookId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ebook-purchases/${ebookId}/purchased`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return false;
    }

    return data.purchased === true;
  } catch (error) {
    console.error("Check E-Book Purchase Error:", error);
    return false;
  }
}

function setupEbookBuyButtons() {
  const buyButtons = document.querySelectorAll(".ebook-buy-btn");

  buyButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const ebookId = button.dataset.ebookId;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ebook-purchases/create-order`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
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
          key: "rzp_live_SPznEaO8vuxFX1",
          amount: data.order.amount,
          currency: data.order.currency,
          name: "HVAC Tutorial",
          description: "E-Book Purchase",
          order_id: data.order.id,

          handler: async function (response) {
            console.log("E-Book Payment Response:", response);

            try {
              console.log("STARTING E-BOOK PAYMENT VERIFICATION...");

              const verifyResponse = await fetch(
                `${API_BASE_URL}/api/ebook-purchases/verify-payment`,
                {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                },
              );

              const verifyData = await verifyResponse.json();

              if (!verifyResponse.ok) {
                alert(verifyData.message || "Payment verification failed.");
                return;
              }

              console.log("E-Book Payment Verified:", verifyData);

              alert("Payment successful! E-Book purchased successfully.");
              renderEbooks(allEbooks);
            } catch (error) {
              console.error("E-Book Payment Verification Error:", error);
              alert("Unable to verify payment.");
            }
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

  const readButtons = document.querySelectorAll(".ebook-read-btn");
  const downloadButtons = document.querySelectorAll(".ebook-download-btn");

  // READ MAIN E-BOOK PDF
  readButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const ebookId = button.dataset.ebookId;
      const previewWindow = window.open("about:blank", "_blank");

      if (!previewWindow) {
        alert("Please allow pop-ups to read this PDF.");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ebook-purchases/${ebookId}/download`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.url) {
          throw new Error(data.message || "Unable to open E-Book.");
        }

        previewWindow.location.href = data.url;
      } catch (error) {
        console.error("Read E-Book Error:", error);
        previewWindow.close();
        alert(error.message || "Unable to open E-Book.");
      }
    });
  });

  // DOWNLOAD MAIN E-BOOK PDF
  downloadButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const ebookId = button.dataset.ebookId;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ebook-purchases/${ebookId}/download?action=download`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.url) {
          throw new Error(data.message || "Unable to download E-Book.");
        }

        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.fileName || "ebook.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Download E-Book Error:", error);
        alert(error.message || "Unable to download E-Book.");
      }
    });
  });
}
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


