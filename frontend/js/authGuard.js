// =========================================
// AUTH GUARD
// =========================================
const token = localStorage.getItem("hvacToken");

function checkAuthentication() {
  const currentToken = localStorage.getItem("hvacToken");

  if (!currentToken) {
    const currentPage = window.location.pathname + window.location.search;

    localStorage.setItem("hvacRedirectAfterLogin", currentPage);

    window.location.replace("login.html");
  }
}

checkAuthentication();

window.addEventListener("pageshow", function () {
  checkAuthentication();
});
