/* ============================
   Navegação + PWA
   menu.js controla exclusivamente
   o comportamento do menu.
============================ */

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const appNav = document.querySelector(".app-nav");
  const installBanner = document.getElementById("install-banner");
  const installConfirm = document.getElementById("install-confirm");
  const installDismiss = document.getElementById("install-dismiss");
  const INSTALL_KEY = "fp_install_dismissed";
  const SW_RESET_KEY = "fp_sw_reset_v50";
  let installPromptEvent = null;
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // O item Montar Times é injetado centralmente para que todas as páginas
  // que usam o menu compartilhem exatamente a mesma navegação.
  if (appNav) {
    const ul = appNav.querySelector("ul");
    if (ul) {
      if (!ul.querySelector('a[href="montar-times.html"]')) {
        const li = document.createElement("li");
        li.innerHTML = '<a href="montar-times.html">Montar Times</a>';
        const desempenho = [...ul.querySelectorAll("a")].find(a => a.getAttribute("href") === "desempenho-completo.html");
        const videos = [...ul.querySelectorAll("a")].find(a => a.getAttribute("href") === "videos.html");
        if (desempenho?.parentElement) desempenho.parentElement.after(li);
        else if (videos?.parentElement) ul.insertBefore(li, videos.parentElement);
        else ul.appendChild(li);
      }

      ul.querySelectorAll("a").forEach(link => {
        const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
        const isCurrent = href === currentPage || (currentPage === "index.html" && href === "index.html");
        link.classList.toggle("active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }
  }

  const closeMenu = () => {
    if (!appNav) return;
    appNav.classList.remove("active");
    if (isMobile()) appNav.style.display = "none";
    menuToggle?.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    if (!appNav) return;
    appNav.classList.add("active");
    if (isMobile()) appNav.style.display = "flex";
    menuToggle?.setAttribute("aria-expanded", "true");
  };

  if (menuToggle && appNav) {
    appNav.id = appNav.id || "main-nav";
    menuToggle.setAttribute("aria-controls", appNav.id);
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.addEventListener("click", event => {
      event.stopPropagation();
      appNav.classList.contains("active") ? closeMenu() : openMenu();
    });
    appNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("click", event => {
      if (!appNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (!isMobile()) {
        appNav.style.display = "";
        appNav.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      } else if (!appNav.classList.contains("active")) appNav.style.display = "none";
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (!sessionStorage.getItem(SW_RESET_KEY)) {
          sessionStorage.setItem(SW_RESET_KEY, "1");
          await Promise.all(registrations.map(reg => reg.unregister()));
          window.location.reload();
          return;
        }
        const registration = await navigator.serviceWorker.register("/sw.js?v=50", { scope: "/", updateViaCache: "none" });
        await registration.update();
      } catch (error) { console.error("Erro ao registrar Service Worker:", error); }
    });
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPromptEvent = event;
    if (installBanner && !localStorage.getItem(INSTALL_KEY)) installBanner.classList.add("visible");
  });
  window.addEventListener("appinstalled", () => { installPromptEvent = null; installBanner?.classList.remove("visible"); localStorage.removeItem(INSTALL_KEY); });
  installConfirm?.addEventListener("click", async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt(); await installPromptEvent.userChoice; installPromptEvent = null; installBanner?.classList.remove("visible");
  });
  installDismiss?.addEventListener("click", () => { localStorage.setItem(INSTALL_KEY, String(Date.now())); installBanner?.classList.remove("visible"); });
});
