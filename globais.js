/* ======================================================
   CONFIGURAÇÃO DA API
====================================================== */

export const API_BASE_URL = "https://api.semdominio.online";

export async function apiRequest(endpoint, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  };

  if (options.body) config.body = JSON.stringify(options.body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || data.message || "Erro na comunicação com a API");
    }

    return data;
  } catch (error) {
    console.error(`Erro na requisição [${endpoint}]:`, error);
    throw error;
  }
}

/* ======================================================
   REGRAS DE NEGÓCIO
====================================================== */

export function calculatePoints(vitorias = 0, empate = 0, defesa = 0, gols = 0, infracoes = 0) {
  return (
    Number(vitorias) * 3 +
    Number(empate) * 1 +
    Number(defesa) * 1 +
    Number(gols) * 2 -
    Number(infracoes) * 2
  );
}

/* ======================================================
   UI GLOBAL
====================================================== */

export function showFeedback(message, type = "success") {
  let container = document.getElementById("feedback");
  if (!container) {
    container = document.createElement("div");
    container.id = "feedback";
    document.body.appendChild(container);
  }

  const div = document.createElement("div");
  div.className = `feedback ${type}`;
  div.textContent = message;
  container.appendChild(div);

  setTimeout(() => {
    div.style.transition = "opacity 0.3s ease";
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

/* ======================================================
   INICIALIZAÇÃO GLOBAL
   O menu é controlado exclusivamente por menu.js.
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".app-nav a").forEach(link => {
    const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
    link.classList.toggle("active", href === currentPage);
  });

  const footerContent = document.querySelector(".footer-content span");
  if (footerContent) {
    footerContent.textContent = `© ${new Date().getFullYear()} • FutPontos`;
  }
});
