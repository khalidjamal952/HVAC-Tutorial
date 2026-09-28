// =========================================
// REGISTER SYSTEM
// =========================================

const registerForm = document.getElementById("registerForm");

// =========================================
// FORM SUBMIT
// =========================================

if (registerForm) {
  registerForm.addEventListener("submit", async function  (event) {
    event.preventDefault();

    // =========================================
    // GET FORM VALUES
    // =========================================

    const name = document.getElementById("registerName").value.trim();

    const email = document
      .getElementById("registerEmail")
      .value.trim()
      .toLowerCase();

    const phone = document.getElementById("registerPhone").value.trim();

    const password = document.getElementById("registerPassword").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    const terms = document.getElementById("terms").checked;

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!name || !email || !phone || !password || !confirmPassword) {
      alert("Please fill in all required fields.");

      return;
    }

    // =========================================
    // PHONE VALIDATION
    // =========================================

    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");

      return;
    }

    // =========================================
    // PASSWORD LENGTH
    // =========================================

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");

      return;
    }

    // =========================================
    // PASSWORD MATCH
    // =========================================

    if (password !== confirmPassword) {
      alert("Passwords do not match.");

      return;
    }

    // =========================================
    // TERMS
    // =========================================

    if (!terms) {
      alert("Please accept the Terms & Conditions.");

      return;
    }

   
try {

    const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                password: password
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
    }

    // =========================================
    // SUCCESS
    // =========================================

    alert("Account created successfully!");

    window.location.href = "login.html";

} catch (error) {

    console.error("Registration Error:", error);

    alert(
        "Unable to connect to server. Please try again."
    );
}
   
  });
}

// ========================================
// SHOW / HIDE REGISTER PASSWORDS
// ========================================

const registerPassword = document.getElementById("registerPassword");

const registerPasswordToggle = document.getElementById(
  "registerPasswordToggle",
);

const confirmPassword = document.getElementById("confirmPassword");

const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");

if (registerPassword && registerPasswordToggle) {
  registerPasswordToggle.addEventListener("click", function () {
    if (registerPassword.type === "password") {
      registerPassword.type = "text";

      registerPasswordToggle.textContent = "🙈";

      registerPasswordToggle.setAttribute("aria-label", "Hide password");
    } else {
      registerPassword.type = "password";

      registerPasswordToggle.textContent = "👁️";

      registerPasswordToggle.setAttribute("aria-label", "Show password");
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
