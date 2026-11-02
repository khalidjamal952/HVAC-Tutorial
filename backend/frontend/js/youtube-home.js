document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("youtubeVideoGrid");
  if (!grid) return;

  const section = document.getElementById("youtube-videos");

  const getYouTubeId = (value) => {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      let id = "";

      if (host === "youtu.be") {
        id = url.pathname.split("/").filter(Boolean)[0] || "";
      } else if (host === "youtube.com" || host === "m.youtube.com") {
        if (url.pathname === "/watch") {
          id = url.searchParams.get("v") || "";
        } else {
          const parts = url.pathname.split("/").filter(Boolean);
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

  const createVideoCard = (video) => {
    const videoId = video.youtubeId || getYouTubeId(video.youtubeUrl);
    if (!videoId) return null;

    const card = createElement(
      "article",
      `youtube-video-card${video.isFeatured ? " featured" : ""}`
    );

    const thumbnail = createElement("div", "youtube-video-thumbnail");
    thumbnail.tabIndex = 0;
    thumbnail.setAttribute("role", "button");
    thumbnail.setAttribute("aria-label", `Play ${video.title}`);

    const image = document.createElement("img");
    image.src = `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    image.alt = video.title || "HVAC video tutorial";
    image.loading = "lazy";

    const play = createElement("span", "youtube-video-play", "▶");
    thumbnail.append(image, play);

    const playVideo = () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
      iframe.title = video.title || "HVAC video tutorial";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      thumbnail.replaceChildren(iframe);
      thumbnail.tabIndex = -1;
      thumbnail.removeAttribute("role");
    };

    thumbnail.addEventListener("click", playVideo);
    thumbnail.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        playVideo();
      }
    });

    const info = createElement("div", "youtube-video-info");

    if (video.isFeatured) {
      info.appendChild(
        createElement("span", "youtube-video-featured-label", "Featured Video")
      );
    }

    info.appendChild(
      createElement("h3", "", video.title || "HVAC Video Tutorial")
    );

    if (video.description) {
      const description = createElement(
        "p",
        "youtube-video-description",
        video.description
      );

      const readMore = createElement(
        "button",
        "youtube-read-more",
        "Read more"
      );

      readMore.type = "button";

      readMore.addEventListener("click", () => {
        const expanded = description.classList.toggle("expanded");
        readMore.textContent = expanded ? "Show less" : "Read more";
      });

      info.append(description, readMore);
    }

    card.append(thumbnail, info);
    return card;
  };

  try {
    const response = await fetch("/api/youtube-videos", {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error("Unable to load YouTube videos.");
    }

    const data = await response.json();
    const videos = Array.isArray(data) ? data : data.videos || [];

    const validVideos = videos
      .filter((video) => video.isActive !== false)
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return Number(b.isFeatured) - Number(a.isFeatured);
        }
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });

    const cards = validVideos.map(createVideoCard).filter(Boolean);

    if (!cards.length) {
      section.hidden = true;
      return;
    }

    grid.replaceChildren(...cards);
  } catch (error) {
    console.error("YouTube homepage error:", error);
    section.hidden = true;
  }
});

