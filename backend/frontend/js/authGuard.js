// =========================================
// AUTH GUARD - HTTP ONLY COOKIE AUTH
// =========================================

async function checkAuthentication() {
  try {
    const response = await fetch("/api/user/profile", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const currentPage = window.location.pathname + window.location.search;

      localStorage.setItem("hvacRedirectAfterLogin", currentPage);

      window.location.replace("login.html");
    }
  } catch (error) {
    console.error("Authentication Check Error:", error);

    window.location.replace("login.html");
  }
}

// Initial authentication check
checkAuthentication();

// Check again when page is restored from browser cache
window.addEventListener("pageshow", function () {
  checkAuthentication();
});
