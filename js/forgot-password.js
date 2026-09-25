// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

const forgotEmail = document.getElementById("forgotEmail");

const forgotMessage = document.getElementById("forgotMessage");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = forgotEmail.value.trim().toLowerCase();

    const users = JSON.parse(localStorage.getItem("hvacUsers")) || [];

    const user = users.find(function (item) {
      return item.email && item.email.toLowerCase() === email;
    });

    if (!user) {
      forgotMessage.textContent = "No account found with this email address.";

      forgotMessage.className = "auth-message error";

      return;
    }

    // Save email temporarily
    sessionStorage.setItem("hvacResetEmail", user.email);

    // Move to reset password page
    window.location.href = "reset-password.html";
  });
}
