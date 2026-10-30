// =========================================
// LOGIN SYSTEM
// =========================================

const loginForm = document.getElementById("loginForm");

let loginEmailForOtp = "";
let rememberMeForOtp = false;

// =========================================
// RESEND LOGIN OTP
// =========================================

const resendOtpButton = document.getElementById("resendLoginOtp");
const resendOtpMessage = document.getElementById("resendOtpMessage");

let resendCountdown = null;

function startResendCountdown(seconds = 30) {
  if (!resendOtpButton) return;

  clearInterval(resendCountdown);

  let remaining = seconds;

  resendOtpButton.disabled = true;
  resendOtpButton.textContent = `Resend OTP (${remaining}s)`;

  resendCountdown = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      clearInterval(resendCountdown);
      resendOtpButton.disabled = false;
      resendOtpButton.textContent = "Resend OTP";
      return;
    }

    resendOtpButton.textContent = `Resend OTP (${remaining}s)`;
  }, 1000);
}

if (resendOtpButton) {
  resendOtpButton.addEventListener("click", async function () {
    if (!loginEmailForOtp) return;

    try {
      resendOtpButton.disabled = true;

      if (resendOtpMessage) {
        resendOtpMessage.textContent = "Sending new OTP...";
      }

      const response = await fetch("/api/auth/resend-login-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmailForOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.remainingSeconds) {
          startResendCountdown(data.remainingSeconds);
        } else {
          resendOtpButton.disabled = false;
        }

        if (resendOtpMessage) {
          resendOtpMessage.textContent =
            data.message || "Unable to resend OTP.";
        }

        return;
      }

      if (resendOtpMessage) {
        resendOtpMessage.textContent = data.message;
      }

      const otpInput = document.getElementById("loginOtp");
      if (otpInput) otpInput.value = "";

      startResendCountdown(30);
    } catch (error) {
      console.error("Resend OTP Error:", error);

      resendOtpButton.disabled = false;

      if (resendOtpMessage) {
        resendOtpMessage.textContent = "Unable to connect. Please try again.";
      }
    }
  });
}

// =========================================
// LOGIN FORM SUBMIT - SEND OTP
// =========================================

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("loginPassword").value;

    const rememberMe = document.getElementById("rememberMe").checked;

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"], input[type="submit"]',
    );

    try {
      if (submitButton) submitButton.disabled = true;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid email or password.");
        return;
      }

      if (!data.otpRequired) {
        alert("Unexpected server response. Please try again.");
        return;
      }

      loginEmailForOtp = email;
      rememberMeForOtp = rememberMe;
      startResendCountdown(30);

      // Hide login form
      loginForm.style.display = "none";

      // Show OTP form
      const otpForm = document.getElementById("loginOtpForm");

      if (otpForm) {
        otpForm.style.display = "block";
      } else {
        alert("OTP form is not available. Please contact support.");
        loginForm.style.display = "";
      }

      alert("OTP sent to your registered email address.");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Unable to connect to server. Please try again.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// =========================================
// VERIFY LOGIN OTP
// =========================================

const loginOtpForm = document.getElementById("loginOtpForm");

if (loginOtpForm) {
  loginOtpForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const otpInput = document.getElementById("loginOtp");
    const otp = otpInput?.value.trim();

    if (!loginEmailForOtp || !otp || !/^\d{6}$/.test(otp)) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    const submitButton = loginOtpForm.querySelector(
      'button[type="submit"], input[type="submit"]',
    );

    try {
      if (submitButton) submitButton.disabled = true;

      const response = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmailForOtp,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "OTP verification failed.");
        return;
      }

      if (!data.token || !data.user) {
        alert("Invalid server response. Please try again.");
        return;
      }

      // Save JWT token only after OTP verification
      localStorage.setItem("hvacToken", data.token);

      const currentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
      };

      localStorage.setItem("hvacCurrentUser", JSON.stringify(currentUser));

      if (rememberMeForOtp) {
        localStorage.setItem("hvacRememberMe", "true");
      } else {
        localStorage.removeItem("hvacRememberMe");
      }

      alert(`Welcome back, ${data.user.name}!`);

      const redirectAfterLogin = localStorage.getItem("hvacRedirectAfterLogin");

      if (redirectAfterLogin) {
        localStorage.removeItem("hvacRedirectAfterLogin");
        window.location.href = redirectAfterLogin;
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      alert("Unable to verify OTP. Please try again.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// =========================================
// SHOW / HIDE LOGIN PASSWORD
// =========================================

const passwordToggle = document.getElementById("passwordToggle");
const loginPassword = document.getElementById("loginPassword");

if (passwordToggle && loginPassword) {
  passwordToggle.addEventListener("click", function () {
    if (loginPassword.type === "password") {
      loginPassword.type = "text";
      passwordToggle.textContent = "🙈";
      passwordToggle.setAttribute("aria-label", "Hide password");
    } else {
      loginPassword.type = "password";
      passwordToggle.textContent = "👁️";
      passwordToggle.setAttribute("aria-label", "Show password");
    }
  });
}
