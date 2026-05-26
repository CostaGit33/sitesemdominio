import { apiRequest, calculatePoints } from "./globais.js";
import { desempenhoJogadores } from "./desempenho_data.js";

const GOLEIROS_ENDPOINT = "/goleiros";

const radarOptions = {
  scales: {
    r: {
      min: 0,
      max: 16,
      ticks: { stepSize: 4, color: "#fff", backdropColor: "transparent", display: false },
      grid: { color: "rgba(255,255,255,0.1)" },
      angleLines: { color: "rgba(255,255,255,0.1)" },
      pointLabels: { color: "#aaa", font: { size: 10 } }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  elements: { line: { tension: 0.2 } }
};

document.addEventListener("DOMContentLoaded", () => {
  carregarGoleiros();
});

async function carregarGoleiros() {
  const tbody = document.getElementById("tabela-goleiros");
  const cardsContainer = document.getElementById("cards-goleiros");

  try {
    const dados = await apiRequest(GOLEIROS_ENDPOINT);
    const goleirosProcessados = normalizar(dados);

    if (tbody) renderTabela(goleirosProcessados, tbody);
    if (cardsContainer) renderCards(goleirosProcessados, cardsContainer);
  } catch (err) {
    console.error("Erro ao carregar goleiros:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem;">
            Erro ao carregar dados dos goleiros.
          </td>
        </tr>
      `;
    }
  }
}

function normalizar(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map(g => {
      const v = Number(g.vitorias) || 0;
      const e = Number(g.empate) || 0;
      const d = Number(g.defesa) || 0;
      const gols = Number(g.gols) || 0;
      const inf = Number(g.infracoes) || 0;

      return {
        ...g,
        vitorias: v,
        empate: e,
        defesa: d,
        gols,
        infracoes: inf,
        pontos: calculatePoints(v, e, d, gols, inf)
      };
    })
    .sort((a, b) =>
      b.pontos - a.pontos ||
      b.defesa - a.defesa ||
      b.vitorias - a.vitorias
    );
}

function formatarPontos(valor) {
  return String(Math.floor(valor)).padStart(2, "0");
}

function renderTabela(lista, tbody) {
  tbody.innerHTML = lista.map((g, i) => `
    <tr>
      <td>${String(i + 1).padStart(2, "0")}</td>
      <td>
        <a href="jogador.html?id=${g.id}" class="player-link">
          ${g.nome}
        </a>
      </td>
      <td><strong>${formatarPontos(g.pontos)}</strong></td>
      <td>${g.vitorias}</td>
      <td>${g.empate}</td>
      <td>${g.gols}</td>
      <td>${g.defesa}</td>
      <td>${g.infracoes}</td>
    </tr>
  `).join("");
}

function renderCards(lista, container) {
  container.innerHTML = "";

  lista.forEach((g, i) => {
    const stats = desempenhoJogadores[g.nome] || [0, 0, 0, 0, 0];
    const media = stats.reduce((a, b) => a + b, 0) / 5;
    const percentual = Math.min((g.pontos / (lista[0]?.pontos || 1)) * 100, 100);

    const card = document.createElement("div");
    card.className = "player-card";
    card.style.animation = "fadeUp .4s ease both";
    card.style.animationDelay = `${i * 0.05}s`;
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.padding = "20px";
    card.style.position = "relative";

    if (i === 0) card.classList.add("top-1");
    if (i === 1) card.classList.add("top-2");
    if (i === 2) card.classList.add("top-3");

    const canvasId = `chart_goleiro_${g.id || i}`;

    card.innerHTML = `
      <div class="player-rank" style="position: absolute; top: 10px; left: 10px;">#${String(i + 1).padStart(2, "0")}</div>
      <div class="media-badge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,255,136,0.2); color: #00ff88; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 0.8rem;">${media.toFixed(1)}</div>

      <div class="player-name" style="margin-top: 10px; font-weight: bold; font-size: 1.1rem;">
        <a href="jogador.html?id=${g.id}" class="player-link">${g.nome}</a>
      </div>

      <canvas id="${canvasId}" style="max-width: 180px; margin: 15px 0;"></canvas>

      <div class="player-points" style="font-size: 1.2rem; font-weight: bold; color: #00ff88;">
        ${formatarPontos(g.pontos)} pts
      </div>

      <div class="progress-bar" style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 10px 0; overflow: hidden;">
        <div class="progress-fill" style="height: 100%; background: #00ff88; width: 0; transition: width 1s ease-out;"></div>
      </div>

      <div class="player-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; font-size: 0.8rem; opacity: 0.8;">
        <span>Vit: ${g.vitorias}</span>
        <span>Gols: ${g.gols}</span>
        <span>Def: ${g.defesa}</span>
        <span>Emp: ${g.empate}</span>
      </div>
    `;

    container.appendChild(card);

    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["Def", "Atq", "Hab", "Vel", "Pas"],
        datasets: [{
          data: stats,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.2)",
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: radarOptions
    });

    requestAnimationFrame(() => {
      const bar = card.querySelector(".progress-fill");
      if (bar) bar.style.width = `${percentual}%`;
    });
  });
}
