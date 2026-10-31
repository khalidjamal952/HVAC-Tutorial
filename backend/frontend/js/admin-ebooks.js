const API_BASE_URL = "";

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

const ebookSelectedFile = document.getElementById("ebookSelectedFile");
const ebookSelectedFileName = document.getElementById("ebookSelectedFileName");
const ebookSelectedFileSize = document.getElementById("ebookSelectedFileSize");

if (ebookFile) {
  ebookFile.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
      ebookSelectedFile.style.display = "none";
      return;
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    ebookSelectedFileName.textContent = file.name;
    ebookSelectedFileSize.textContent = `${fileSizeMB} MB`;
    ebookSelectedFile.style.display = "flex";
  });
}

let allEbooks = [];

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
        \u20B9${Number(ebook.price || 0)}
      </td>

      <td>
        <span class="status-badge">
          ${escapeHtml(ebook.status || "Active")}
        </span>
      </td>

      <td>
        <div class="ebook-actions">

          <button type="button" class="admin-view-btn" data-id="${ebook._id}">
            View
          </button>

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

  // View E-Book PDF securely
  const viewButtons = ebookTableBody.querySelectorAll(".admin-view-btn");

  viewButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      const ebookId = button.dataset.id;
      const pdfWindow = window.open("", "_blank");

      if (!pdfWindow) {
        alert("Please allow pop-ups to preview the PDF.");
        return;
      }

      try {
        pdfWindow.document.write("Loading PDF preview...");

        const response = await fetch(
          `${API_BASE_URL}/api/ebooks/admin/${ebookId}/preview`,
          {
            method: "GET",
            credentials: "include"
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load PDF preview.");
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await response.json();

          if (!data.url) {
            throw new Error("PDF preview URL not received.");
          }

          pdfWindow.location.href = data.url;
        } else {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          pdfWindow.location.href = blobUrl;
        }
      } catch (error) {
        pdfWindow.close();
        alert(error.message || "PDF preview failed.");
        console.error("E-book preview error:", error);
      }
    });
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

    // const token = getAdminToken();

    // if (!token) {
    //   alert("Admin session expired. Please login again.");

    //   window.location.href = "admin-login.html";

    //   return;
    // }

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

    // New E-Book must have a supported file
    if (!ebookId && !file) {
      alert("Please select a supported file.");
      return;
    }

    // Validate supported file formats
    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();

      const allowedExtensions = [
        "pdf", "doc", "docx", "ppt", "pptx",
        "xls", "xlsx", "jpg", "jpeg", "png",
        "zip", "dwg", "dxf", "dwt", "dwf"
      ];

      if (!allowedExtensions.includes(extension)) {
        alert("Unsupported file format. Please select an allowed file.");
        return;
      }

      // Maximum 300 MB
      if (file.size > 300 * 1024 * 1024) {
        alert("File size must be 300 MB or less.");
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

      const progressContainer = document.getElementById("ebookUploadProgress");
      const progressBar = document.getElementById("ebookProgressBar");
      const progressPercent = document.getElementById("ebookUploadPercent");
      const progressStatus = document.getElementById("ebookUploadStatus");

      if (progressContainer) progressContainer.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";
      if (progressPercent) progressPercent.textContent = "0%";
      if (progressStatus) progressStatus.textContent = "Starting upload...";

      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(method, url);
        xhr.withCredentials = true;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);

            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressPercent) progressPercent.textContent = `${percent}%`;

            if (progressStatus) {
              progressStatus.textContent =
                percent === 100 ? "Processing file on server..." : "Uploading file...";
            }
          }
        });

        xhr.onload = () => {
          let data = {};

          try {
            data = JSON.parse(xhr.responseText);
          } catch (error) {
            data = { message: "Invalid server response." };
          }

          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            data,
          });
        };

        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.onabort = () => reject(new Error("Upload cancelled."));

        xhr.send(formData);
      });

      const data = uploadResult.data;

      if (!uploadResult.ok) {
        if (progressStatus) progressStatus.textContent = "Upload failed.";
        alert(data.message || "E-Book could not be saved.");
        return;
      }

      if (progressBar) progressBar.style.width = "100%";
      if (progressPercent) progressPercent.textContent = "100%";
      if (progressStatus) progressStatus.textContent = "Upload completed successfully!";

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

  const response = await fetch(`${API_BASE_URL}/api/ebooks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/ebooks/${id}`, {
      method: "DELETE",

      credentials: "include",
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








