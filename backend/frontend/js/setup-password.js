// ========================================
// STUDENT PASSWORD SETUP
// ========================================

const setupPasswordForm = document.getElementById("setupPasswordForm");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const setupMessage = document.getElementById("setupMessage");

const newPasswordToggle = document.getElementById("newPasswordToggle");

const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");

// ========================================
// GET SETUP TOKEN
// ========================================

const urlParams = new URLSearchParams(window.location.search);

const setupToken = urlParams.get("token");

if (!setupToken) {
  alert("Invalid or missing password setup link.");

  window.location.href = "login.html";
}

// ========================================
// SHOW / HIDE PASSWORD
// ========================================

function setupPasswordToggle(input, button) {
  if (!input || !button) return;

  button.addEventListener("click", function () {
    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    button.textContent = isPassword ? "🙈" : "👁️";

    button.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
  });
}

setupPasswordToggle(newPassword, newPasswordToggle);

setupPasswordToggle(confirmPassword, confirmPasswordToggle);

// ========================================
// SUBMIT PASSWORD
// ========================================

if (setupPasswordForm) {
  setupPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const password = newPassword.value;

    const confirm = confirmPassword.value;

    setupMessage.textContent = "";

    setupMessage.className = "auth-message";

    // Password validation
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if (!strongPassword.test(password)) {
      setupMessage.textContent =
        "Password must contain at least 8 characters, uppercase, lowercase, number and special character.";

      setupMessage.className = "auth-message error";

      return;
    }

    // Confirm password
    if (password !== confirm) {
      setupMessage.textContent = "Passwords do not match.";

      setupMessage.className = "auth-message error";

      return;
    }

    const submitButton = setupPasswordForm.querySelector(
      'button[type="submit"]',
    );

    submitButton.disabled = true;

    submitButton.textContent = "Setting Password...";

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: setupToken,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to set password.");
      }

      setupMessage.textContent =
        "Password created successfully! Redirecting to login...";

      setupMessage.className = "auth-message success";

      setupPasswordForm.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (error) {
      setupMessage.textContent = error.message;

      setupMessage.className = "auth-message error";
    } finally {
      submitButton.disabled = false;

      submitButton.textContent = "Set Password";
    }
  });
}
