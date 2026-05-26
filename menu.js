/* ============================
   Mobile Menu + PWA Install
============================ */

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const appNav = document.querySelector(".app-nav");
  const installBanner = document.getElementById("install-banner");
  const installConfirm = document.getElementById("install-confirm");
  const installDismiss = document.getElementById("install-dismiss");
  const INSTALL_KEY = "fp_install_dismissed";
  let installPromptEvent = null;
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const closeMenu = () => {
    if (!appNav) return;
    appNav.classList.remove("active");
    if (isMobile()) appNav.style.display = "none";
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    if (!appNav) return;
    appNav.classList.add("active");
    if (isMobile()) appNav.style.display = "flex";
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
  };
  const toggleMenu = () => {
    if (!appNav) return;
    const isOpen = appNav.classList.contains("active");
    if (isOpen) closeMenu();
    else openMenu();
  };

  if (menuToggle && appNav) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-controls", "main-nav");
    appNav.id = appNav.id || "main-nav";

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    const navLinks = appNav.querySelectorAll("a");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    document.addEventListener("click", (e) => {
      if (!appNav.contains(e.target) && !menuToggle.contains(e.target)) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) {
        appNav.style.display = "";
        appNav.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      } else if (!appNav.classList.contains("active")) {
        appNav.style.display = "none";
      }
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Erro ao registrar Service Worker:", error);
    });
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPromptEvent = event;

    const dismissed = localStorage.getItem(INSTALL_KEY);
    if (installBanner && !dismissed) {
      installBanner.classList.add("visible");
    }
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    if (installBanner) {
      installBanner.classList.remove("visible");
    }
    localStorage.removeItem(INSTALL_KEY);
  });

  if (installConfirm) {
    installConfirm.addEventListener("click", async () => {
      if (!installPromptEvent) return;
      installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      installPromptEvent = null;
      if (installBanner) {
        installBanner.classList.remove("visible");
      }
    });
  }

  if (installDismiss) {
    installDismiss.addEventListener("click", () => {
      localStorage.setItem(INSTALL_KEY, String(Date.now()));
      if (installBanner) {
        installBanner.classList.remove("visible");
      }
    });
  }
});
