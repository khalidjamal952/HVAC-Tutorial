// =========================================
// AUTH GUARD
// =========================================

const token = localStorage.getItem("hvacToken");

if (!token) {

    // Save the current page
    const currentPage =
        window.location.pathname +
        window.location.search;

    localStorage.setItem(
        "hvacRedirectAfterLogin",
        currentPage
    );

    // Redirect to login
    window.location.href = "login.html";
}