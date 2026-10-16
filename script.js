(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("site-header");
  const navToggle = document.getElementById("nav-toggle");
  const siteNav = document.getElementById("site-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const brandLink = document.querySelector(".brand");
  const sectionIds = ["home", "about", "experience", "projects", "skills", "certifications", "education", "contact"];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const progressBar = document.querySelector(".scroll-progress__bar");
  const typedEl = document.getElementById("typed-text");
  const offlineBadge = document.getElementById("offline-badge");
  const roles = ["Cyber Security Student", "Full-Stack Developer", "Penetration Testing Enthusiast"];

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (y / docHeight) * 100 : 0;
    progressBar.style.width = progress + "%";

    updateActiveNav();
  }

  function updateActiveNav() {
    const offset = header.offsetHeight + 48;
    let current = sectionIds[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top - offset <= 0) {
        current = section.id;
      }
    }

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + current;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function smoothScrollTo(target) {
    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  navLinks.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      smoothScrollTo(target);
      closeNav();
    });
  });

  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      closeNav();
    });
  }

  function closeNav() {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
  }

  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tickType() {
    if (!typedEl) return;

    if (prefersReducedMotion) {
      typedEl.textContent = roles[0];
      return;
    }

    const current = roles[roleIndex];
    if (!deleting) {
      typedEl.textContent = current.slice(0, charIndex + 1);
      charIndex += 1;
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tickType, 1800);
        return;
      }
      setTimeout(tickType, 70);
    } else {
      typedEl.textContent = current.slice(0, charIndex - 1);
      charIndex -= 1;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(tickType, 400);
        return;
      }
      setTimeout(tickType, 35);
    }
  }

  tickType();

  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submit-button");
  const formStatus = document.getElementById("form-status");
  const OFFLINE_MSG =
    "You're offline. Please reconnect to send a message, or email me directly.";

  function setFormStatus(text, type) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.classList.remove("is-error", "is-success");
    if (type === "error") formStatus.classList.add("is-error");
    if (type === "success") formStatus.classList.add("is-success");
  }

  function setOfflineUI(isOffline) {
    if (offlineBadge) {
      offlineBadge.hidden = !isOffline;
    }
    if (submitBtn) {
      submitBtn.disabled = isOffline;
    }
    if (isOffline && formStatus) {
      setFormStatus(OFFLINE_MSG, "error");
    } else if (formStatus && formStatus.textContent === OFFLINE_MSG) {
      setFormStatus("", "");
    }
  }

  setOfflineUI(!navigator.onLine);
  window.addEventListener("online", () => setOfflineUI(false));
  window.addEventListener("offline", () => setOfflineUI(true));

  function submitWeb3Form(formEl, onSuccess, onError) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", formEl.action);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = function () {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          onSuccess();
        } else {
          onError(data.message || "Submission failed.");
        }
      } catch (err) {
        onError("Submission failed.");
      }
    };
    xhr.onerror = function () {
      onError("Network error. Please check your connection.");
    };
    xhr.send(new FormData(formEl));
  }

  if (form && submitBtn) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!navigator.onLine) {
        setFormStatus(OFFLINE_MSG, "error");
        return;
      }

      const name = form.querySelector("#name");
      const email = form.querySelector("#email");
      const message = form.querySelector("#message");

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        setFormStatus("Please fill in all fields.", "error");
        return;
      }

      setFormStatus("", "");
      submitBtn.disabled = true;
      submitBtn.classList.remove("is-success");
      submitBtn.classList.add("is-loading");

      submitWeb3Form(
        form,
        () => {
          submitBtn.classList.remove("is-loading");
          submitBtn.classList.add("is-success");
          setFormStatus("Message sent successfully. I will get back to you soon.", "success");
          form.reset();
          setTimeout(() => {
            submitBtn.classList.remove("is-success");
            submitBtn.disabled = !navigator.onLine;
            setFormStatus("", "");
          }, 4000);
        },
        (msg) => {
          submitBtn.classList.remove("is-loading");
          submitBtn.disabled = !navigator.onLine;
          setFormStatus(msg, "error");
        }
      );
    });
  }

  document.querySelectorAll('a.link-disabled[href="#"]').forEach((link) => {
    link.addEventListener("click", (e) => e.preventDefault());
  });

  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("sw.js").catch(() => {});
        });
      }
    } catch (err) {
      /* file:// or restricted context */
    }
  }
})();
