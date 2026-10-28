/* FutPontos — navegação responsiva, acessível e instalação PWA */
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const appNav = document.querySelector(".app-nav");
  const installBanner = document.getElementById("install-banner");
  const installConfirm = document.getElementById("install-confirm");
  const installDismiss = document.getElementById("install-dismiss");
  const INSTALL_KEY = "fp_install_dismissed";
  const SW_RESET_KEY = "fp_sw_reset_v60";
  let installPromptEvent = null;
  const isMobile = () => window.matchMedia("(max-width: 800px)").matches;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // O menu só apresenta destinos ativos no momento; páginas antigas permanecem no projeto.
  if (appNav) {
    const ul = appNav.querySelector("ul");
    if (ul) {
      ul.querySelectorAll('a[href="videos.html"], a[href="topo.html"], a[href="analise-semana.html"], a[href="montar-times.html"]')
        .forEach(link => link.closest("li")?.remove());

      if (!ul.querySelector('a[href="index.html"]')) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "index.html";
        link.textContent = "Início";
        ul.prepend(Object.assign(li, {}));
        li.append(link);
      }

      if (!ul.querySelector('a[href="jogador.html"]')) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "jogador.html";
        link.textContent = "Perfis";
        li.append(link);
        const classificacao = [...ul.querySelectorAll("a")].find(a => a.getAttribute("href") === "classificacao.html");
        if (classificacao?.parentElement) classificacao.parentElement.after(li);
        else ul.appendChild(li);
      }

      ul.querySelectorAll("a").forEach(link => {
        const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
        const isCurrent = href === currentPage;
        link.classList.toggle("active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }
  }

  const closeMenu = () => {
    if (!appNav) return;
    appNav.classList.remove("active");
    menuToggle?.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    if (!appNav) return;
    appNav.classList.add("active");
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
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMenu();
        menuToggle.focus({ preventScroll: true });
      }
    });
    window.addEventListener("resize", () => {
      if (!isMobile()) closeMenu();
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
        const registration = await navigator.serviceWorker.register("/sw.js?v=60", { scope: "/", updateViaCache: "none" });
        await registration.update();
      } catch (error) {
        console.error("Erro ao registrar Service Worker:", error);
      }
    });
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPromptEvent = event;
    if (installBanner && !localStorage.getItem(INSTALL_KEY)) installBanner.classList.add("visible");
  });
  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    installBanner?.classList.remove("visible");
    localStorage.removeItem(INSTALL_KEY);
  });
  installConfirm?.addEventListener("click", async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    installPromptEvent = null;
    installBanner?.classList.remove("visible");
  });
  installDismiss?.addEventListener("click", () => {
    localStorage.setItem(INSTALL_KEY, String(Date.now()));
    installBanner?.classList.remove("visible");
  });
});
