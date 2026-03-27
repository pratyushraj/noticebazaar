const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const year = document.getElementById("year");
const leadModal = document.getElementById("leadModal");
const closeLeadModal = document.getElementById("closeLeadModal");
const leadForm = document.getElementById("leadForm");
const leadFormTriggers = document.querySelectorAll(".open-lead-form");

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

const openModal = () => {
  if (!leadModal) return;
  leadModal.classList.add("open");
  leadModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  if (!leadModal) return;
  leadModal.classList.remove("open");
  leadModal.setAttribute("aria-hidden", "true");
};

leadFormTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });
});

if (closeLeadModal) {
  closeLeadModal.addEventListener("click", closeModal);
}

if (leadModal) {
  leadModal.addEventListener("click", (event) => {
    if (event.target === leadModal) {
      closeModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const destination = String(formData.get("destination") || "").trim();
    const travelMonth = String(formData.get("travelMonth") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const enquiryText =
      `New Travel Enquiry%0A` +
      `Name: ${encodeURIComponent(name)}%0A` +
      `Phone: ${encodeURIComponent(phone)}%0A` +
      `Destination: ${encodeURIComponent(destination)}%0A` +
      `Travel Month: ${encodeURIComponent(travelMonth || "Not specified")}%0A` +
      `Message: ${encodeURIComponent(message || "Not specified")}`;

    window.open(`https://wa.me/919725425001?text=${enquiryText}`, "_blank");
    leadForm.reset();
    closeModal();
  });
}
