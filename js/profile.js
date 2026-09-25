// ========================================
// PROFILE PAGE
// ========================================

const currentUser = JSON.parse(localStorage.getItem("hvacCurrentUser"));
if (currentUser && !currentUser.registeredAt) {
  const users = JSON.parse(localStorage.getItem("hvacUsers")) || [];

  const savedUser = users.find(function (user) {
    return user.id === currentUser.id;
  });

  if (savedUser && savedUser.registeredAt) {
    currentUser.registeredAt = savedUser.registeredAt;

    localStorage.setItem("hvacCurrentUser", JSON.stringify(currentUser));
  }
}

// If user is not logged in
if (!currentUser) {
  window.location.href = "login.html";
}

// Elements
const profileName = document.getElementById("profileName");

const profileEmail = document.getElementById("profileEmail");

const profileFullName = document.getElementById("profileFullName");

const profilePhone = document.getElementById("profilePhone");

const profileEmailInput = document.getElementById("profileEmailInput");

const profileCity = document.getElementById("profileCity");

const profileUserId = document.getElementById("profileUserId");

const profileRegisteredAt = document.getElementById("profileRegisteredAt");

const profileForm = document.getElementById("profileForm");

const logoutBtn = document.getElementById("logoutBtn");

// ========================================
// LOAD PROFILE DATA
// ========================================
// ========================================
// LOAD PROFILE FROM BACKEND
// ========================================

async function loadProfileFromBackend() {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/user/profile", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.user) {
      console.error("Profile fetch failed:", data);
      return;
    }

    const user = data.user;

    // Update local session
    localStorage.setItem("hvacCurrentUser", JSON.stringify(user));

    // Update currentUser object
    Object.assign(currentUser, user);

    // Load profile fields
    loadProfile();
  } catch (error) {
    console.error("Backend Profile Error:", error);
  }
}

function loadProfile() {
  if (!currentUser) {
    return;
  }

  // Summary
  if (profileName) {
    profileName.textContent = currentUser.name || "Student";
  }

  if (profileEmail) {
    profileEmail.textContent = currentUser.email || "-";
  }

  // Form
  if (profileFullName) {
    profileFullName.value = currentUser.name || "";
  }

  if (profilePhone) {
    profilePhone.value = currentUser.phone || "";
  }

  if (profileEmailInput) {
    profileEmailInput.value = currentUser.email || "";
  }

  if (profileCity) {
    profileCity.value = currentUser.city || "";
  }

  // Account information
  if (profileUserId) {
    profileUserId.textContent = currentUser.id || currentUser._id || "-";
  }

  if (profileRegisteredAt) {
    let registeredDate = null;

    if (currentUser.registeredAt) {
      registeredDate = new Date(currentUser.registeredAt);
    } else if (currentUser.createdAt) {
      registeredDate = new Date(currentUser.createdAt);
    }

    if (registeredDate && !isNaN(registeredDate.getTime())) {
      profileRegisteredAt.textContent = registeredDate.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      );
    } else {
      profileRegisteredAt.textContent = "-";
    }
  }
}

// ========================================
// SAVE PROFILE
// ========================================

if (profileForm) {
  profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const updatedName = profileFullName.value.trim();
    const updatedPhone = profilePhone.value.trim();
    const updatedEmail = profileEmailInput.value.trim();
    const updatedCity = profileCity.value.trim();

    if (!updatedName || !updatedEmail) {
      alert("Please enter your name and email.");
      return;
    }

    const token = localStorage.getItem("hvacToken");

    if (!token) {
      alert("Please login again.");
      window.location.href = "login.html";
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: updatedName,
          email: updatedEmail,
          phone: updatedPhone,
          city: updatedCity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Profile update failed.");
        return;
      }

      // Update local session
      localStorage.setItem("hvacCurrentUser", JSON.stringify(data.user));

      // Update current user object
      Object.assign(currentUser, data.user);

      // Update profile display
      if (profileName) {
        profileName.textContent = currentUser.name || "Student";
      }

      if (profileEmail) {
        profileEmail.textContent = currentUser.email || "-";
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile Update Error:", error);
      alert("Unable to update profile. Please try again.");
    }
  });
}

// ========================================
// LOGOUT
// ========================================

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("hvacCurrentUser");

    window.location.href = "login.html";
  });
}

// ========================================
// START
// ========================================

loadProfileFromBackend();
