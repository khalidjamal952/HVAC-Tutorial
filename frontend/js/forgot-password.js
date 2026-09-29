// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

const forgotEmail = document.getElementById("forgotEmail");

const forgotMessage = document.getElementById("forgotMessage");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = forgotEmail.value.trim().toLowerCase();

    if (!email) {
      forgotMessage.textContent = "Please enter your email address.";
      forgotMessage.className = "auth-message error";
      return;
    }

    try {
      const response = await fetch(
        "https://hvac-tutorial.onrender.com/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        forgotMessage.textContent =
          data.message || "Unable to process password reset request.";

        forgotMessage.className = "auth-message error";

        return;
      }

      forgotMessage.textContent =
        data.message || "Password reset link generated successfully.";

      forgotMessage.className = "auth-message success";

      // Development testing:
      // Open the generated reset URL directly
      if (data.resetUrl) {
        setTimeout(function () {
          window.location.href = data.resetUrl;
        }, 1000);
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);

      forgotMessage.textContent =
        "Unable to connect to server. Please try again.";

      forgotMessage.className = "auth-message error";
    }
  });
}
