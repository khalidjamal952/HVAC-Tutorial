const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetOtpForm = document.getElementById("resetOtpForm");
const newPasswordForm = document.getElementById("newPasswordForm");

const forgotEmail = document.getElementById("forgotEmail");
const resetOtp = document.getElementById("resetOtp");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const forgotMessage = document.getElementById("forgotMessage");
const resendResetOtp = document.getElementById("resendResetOtp");
const resetResendMessage = document.getElementById("resetResendMessage");

let resetEmail = "";
let resendTimer = null;

function showMessage(message, type = "error") {
  forgotMessage.textContent = message;
  forgotMessage.className = `auth-message ${type}`;
}

function startResetResendCountdown(seconds = 30) {
  clearInterval(resendTimer);

  let remaining = seconds;
  resendResetOtp.disabled = true;
  resendResetOtp.textContent = `Resend OTP (${remaining}s)`;

  resendTimer = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      clearInterval(resendTimer);
      resendResetOtp.disabled = false;
      resendResetOtp.textContent = "Resend OTP";
      return;
    }

    resendResetOtp.textContent = `Resend OTP (${remaining}s)`;
  }, 1000);
}

// STEP 1: SEND OTP
forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  resetEmail = forgotEmail.value.trim().toLowerCase();

  if (!resetEmail) {
    showMessage("Please enter your registered email.");
    return;
  }

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Unable to send OTP.");
      return;
    }

    forgotPasswordForm.style.display = "none";
    resetOtpForm.style.display = "block";

    showMessage(
      data.message || "Please check your email for the OTP.",
      "success",
    );
    startResetResendCountdown(30);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    showMessage("Server error. Please try again.");
  }
});

// STEP 2: VERIFY OTP
resetOtpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const otp = resetOtp.value.trim();

  if (!/^\d{6}$/.test(otp)) {
    showMessage("Please enter a valid 6-digit OTP.");
    return;
  }

  try {
    const response = await fetch("/api/auth/verify-reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Invalid or expired OTP.");
      return;
    }

    resetOtpForm.style.display = "none";
    newPasswordForm.style.display = "block";

    showMessage("OTP verified successfully. Set your new password.", "success");
  } catch (error) {
    console.error("OTP Verification Error:", error);
    showMessage("Server error. Please try again.");
  }
});

// STEP 3: RESET PASSWORD
newPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = newPassword.value;
  const confirm = confirmPassword.value;

  if (password !== confirm) {
    showMessage("New password and confirm password do not match.");
    return;
  }

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    showMessage(
      "Password must contain 8 characters, uppercase, lowercase, number and special character.",
    );
    return;
  }

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Unable to reset password.");
      return;
    }

    showMessage(
      "Password reset successfully! Redirecting to login...",
      "success",
    );

    newPasswordForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("Reset Password Error:", error);
    showMessage("Server error. Please try again.");
  }
});

resendResetOtp.addEventListener("click", async () => {
  if (!resetEmail) {
    showMessage("Please enter your email again.");
    return;
  }

  try {
    resendResetOtp.disabled = true;

    const response = await fetch("/api/auth/resend-reset-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: resetEmail,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Unable to resend OTP.");
      startResetResendCountdown(30);
      return;
    }

    resetOtp.value = "";

    showMessage(
      data.message || "A new OTP has been sent to your email.",
      "success",
    );

    startResetResendCountdown(30);
  } catch (error) {
    console.error("Resend OTP Error:", error);
    showMessage("Server error. Please try again.");
    resendResetOtp.disabled = false;
    resendResetOtp.textContent = "Resend OTP";
  }
});
