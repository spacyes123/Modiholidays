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

  const chatWidget = document.getElementById("chat-widget");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const chatToggles = document.querySelectorAll("[data-chat-toggle]");
  const chatClose = document.querySelector("[data-chat-close]");

  function addChatMessage(text, sender) {
    if (!chatMessages) return;
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function generatePlannerReply(prompt) {
    const lower = prompt.toLowerCase();
    if (/budget|cost|price|affordable|cheap/i.test(lower)) {
      return "For a budget-conscious trip, I’d look at short stay options in Kerala, Goa, or a smart Himachal itinerary with comfortable hotels and local activities.";
    }
    if (/family/i.test(lower)) {
      return "A family-friendly plan could include 3–5 nights in Kerala, Goa, or a hill station with easy sightseeing and kid-friendly activities.";
    }
    if (/international|abroad|dubai|maldives|bali|europe|singapore|thailand/i.test(lower)) {
      return "For an international trip, Bali, Thailand, Dubai and Singapore are strong options depending on your budget and travel window.";
    }
    if (/honeymoon|romantic|couple/i.test(lower)) {
      return "A romantic getaway often works well with Bali, Kerala backwaters, a Goa beach stay, or a scenic hill retreat for 3–5 nights.";
    }
    if (/pilgrimage|temple|darshan|spiritual|yatra/i.test(lower)) {
      return "Pilgrimage-friendly choices usually include comfortable stays and clear transit planning, with popular routes like Kedarnath, Shirdi, Dwarka, or Rajasthan circuits.";
    }
    if (/goa|kerala|himachal|rajasthan|leh|ladakh|shimla|uttarakhand/i.test(lower)) {
      return "That sounds like a great fit for a destination-led trip. I’d shortlist a 4–6 day route based on your preferred pace, weather and budget.";
    }
    if (/weekend|3 day|4 day|5 day|short trip/i.test(lower)) {
      return "A short trip works best with a compact route: one major destination, one scenic stop, and a comfortable hotel base.";
    }
    return "I’d suggest starting with your dates, travel style, and budget, then narrowing it to one or two destination ideas for a personalised plan.";
  }

  function openChat() {
    if (!chatWidget) return;
    chatWidget.classList.add("is-open");
    setTimeout(() => chatInput && chatInput.focus(), 100);
  }

  function closeChat() {
    if (!chatWidget) return;
    chatWidget.classList.remove("is-open");
  }

  chatToggles.forEach(button => {
    button.addEventListener("click", openChat);
  });

  if (chatClose) {
    chatClose.addEventListener("click", closeChat);
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const prompt = chatInput.value.trim();
      if (!prompt) return;
      addChatMessage(prompt, "user");
      chatInput.value = "";
      setTimeout(() => {
        addChatMessage(generatePlannerReply(prompt), "bot");
      }, 350);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chatWidget && chatWidget.classList.contains("is-open")) {
      closeChat();
    }
  });
})();

"}]} ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files  ivoq to=functions.push_files  Ari to=functions.push_files  Ari to=functions.push_files
