// =========================================
// LOGIN SYSTEM
// =========================================

const loginForm = document.getElementById("loginForm");

// =========================================
// FORM SUBMIT
// =========================================

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // =========================================
    // GET FORM VALUES
    // =========================================

    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("loginPassword").value;

    const rememberMe = document.getElementById("rememberMe").checked;

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!email || !password) {
      alert("Please enter your email and password.");

      return;
    }

  
    // =========================================
    // LOGIN WITH BACKEND
    // =========================================

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      // =========================================
      // LOGIN ERROR
      // =========================================

      if (!response.ok) {
        alert(data.message || "Invalid email or password.");
        return;
      }

      // =========================================
      // SAVE JWT TOKEN
      // =========================================

      localStorage.setItem("hvacToken", data.token);

      // =========================================
      // SAVE CURRENT USER
      // =========================================

      const currentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
      };

      localStorage.setItem("hvacCurrentUser", JSON.stringify(currentUser));

      // =========================================
      // SUCCESS
      // =========================================

      alert(`Welcome back, ${data.user.name}!`);

      if (rememberMe) {
        localStorage.setItem("hvacRememberMe", "true");
      } else {
        localStorage.removeItem("hvacRememberMe");
      }

      // =========================================
      // REDIRECT AFTER LOGIN
      // =========================================

      const redirectAfterLogin = localStorage.getItem("hvacRedirectAfterLogin");

      if (redirectAfterLogin) {
        localStorage.removeItem("hvacRedirectAfterLogin");
        window.location.href = redirectAfterLogin;
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("Login Error:", error);

      alert("Unable to connect to server. Please try again.");
    }
  
  });
}

// ========================================
// SHOW / HIDE LOGIN PASSWORD
// ========================================

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
