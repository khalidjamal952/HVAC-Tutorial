document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/youtube-videos";

  const elements = {
    total: document.getElementById("youtubeVideoTotal"),
    addButton: document.getElementById("addYoutubeVideoBtn"),
    search: document.getElementById("youtubeVideoSearch"),
    tableBody: document.getElementById("youtubeVideosTableBody"),
    empty: document.getElementById("youtubeVideosEmpty"),
    modal: document.getElementById("youtubeVideoModal"),
    modalTitle: document.getElementById("youtubeVideoModalTitle"),
    closeModal: document.getElementById("closeYoutubeVideoModal"),
    form: document.getElementById("youtubeVideoForm"),
    title: document.getElementById("youtubeVideoTitle"),
    url: document.getElementById("youtubeVideoUrl"),
    description: document.getElementById("youtubeVideoDescription"),
    order: document.getElementById("youtubeVideoOrder"),
    active: document.getElementById("youtubeVideoActive"),
    featured: document.getElementById("youtubeVideoFeatured"),
    preview: document.getElementById("youtubeVideoPreview"),
    cancel: document.getElementById("cancelYoutubeVideoBtn"),
    save: document.getElementById("saveYoutubeVideoBtn")
  };

  let videos = [];
  let editingId = null;

  const getYouTubeId = (value) => {
    try {
      const parsed = new URL(value.trim());
      const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
      let id = "";

      if (host === "youtu.be") {
        id = parsed.pathname.split("/").filter(Boolean)[0] || "";
      } else if (host === "youtube.com" || host === "m.youtube.com") {
        if (parsed.pathname === "/watch") {
          id = parsed.searchParams.get("v") || "";
        } else {
          const parts = parsed.pathname.split("/").filter(Boolean);
          if (["embed", "shorts"].includes(parts[0])) {
            id = parts[1] || "";
          }
        }
      }

      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const makeButton = (text, className, handler) => {
    const button = createElement("button", className, text);
    button.type = "button";
    button.addEventListener("click", handler);
    return button;
  };

  const showModal = () => {
    elements.modal?.classList.add("active");
  };

  const closeModal = () => {
    elements.modal?.classList.remove("active");
    elements.form?.reset();
    editingId = null;
    if (elements.preview) elements.preview.removeAttribute("src");
    if (elements.save) {
      elements.save.disabled = false;
      elements.save.textContent = "Save Video";
    }
  };

  const updatePreview = () => {
    if (!elements.preview) return;

    const id = getYouTubeId(elements.url.value);
    elements.preview.src = id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : "";
  };

  const openAddModal = () => {
    editingId = null;
    elements.form.reset();
    elements.modalTitle.textContent = "Add YouTube Video";
    elements.order.value = videos.length;
    elements.active.checked = true;
    elements.featured.checked = false;
    elements.preview.removeAttribute("src");
    elements.save.textContent = "Save Video";
    showModal();
  };

  const openEditModal = (video) => {
    editingId = video._id;
    elements.modalTitle.textContent = "Edit YouTube Video";
    elements.title.value = video.title || "";
    elements.url.value = video.youtubeUrl || "";
    elements.description.value = video.description || "";
    elements.order.value = video.displayOrder ?? 0;
    elements.active.checked = Boolean(video.isActive);
    elements.featured.checked = Boolean(video.isFeatured);
    updatePreview();
    elements.save.textContent = "Update Video";
    showModal();
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed. Please try again.");
    }

    return data;
  };

  const renderVideos = () => {
    const searchTerm = elements.search.value.trim().toLowerCase();
    const filtered = videos.filter((video) =>
      `${video.title || ""} ${video.description || ""}`
        .toLowerCase()
        .includes(searchTerm)
    );

    elements.tableBody.replaceChildren();
    elements.total.textContent = String(videos.length);
    elements.empty.hidden = filtered.length > 0;

    filtered.forEach((video) => {
      const row = document.createElement("tr");

      const thumbnailCell = document.createElement("td");
      const thumbnail = document.createElement("img");
      thumbnail.src = `https://img.youtube.com/vi/${encodeURIComponent(video.youtubeId)}/default.jpg`;
      thumbnail.alt = "YouTube thumbnail";
      thumbnail.loading = "lazy";
      thumbnail.style.width = "90px";
      thumbnail.style.height = "55px";
      thumbnail.style.objectFit = "cover";
      thumbnailCell.appendChild(thumbnail);

      const titleCell = createElement("td");
      titleCell.appendChild(createElement("strong", "", video.title || "Untitled"));

      const featuredCell = createElement(
        "td",
        "",
        video.isFeatured ? "Yes ★" : "No"
      );

      const statusCell = createElement(
        "td",
        "",
        video.isActive ? "Visible" : "Hidden"
      );

      const orderCell = createElement("td", "", String(video.displayOrder ?? 0));

      const actionsCell = createElement("td", "youtube-video-actions");

      actionsCell.append(
        makeButton("Edit", "student-action-btn", () => openEditModal(video)),
        makeButton(video.isActive ? "Hide" : "Show", "student-action-btn", () =>
          toggleVideo(video, { isActive: !video.isActive })
        ),
        makeButton(
          video.isFeatured ? "Unfeature" : "Feature",
          "student-action-btn",
          () => toggleVideo(video, { isFeatured: !video.isFeatured })
        ),
        makeButton("Delete", "student-action-btn", () => deleteVideo(video))
      );

      row.append(
        thumbnailCell,
        titleCell,
        featuredCell,
        statusCell,
        orderCell,
        actionsCell
      );

      elements.tableBody.appendChild(row);
    });
  };

  const loadVideos = async () => {
    try {
      const data = await request("/admin");
      videos = Array.isArray(data) ? data : data.videos || [];
      renderVideos();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleVideo = async (video, changes) => {
    try {
      await request(`/admin/${encodeURIComponent(video._id)}`, {
        method: "PUT",
        body: JSON.stringify(changes)
      });
      await loadVideos();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteVideo = async (video) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) {
      return;
    }

    try {
      await request(`/admin/${encodeURIComponent(video._id)}`, {
        method: "DELETE"
      });
      await loadVideos();
    } catch (error) {
      alert(error.message);
    }
  };

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const youtubeId = getYouTubeId(elements.url.value);

    if (!youtubeId) {
      alert("Please enter a valid YouTube video URL.");
      return;
    }

    const payload = {
      title: elements.title.value.trim(),
      youtubeUrl: elements.url.value.trim(),
      description: elements.description.value.trim(),
      displayOrder: Number(elements.order.value) || 0,
      isActive: elements.active.checked,
      isFeatured: elements.featured.checked
    };

    if (!payload.title) {
      alert("Please enter the video title.");
      return;
    }

    elements.save.disabled = true;
    elements.save.textContent = "Saving...";

    try {
      const path = editingId
        ? `/admin/${encodeURIComponent(editingId)}`
        : "/admin";

      await request(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      closeModal();
      await loadVideos();
      alert(editingId ? "Video updated successfully." : "Video added successfully.");
    } catch (error) {
      alert(error.message);
    } finally {
      elements.save.disabled = false;
      elements.save.textContent = editingId ? "Update Video" : "Save Video";
    }
  });

  elements.addButton.addEventListener("click", openAddModal);
  elements.closeModal.addEventListener("click", closeModal);
  elements.cancel.addEventListener("click", closeModal);
  elements.search.addEventListener("input", renderVideos);
  elements.url.addEventListener("input", updatePreview);

  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });

  loadVideos();
});

