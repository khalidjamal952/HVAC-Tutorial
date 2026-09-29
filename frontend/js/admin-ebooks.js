const API_BASE_URL = "https://hvac-tutorial.onrender.com";

// =========================================
// ELEMENTS
// =========================================

const ebookTableBody = document.getElementById("ebooksTableBody");

const ebookTotal = document.getElementById("ebookTotal");

const ebookSearch = document.getElementById("ebookSearch");

const ebookModal = document.getElementById("ebookModal");

const ebookForm = document.getElementById("ebookForm");

const addEbookBtn = document.getElementById("addEbookBtn");

const closeEbookModal = document.getElementById("closeEbookModal");

const cancelEbookBtn = document.getElementById("cancelEbookBtn");

const ebookModalTitle = document.getElementById("ebookModalTitle");

const ebookIdInput = document.getElementById("ebookId");

const ebookTitle = document.getElementById("ebookTitle");

const ebookDescription = document.getElementById("ebookDescription");

const ebookCategory = document.getElementById("ebookCategory");

const ebookPrice = document.getElementById("ebookPrice");

const ebookFile = document.getElementById("ebookFile");

let allEbooks = [];

// =========================================
// ADMIN TOKEN
// =========================================

function getAdminToken() {
  return localStorage.getItem("hvacAdminToken");
}

// =========================================
// LOAD E-BOOKS
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

    if (ebookTableBody) {
      ebookTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            Unable to load E-Books.
          </td>
        </tr>
      `;
    }
  }
}

// =========================================
// RENDER E-BOOKS
// =========================================

function renderEbooks(ebooks) {
  if (!ebookTableBody) return;

  ebookTableBody.innerHTML = "";

  if (ebookTotal) {
    ebookTotal.textContent = ebooks.length;
  }

  if (ebooks.length === 0) {
    ebookTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          No E-Books found.
        </td>
      </tr>
    `;

    return;
  }

  ebooks.forEach(function (ebook) {
    const row = document.createElement("tr");

    const fileUrl = `${API_BASE_URL}${ebook.filePath}`;

    row.innerHTML = `
      <td>
        <strong>${escapeHtml(ebook.title)}</strong>
      </td>

      <td>
        ${escapeHtml(ebook.category)}
      </td>

      <td>
        ${escapeHtml(ebook.type || "PDF")}
      </td>

      <td>
        ₹${Number(ebook.price || 0)}
      </td>

      <td>
        <span class="status-badge">
          ${escapeHtml(ebook.status || "Active")}
        </span>
      </td>

      <td>
        <div class="ebook-actions">

          <a
            href="${fileUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-view-btn"
          >
            View
          </a>

          <button
            type="button"
            class="admin-edit-btn"
            data-id="${ebook._id}"
          >
            Edit
          </button>

          <button
            type="button"
            class="admin-delete-btn"
            data-id="${ebook._id}"
          >
            Delete
          </button>

        </div>
      </td>
    `;

    ebookTableBody.appendChild(row);
  });

  // Edit buttons
  const editButtons = ebookTableBody.querySelectorAll(".admin-edit-btn");

  editButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      editEbook(button.dataset.id);
    });
  });

  // Delete buttons
  const deleteButtons = ebookTableBody.querySelectorAll(".admin-delete-btn");

  deleteButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      deleteEbook(button.dataset.id);
    });
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
// OPEN ADD MODAL
// =========================================

function openAddEbookModal() {
  if (!ebookModal || !ebookForm) return;

  ebookForm.reset();

  if (ebookIdInput) {
    ebookIdInput.value = "";
  }

  if (ebookModalTitle) {
    ebookModalTitle.textContent = "Add E-Book";
  }

  ebookModal.style.setProperty("display", "flex", "important");
}

// =========================================
// CLOSE MODAL
// =========================================

function closeEbookModalWindow() {
  if (!ebookModal) return;

  ebookModal.style.setProperty("display", "none", "important");

  if (ebookForm) {
    ebookForm.reset();
  }

  if (ebookIdInput) {
    ebookIdInput.value = "";
  }
}

// =========================================
// ADD BUTTON
// =========================================

if (addEbookBtn) {
  addEbookBtn.addEventListener("click", openAddEbookModal);
}

// =========================================
// CLOSE BUTTONS
// =========================================

if (closeEbookModal) {
  closeEbookModal.addEventListener("click", closeEbookModalWindow);
}

if (cancelEbookBtn) {
  cancelEbookBtn.addEventListener("click", closeEbookModalWindow);
}

// =========================================
// EDIT E-BOOK
// =========================================

async function editEbook(id) {
  const ebook = allEbooks.find(function (item) {
    return item._id === id;
  });

  if (!ebook) {
    alert("E-Book not found.");
    return;
  }

  if (ebookIdInput) {
    ebookIdInput.value = ebook._id;
  }

  ebookTitle.value = ebook.title || "";

  ebookDescription.value = ebook.description || "";

  ebookCategory.value = ebook.category || "";

  ebookPrice.value = ebook.price || 0;

  ebookFile.value = "";

  if (ebookModalTitle) {
    ebookModalTitle.textContent = "Edit E-Book";
  }

  ebookModal.style.setProperty("display", "flex", "important");
}

// =========================================
// SUBMIT ADD / EDIT
// =========================================

if (ebookForm) {
  ebookForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = getAdminToken();

    if (!token) {
      alert("Admin session expired. Please login again.");

      window.location.href = "admin-login.html";

      return;
    }

    const title = ebookTitle.value.trim();

    const description = ebookDescription.value.trim();

    const category = ebookCategory.value.trim();

    const price = ebookPrice.value || 0;

    const file = ebookFile.files[0];

    const ebookId = ebookIdInput.value.trim();

    if (!title || !description || !category) {
      alert("Please fill all required fields.");

      return;
    }

    // New E-Book must have PDF
    if (!ebookId && !file) {
      alert("Please select a PDF file.");

      return;
    }

    // Check PDF
    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();

      if (extension !== "pdf" || file.type !== "application/pdf") {
        alert("Only PDF files are allowed.");

        return;
      }

      // 20 MB limit
      if (file.size > 20 * 1024 * 1024) {
        alert("PDF size must be less than 20 MB.");

        return;
      }
    }

    const formData = new FormData();

    formData.append("title", title);

    formData.append("description", description);

    formData.append("category", category);

    formData.append("price", price);

    if (file) {
      formData.append("pdf", file);
    }

    try {
      const url = ebookId
        ? `${API_BASE_URL}/api/ebooks/${ebookId}`
        : `${API_BASE_URL}/api/ebooks`;

      const method = ebookId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,

        headers: {
          Authorization: "Bearer " + token,
        },

        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "E-Book could not be saved.");

        return;
      }

      alert(
        ebookId
          ? "E-Book updated successfully!"
          : "E-Book uploaded successfully!",
      );

      closeEbookModalWindow();

      await loadEbooks();
    } catch (error) {
      console.error("Save E-Book Error:", error);

      alert("Unable to connect to server.");
    }
  });
}

// =========================================
// DELETE E-BOOK
// =========================================

async function deleteEbook(id) {
  const confirmed = confirm("Are you sure you want to delete this E-Book?");

  if (!confirmed) {
    return;
  }

  const token = getAdminToken();

  if (!token) {
    alert("Admin session expired. Please login again.");

    window.location.href = "admin-login.html";

    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/ebooks/${id}`, {
      method: "DELETE",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "E-Book could not be deleted.");

      return;
    }

    alert("E-Book deleted successfully!");

    await loadEbooks();
  } catch (error) {
    console.error("Delete E-Book Error:", error);

    alert("Unable to connect to server.");
  }
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
// MODAL OUTSIDE CLICK
// =========================================

if (ebookModal) {
  ebookModal.addEventListener("click", function (event) {
    if (event.target === ebookModal) {
      closeEbookModalWindow();
    }
  });
}

// =========================================
// LOAD E-BOOKS
// =========================================

loadEbooks();
