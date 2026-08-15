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

  // Integra a página de Desempenho Completo em todos os menus do projeto.
  // O link é criado pelo JS para manter a navegação consistente mesmo
  // em páginas antigas que ainda não possuem o item no HTML.
  function integrarDesempenhoCompleto() {
    if (!appNav) return;

    const list = appNav.querySelector("ul");
    if (!list) return;

    const existe = Array.from(list.querySelectorAll("a")).some(link => {
      const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
      return href === "desempenho-completo.html" || href.endsWith("/desempenho-completo.html");
    });

    if (existe) return;

    const item = document.createElement("li");
    const link = document.createElement("a");
    const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

    link.href = "desempenho-completo.html";
    link.textContent = "Desempenho Completo";

    if (paginaAtual === "desempenho-completo.html") {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    item.appendChild(link);

    // Mantém a nova página junto das páginas de desempenho/análise.
    const analises = Array.from(list.querySelectorAll("a")).find(a =>
      (a.getAttribute("href") || "") === "analise-semana.html"
    );

    if (analises?.parentElement) {
      list.insertBefore(item, analises.parentElement);
    } else {
      list.appendChild(item);
    }
  }

  // A integração precisa acontecer antes dos listeners dos links.
  integrarDesempenhoCompleto();

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

    appNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (e) => {
      if (!appNav.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
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
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .then(registration => registration.update())
        .catch(error => console.error("Erro ao registrar Service Worker:", error));
    });
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPromptEvent = event;

    if (installBanner && !localStorage.getItem(INSTALL_KEY)) {
      installBanner.classList.add("visible");
    }
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    if (installBanner) installBanner.classList.remove("visible");
    localStorage.removeItem(INSTALL_KEY);
  });

  if (installConfirm) {
    installConfirm.addEventListener("click", async () => {
      if (!installPromptEvent) return;
      installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      installPromptEvent = null;
      if (installBanner) installBanner.classList.remove("visible");
    });
  }

  if (installDismiss) {
    installDismiss.addEventListener("click", () => {
      localStorage.setItem(INSTALL_KEY, String(Date.now()));
      if (installBanner) installBanner.classList.remove("visible");
    });
  }
});
