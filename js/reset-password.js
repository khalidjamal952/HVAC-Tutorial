// ========================================
// RESET PASSWORD
// ========================================

const resetPasswordForm = document.getElementById("resetPasswordForm");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const resetMessage = document.getElementById("resetMessage");

// Get email saved during forgot password
const resetEmail = sessionStorage.getItem("hvacResetEmail");

// If no email is available, go back
if (!resetEmail) {
  alert("Please start the password reset process again.");

  window.location.href = "forgot-password.html";
}

// ========================================
// RESET PASSWORD
// ========================================

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const password = newPassword.value;

    const confirm = confirmPassword.value;

    // Check password length
    if (password.length < 6) {
      resetMessage.textContent = "Password must be at least 6 characters.";

      resetMessage.className = "auth-message error";

      return;
    }

    // Check passwords match
    if (password !== confirm) {
      resetMessage.textContent = "Passwords do not match.";

      resetMessage.className = "auth-message error";

      return;
    }

    // Get users
    const users = JSON.parse(localStorage.getItem("hvacUsers")) || [];

    // Find user
    const userIndex = users.findIndex(function (user) {
      return (
        user.email && user.email.toLowerCase() === resetEmail.toLowerCase()
      );
    });

    if (userIndex === -1) {
      resetMessage.textContent = "Account not found.";

      resetMessage.className = "auth-message error";

      return;
    }

    // Update password
    users[userIndex].password = password;

    // Save updated users
    localStorage.setItem("hvacUsers", JSON.stringify(users));

    // Remove temporary reset email
    sessionStorage.removeItem("hvacResetEmail");

    resetMessage.textContent =
      "Password reset successfully! Redirecting to login...";

    resetMessage.className = "auth-message success";

    // Go to login
    setTimeout(function () {
      window.location.href = "login.html";
    }, 1500);
  });
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
