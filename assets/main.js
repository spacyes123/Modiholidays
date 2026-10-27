(() => {
  const config = window.MODI_HOLIDAYS_CONFIG || {};
  const waNumber = String(config.whatsappNumber || "").replace(/\D/g, "");
  const email = config.businessEmail || "hello@modiholidays.in";
  const phoneDisplay = config.businessPhoneDisplay || "Please configure the business phone number";
  const location = config.baseLocation || "Mumbai, Maharashtra, India";
  const currentPage = locationPathToPage(window.location.pathname);

  function locationPathToPage(path) {
    const last = path.split("/").filter(Boolean).pop() || "index.html";
    return last.endsWith(".html") ? last : (last === "" ? "index.html" : `${last}.html`);
  }

  function waReady() {
    return waNumber.length >= 10 && !waNumber.includes("XXXXXXXX");
  }

  function makeWaUrl(message) {
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(message) {
    if (!waReady()) {
      alert("The Modi Holidays WhatsApp number has not been configured yet. Please update assets/config.js before launch.");
      return;
    }
    window.open(makeWaUrl(message), "_blank", "noopener,noreferrer");
  }

  document.querySelectorAll("[data-whatsapp]").forEach((el) => {
    const message = el.getAttribute("data-message") || config.defaultMessage || "Hello Modi Holidays.";
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openWhatsApp(message);
    });
    if (waReady()) el.setAttribute("href", makeWaUrl(message));
    else el.setAttribute("href", "#");
  });

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll("[data-email]").forEach(el => {
    el.textContent = email;
    if (el.tagName.toLowerCase() === "a") el.href = `mailto:${email}`;
  });
  document.querySelectorAll("[data-phone]").forEach(el => el.textContent = phoneDisplay);
  document.querySelectorAll("[data-location]").forEach(el => el.textContent = location);

  const form = document.querySelector("#holiday-enquiry-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const pairs = [
        ["Name", data.get("name")],
        ["Email", data.get("email") || "Not provided"],
        ["Phone", data.get("phone")],
        ["Departure city", data.get("departureCity")],
        ["Destination / trip type", data.get("destination")],
        ["Travel dates", data.get("travelDates") || "Flexible"],
        ["Travellers", data.get("travellers")],
        ["Budget per person", data.get("budget") || "Not specified"],
        ["Preferences", data.get("preferences") || "Not specified"]
      ];
      const message = "Hello Modi Holidays, I'd like to plan a holiday.\n\n" +
        pairs.map(([key, value]) => `${key}: ${String(value || "").trim()}`).join("\n") +
        "\n\nPlease confirm availability and send a customised quote. I understand prices are confirmed manually.";
      openWhatsApp(message);
      const status = document.querySelector("#form-status");
      if (status) status.textContent = waReady()
        ? "WhatsApp is opening with your enquiry details. Please press Send in WhatsApp to submit your enquiry."
        : "Please configure the WhatsApp number in assets/config.js before using this form.";
    });
  }

  const currentLinks = document.querySelectorAll(".nav a");
  currentLinks.forEach(a => {
    const href = a.getAttribute("href");
    if (href === currentPage || (currentPage === "index.html" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
