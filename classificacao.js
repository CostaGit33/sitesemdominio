import { apiRequest, calculatePoints } from "./globais.js";
import { desempenhoJogadores } from "./desempenho_data.js";

/* ======================================================
   CONFIGURAÇÃO
====================================================== */

const JOGADORES_ENDPOINT = "/jogadores";
const UPDATE_INTERVAL = 10000;

const radarOptions = {
  scales: {
    r: { 
      min: 0, 
      max: 16, 
      ticks: { stepSize: 4, color: '#fff', backdropColor: 'transparent', display: false },
      grid: { color: 'rgba(255,255,255,0.1)' }, 
      angleLines: { color: 'rgba(255,255,255,0.1)' }, 
      pointLabels: { color: '#aaa', font: { size: 10 } } 
    }
  },
  plugins: { 
    legend: { display: false }, 
    tooltip: { enabled: true } 
  },
  elements: { line: { tension: 0.2 } }
};

/* ======================================================
   INIT
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
  carregarClassificacao();
  setInterval(carregarClassificacao, UPDATE_INTERVAL);
});

/* ======================================================
   CORE
====================================================== */

async function carregarClassificacao() {
  const tbody = document.getElementById("playerList");
  const cardsContainer = document.getElementById("rankingCards");

  if (!tbody && !cardsContainer) return;

  try {
    const jogadores = await apiRequest(JOGADORES_ENDPOINT);

    if (!Array.isArray(jogadores)) {
      throw new Error("Resposta inválida da API");
    }

    // Normaliza dados e calcula pontos
    jogadores.forEach(j => {
      j.vitorias  = Number(j.vitorias)  || 0;
      j.empate    = Number(j.empate)    || 0;
      j.defesa    = Number(j.defesa)    || 0;
      j.gols      = Number(j.gols)      || 0;
      j.infracoes = Number(j.infracoes) || 0;

      j.pontos = calculatePoints(
        j.vitorias,
        j.empate,
        j.defesa,
        j.gols,
        j.infracoes
      );
    });

    // Ordena por pontuação
    jogadores.sort((a, b) => b.pontos - a.pontos);

    if (tbody) renderTable(jogadores, tbody);
    if (cardsContainer) renderCards(jogadores, cardsContainer);

  } catch (error) {
    console.error("Erro ao carregar classificação:", error);

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Erro ao carregar dados.</td>
        </tr>
      `;
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = "<p>Erro ao carregar ranking.</p>";
    }
  }
}

/* ======================================================
   RENDER TABELA
====================================================== */

function renderTable(jogadores, tbody) {
  tbody.innerHTML = "";

  if (!jogadores.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">Nenhum jogador cadastrado.</td>
      </tr>
    `;
    return;
  }

  jogadores.forEach((j, index) => {
    const tr = document.createElement("tr");

    tr.style.animation = "fadeUp .4s ease both";
    tr.style.animationDelay = `${index * 0.03}s`;

    tr.innerHTML = `
      <td>${index + 1}</td>

      <td>
        <a href="jogador.html?id=${j.id}" class="player-link">
          ${j.nome}
        </a>
      </td>

      <td><strong>${j.pontos}</strong></td>
      <td>${j.vitorias}</td>
      <td>${j.gols}</td>
      <td>${j.defesa}</td>
      <td>${j.empate}</td>
      <td>${j.infracoes}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ======================================================
   RENDER CARDS
====================================================== */

function renderCards(jogadores, container) {
  container.innerHTML = "";

  if (!jogadores.length) {
    container.innerHTML = "<p>Nenhum jogador cadastrado.</p>";
    return;
  }

  const maxPoints = jogadores[0].pontos || 1;

  jogadores.forEach((j, index) => {
    const percent = Math.min((j.pontos / maxPoints) * 100, 100);
    const stats = desempenhoJogadores[j.nome] || [0, 0, 0, 0, 0];
    const media = stats.reduce((a, b) => a + b, 0) / 5;

    const card = document.createElement("div");
    card.className = "player-card";
    card.style.animationDelay = `${index * 0.05}s`;
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.padding = "20px";

    // Destaque Top 3
    if (index === 0) card.classList.add("top-1");
    if (index === 1) card.classList.add("top-2");
    if (index === 2) card.classList.add("top-3");

    const canvasId = `chart_${j.id || index}`;

    card.innerHTML = `
      <div class="player-rank" style="position: absolute; top: 10px; left: 10px;">#${index + 1}</div>
      <div class="media-badge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,255,136,0.2); color: #00ff88; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 0.8rem;">${media.toFixed(1)}</div>

      <div class="player-name" style="margin-top: 10px; font-weight: bold; font-size: 1.1rem;">
        <a href="jogador.html?id=${j.id}" class="player-link">
          ${j.nome}
        </a>
      </div>

      <canvas id="${canvasId}" style="max-width: 180px; margin: 15px 0;"></canvas>

      <div class="player-points" style="font-size: 1.2rem; font-weight: bold; color: #00ff88;">${j.pontos} pts</div>

      <div class="progress-bar" style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 10px 0; overflow: hidden;">
        <div class="progress-fill" style="height: 100%; background: #00ff88; width: 0; transition: width 1s ease-out;"></div>
      </div>

      <div class="player-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; font-size: 0.8rem; opacity: 0.8;">
        <span>Vit: ${j.vitorias}</span>
        <span>Gols: ${j.gols}</span>
        <span>Def: ${j.defesa}</span>
        <span>Emp: ${j.empate}</span>
      </div>
    `;

    container.appendChild(card);

    // Renderiza o gráfico
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Def', 'Atq', 'Hab', 'Vel', 'Pas'],
        datasets: [{
          data: stats,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.2)',
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: radarOptions
    });

    requestAnimationFrame(() => {
      card.querySelector(".progress-fill").style.width = `${percent}%`;
    });
  });
}

