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

          <a
            href="${fileUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="ebook-view-btn"
          >
            👁 View PDF
          </a>

          <a
            href="${fileUrl}"
            download="${escapeHtml(ebook.fileName)}"
            class="ebook-download-btn"
          >
            ⬇ Download
          </a>

        </div>

      </div>
    `;

    ebooksGrid.appendChild(card);
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
