import { apiRequest, showFeedback, calculatePoints } from "./globais.js";

/* ======================================================
   UTIL
====================================================== */

function getPlayerIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}


/* ======================================================
   ELEMENTOS
====================================================== */

const stateEl   = document.getElementById("playerState");
const profileEl = document.getElementById("playerProfile");

const nameEl    = document.getElementById("playerName");
const pointsEl  = document.getElementById("playerPoints");

const statV     = document.getElementById("statVitorias");
const statG     = document.getElementById("statGols");
const statD     = document.getElementById("statDefesas");
const statE     = document.getElementById("statEmpates");
const statI     = document.getElementById("statInfracoes");

const photoEl   = document.getElementById("playerPhoto");
const editBtn   = document.getElementById("editPlayerBtn");

/* ======================================================
   LOAD PLAYER
====================================================== */

async function loadPlayer() {
  const id = getPlayerIdFromURL();

  if (!id) {
    showError("Jogador não encontrado.");
    return;
  }

  try {
    const jogadores = await apiRequest("/jogadores");

    if (!Array.isArray(jogadores)) {
      throw new Error("Resposta inválida da API");
    }

    const player = jogadores.find(j => String(j.id) === String(id));

    if (!player) {
      showError("Jogador não encontrado.");
      return;
    }

    renderPlayer(player);

  } catch (err) {
    console.error(err);
    showError("Erro ao carregar dados do jogador.");
  }
}

/* ======================================================
   RENDER
====================================================== */

function renderPlayer(p) {
  // Estado
  if (stateEl) stateEl.hidden = true;
  if (profileEl) profileEl.hidden = false;

  // Nome
  nameEl.textContent = p.nome;

  // Pontos recalculados (fonte da verdade)
  const pontosCalculados = calculatePoints(p.vitorias, p.empate, p.defesa, p.gols, p.infracoes);
  pointsEl.textContent = pontosCalculados;

  // Estatísticas
  statV.textContent = Number(p.vitorias)  || 0;
  statG.textContent = Number(p.gols)      || 0;
  statD.textContent = Number(p.defesa)    || 0;
  statE.textContent = Number(p.empate)    || 0;
  statI.textContent = Number(p.infracoes) || 0;

  // Foto segura
  photoEl.src = p.foto || "futponts_large.png";
  photoEl.alt = `Foto de ${p.nome}`;

  // Link para edição
  if (editBtn) {
    editBtn.href = `adicionar.html?id=${p.id}`;
  }
}

/* ======================================================
   ERRO
====================================================== */

function showError(message) {
  if (stateEl) {
    stateEl.textContent = message;
    stateEl.className = "player-error";
    stateEl.hidden = false;
  }
  if (profileEl) {
    profileEl.hidden = true;
  }

  showFeedback(message, "error");
}

/* ======================================================
   INIT
====================================================== */

document.addEventListener("DOMContentLoaded", loadPlayer);

console.info(
  "%cFutPontos | Detalhes do Jogador ativo",
  "color:#D62828;font-weight:bold;font-size:13px"
);