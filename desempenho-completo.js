import { apiRequest } from "./globais.js";

const DESEMPENHO_ENDPOINT = "/desempenho";
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

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function primeiroNumero(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && valor !== "") return numero(valor);
  }
  return 0;
}

function escapar(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function iniciais(nome = "") {
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes.length === 1 ? partes[0].slice(0, 2) : partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function renderizar(lista) {
  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = '<p class="status">Nenhum jogador encontrado.</p>';
    return;
  }

  lista.forEach((j, index) => {
    const avaliacao = j.avaliacao;
    const stats = avaliacao
      ? [
          numero(avaliacao.defesa),
          numero(avaliacao.ataque),
          numero(avaliacao.velocidade),
          numero(avaliacao.habilidade),
          numero(avaliacao.passe)
        ]
      : null;

    const media = stats
      ? stats.reduce((total, valor) => total + valor, 0) / stats.length
      : null;

    const canvasId = `complete_chart_${j.id ?? index}`;
    const card = document.createElement("article");
    card.className = "complete-card";
    card.style.animationDelay = `${Math.min(index * 55, 700)}ms`;

    card.innerHTML = `
      ${media !== null ? `
        <div class="average-badge" title="Média das cinco categorias técnicas">
          <small>Média</small>
          <strong>${media.toFixed(1)}</strong>
        </div>
      ` : ""}

      <div class="player-head">
        <div class="player-avatar">${escapar(iniciais(j.nome))}</div>
        <div class="player-title">
          <h3>${escapar(j.nome)}</h3>
          <div class="player-subtitle">Desempenho do jogador</div>
        </div>
      </div>

      <div class="api-grid">
        <div class="stat"><span>Vitórias</span><strong>${primeiroNumero(j.vitorias, j.vitoria)}</strong></div>
        <div class="stat"><span>Empates</span><strong>${primeiroNumero(j.empate, j.empates)}</strong></div>
        <div class="stat"><span>Gols</span><strong>${primeiroNumero(j.gols, j.gol)}</strong></div>
        <div class="stat"><span>Defesas</span><strong>${primeiroNumero(j.defesaClassificacao, j.defesa)}</strong></div>
        <div class="stat"><span>Infrações</span><strong>${primeiroNumero(j.infracoes, j.infrações)}</strong></div>
        <div class="stat"><span>Pontos</span><strong>${primeiroNumero(j.pontos, j.ponto)}</strong></div>
      </div>

      <div class="technical-header">
        <div class="section-title">Avaliação técnica</div>
        <div class="evaluation-status">${stats ? "Avaliado" : "Pendente"}</div>
      </div>

      ${stats ? `
        <div class="tech-grid">
          <div class="stat"><span>Defesa</span><strong>${stats[0]}</strong></div>
          <div class="stat"><span>Ataque</span><strong>${stats[1]}</strong></div>
          <div class="stat"><span>Velocidade</span><strong>${stats[2]}</strong></div>
          <div class="stat"><span>Habilidade</span><strong>${stats[3]}</strong></div>
          <div class="stat"><span>Passe</span><strong>${stats[4]}</strong></div>
        </div>
        <div class="chart-wrap"><canvas id="${canvasId}"></canvas></div>
      ` : `
        <div class="missing">
          Avaliação técnica ainda não cadastrada para este jogador.
        </div>
      `}
    `;

    container.appendChild(card);

    if (stats && typeof window.Chart === "function") {
      const canvas = card.querySelector(`#${canvasId}`);
      if (canvas) {
        new window.Chart(canvas, {
          type: "radar",
          data: {
            labels: ["Defesa", "Ataque", "Velocidade", "Habilidade", "Passe"],
            datasets: [{
              data: stats,
              borderWidth: 2,
              borderColor: "#00ff88",
              backgroundColor: "rgba(0,255,136,.18)",
              pointBackgroundColor: "#00ff88",
              pointRadius: 3,
              pointHoverRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: "easeOutQuart" },
            scales: {
              r: {
                min: 0,
                max: 20,
                ticks: { display: false },
                grid: { color: "rgba(255,255,255,.1)" },
                angleLines: { color: "rgba(255,255,255,.1)" },
                pointLabels: { color: "#fff", font: { size: 10 } }
              }
            },
            plugins: { legend: { display: false }, tooltip: { displayColors: false } }
          }
        });
      }
    }
  });
}

async function carregar() {
  try {
    const dados = await apiRequest(DESEMPENHO_ENDPOINT);

    if (!Array.isArray(dados)) {
      throw new Error("Resposta inválida da API de desempenho.");
    }

    jogadores = dados.map(j => ({
      ...j,
      nome: j.nome ?? j.name ?? "Jogador sem nome"
    }));

    const avaliados = jogadores.filter(j => j.avaliacao).length;
    const semAvaliacao = jogadores.length - avaliados;
    status.textContent = `${jogadores.length} jogadores • ${avaliados} avaliados • ${semAvaliacao} pendentes`;

    aplicarFiltro();
  } catch (error) {
    console.error("Erro ao carregar desempenho completo:", error);
    status.textContent = "Não foi possível carregar os dados do desempenho.";
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

if (search) search.addEventListener("input", aplicarFiltro);
carregar();
