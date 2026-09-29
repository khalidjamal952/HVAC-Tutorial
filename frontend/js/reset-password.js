// ========================================
// RESET PASSWORD
// ========================================

const resetPasswordForm = document.getElementById("resetPasswordForm");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const resetMessage = document.getElementById("resetMessage");

// ========================================
// STUDENT RESET PASSWORD
// ========================================

const urlParams = new URLSearchParams(
  window.location.search
);

const resetToken = urlParams.get("token");

// Check reset token
if (!resetToken) {
  alert("Invalid or missing password reset link.");

  window.location.href =
    "forgot-password.html";
}

// ========================================
// RESET PASSWORD
// ========================================

if (resetPasswordForm) {
  resetPasswordForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const password =
        newPassword.value;

      const confirm =
        confirmPassword.value;

      // Password length
      if (password.length < 8) {
        resetMessage.textContent =
          "Password must be at least 8 characters.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      // Uppercase
      if (!/[A-Z]/.test(password)) {
        resetMessage.textContent =
          "Password must contain at least one uppercase letter.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      // Lowercase
      if (!/[a-z]/.test(password)) {
        resetMessage.textContent =
          "Password must contain at least one lowercase letter.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      // Number
      if (!/[0-9]/.test(password)) {
        resetMessage.textContent =
          "Password must contain at least one number.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      // Special character
      if (
        !/[!@#$%^&*(),.?":{}|<>]/.test(
          password
        )
      ) {
        resetMessage.textContent =
          "Password must contain at least one special character.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      // Confirm password
      if (password !== confirm) {
        resetMessage.textContent =
          "Passwords do not match.";

        resetMessage.className =
          "auth-message error";

        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token: resetToken,
              password: password,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          resetMessage.textContent =
            data.message ||
            "Unable to reset password.";

          resetMessage.className =
            "auth-message error";

          return;
        }

        resetMessage.textContent =
          data.message ||
          "Password reset successfully! Redirecting to login...";

        resetMessage.className =
          "auth-message success";

        setTimeout(function () {
          window.location.href =
            "login.html";
        }, 1500);
      } catch (error) {
        console.error(
          "Student Reset Password Error:",
          error
        );

        resetMessage.textContent =
          "Unable to connect to server. Please try again.";

        resetMessage.className =
          "auth-message error";
      }
    }
  );
}

const newPasswordToggle = document.getElementById("newPasswordToggle");

const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");

if (newPassword && newPasswordToggle) {
  newPasswordToggle.addEventListener("click", function () {
    if (newPassword.type === "password") {
      newPassword.type = "text";

      newPasswordToggle.textContent = "🙈";

      newPasswordToggle.setAttribute("aria-label", "Hide password");
    } else {
      newPassword.type = "password";

      newPasswordToggle.textContent = "👁️";

      newPasswordToggle.setAttribute("aria-label", "Show password");
    }
  });
}

if (confirmPassword && confirmPasswordToggle) {
  confirmPasswordToggle.addEventListener("click", function () {
    if (confirmPassword.type === "password") {
      confirmPassword.type = "text";

      confirmPasswordToggle.textContent = "🙈";

      confirmPasswordToggle.setAttribute("aria-label", "Hide password");
    } else {
      confirmPassword.type = "password";

      confirmPasswordToggle.textContent = "👁️";

      confirmPasswordToggle.setAttribute("aria-label", "Show password");
    }
  });
}
