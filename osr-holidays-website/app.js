const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const year = document.getElementById("year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}
