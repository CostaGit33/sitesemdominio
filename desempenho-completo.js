import { apiRequest } from "./globais.js";
import { desempenhoJogadores } from "./desempenho_data.js";

const JOGADORES_ENDPOINT = "/jogadores";
const container = document.getElementById("completeContainer");
const status = document.getElementById("completeStatus");
const search = document.getElementById("searchPlayer");
let jogadores = [];

function normalizarNome(nome = "") {
  return String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const indiceTecnico = Object.fromEntries(
  Object.entries(desempenhoJogadores).map(([nome, stats]) => [
    normalizarNome(nome),
    { nome, stats }
  ])
);

function obterAvaliacao(nome) {
  return indiceTecnico[normalizarNome(nome)] || null;
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function escapar(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderizar(lista) {
  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = "<p class=\"status\">Nenhum jogador encontrado.</p>";
    return;
  }

  lista.forEach((j, index) => {
    const avaliacao = obterAvaliacao(j.nome);
    const stats = avaliacao?.stats || null;
    const media = stats ? stats.reduce((a, b) => a + numero(b), 0) / stats.length : null;
    const canvasId = `complete_chart_${j.id ?? index}`;
    const card = document.createElement("article");
    card.className = "complete-card";

    card.innerHTML = `
      <h3>${escapar(j.nome)}</h3>
      <div class="player-id">ID: ${escapar(j.id ?? "-")}</div>

      <div class="section-title">Dados da API</div>
      <div class="api-grid">
        <div class="stat"><span>Vitórias</span><strong>${numero(j.vitorias)}</strong></div>
        <div class="stat"><span>Empates</span><strong>${numero(j.empate)}</strong></div>
        <div class="stat"><span>Gols</span><strong>${numero(j.gols)}</strong></div>
        <div class="stat"><span>Defesas</span><strong>${numero(j.defesa)}</strong></div>
        <div class="stat"><span>Infrações</span><strong>${numero(j.infracoes)}</strong></div>
        <div class="stat"><span>Pontos</span><strong>${numero(j.pontos)}</strong></div>
      </div>

      <div class="section-title">Avaliação técnica</div>
      ${stats ? `
        <div class="tech-grid">
          <div class="stat">Defesa<strong>${stats[0]}</strong></div>
          <div class="stat">Ataque<strong>${stats[1]}</strong></div>
          <div class="stat">Velocidade<strong>${stats[2]}</strong></div>
          <div class="stat">Habilidade<strong>${stats[3]}</strong></div>
          <div class="stat">Passe<strong>${stats[4]}</strong></div>
        </div>
        <div class="average">Média Técnica<br><strong>${media.toFixed(1)} / 20</strong></div>
        <div class="chart-wrap"><canvas id="${canvasId}"></canvas></div>
      ` : `
        <div class="missing">Avaliação técnica ainda não cadastrada para este jogador.</div>
      `}
    `;

    container.appendChild(card);

    if (stats && typeof window.Chart === "function") {
      const canvas = document.getElementById(canvasId);
      new window.Chart(canvas, {
        type: "radar",
        data: {
          labels: ["Defesa", "Ataque", "Velocidade", "Habilidade", "Passe"],
          datasets: [{
            data: stats,
            borderWidth: 2,
            borderColor: "#00ff88",
            backgroundColor: "rgba(0,255,136,.18)",
            pointBackgroundColor: "#00ff88"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            r: {
              min: 0,
              max: 20,
              ticks: { display: false },
              grid: { color: "rgba(255,255,255,.1)" },
              angleLines: { color: "rgba(255,255,255,.1)" },
              pointLabels: { color: "#fff", font: { size: 11 } }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  });
}

async function carregar() {
  try {
    const dados = await apiRequest(JOGADORES_ENDPOINT);

    if (!Array.isArray(dados)) throw new Error("Resposta inválida da API");

    jogadores = dados.map(j => ({
      ...j,
      vitorias: numero(j.vitorias),
      empate: numero(j.empate),
      gols: numero(j.gols),
      defesa: numero(j.defesa),
      infracoes: numero(j.infracoes),
      pontos: numero(j.pontos)
    }));

    status.textContent = `${jogadores.length} jogadores carregados pela API.`;
    aplicarFiltro();
  } catch (error) {
    console.error("Erro ao carregar desempenho completo:", error);
    status.textContent = "Não foi possível carregar os dados da API.";
    container.innerHTML = `<p class="status">${escapar(error.message)}</p>`;
  }
}

function aplicarFiltro() {
  const termo = normalizarNome(search.value);
  const filtrados = termo
    ? jogadores.filter(j => normalizarNome(j.nome).includes(termo))
    : jogadores;
  renderizar(filtrados);
}

search.addEventListener("input", aplicarFiltro);
carregar();
