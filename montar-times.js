import { apiRequest } from "./globais.js";

const PLAYERS_ENDPOINT = "/jogadores";
const PERFORMANCE_ENDPOINT = "/desempenho";
const COLORS = ["#e53b46", "#48a8ff", "#36d996", "#ffc529", "#b77bff"];
const ATTRS = [["ataque", "ATQ"], ["defesa", "DEF"], ["velocidade", "VEL"], ["habilidade", "HAB"], ["passe", "PAS"]];

let jogadores = [];
let equipes = Array.from({ length: 5 }, () => []);
let numeroTimes = 5;

const $ = id => document.getElementById(id);
const num = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const norm = value => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");
const esc = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");
const initials = name => {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
};

function extrairAvaliacao(jogador) {
  const avaliacao = jogador?.avaliacao ?? jogador?.avaliacao_tecnica ?? jogador?.tecnica;
  if (avaliacao && typeof avaliacao === "object") {
    return {
      defesa: avaliacao.defesa,
      ataque: avaliacao.ataque,
      velocidade: avaliacao.velocidade,
      habilidade: avaliacao.habilidade,
      passe: avaliacao.passe
    };
  }

  const possui = ATTRS.some(([key]) => jogador?.[key] !== undefined && jogador?.[key] !== null);
  if (!possui) return null;

  return {
    defesa: jogador.defesa,
    ataque: jogador.ataque,
    velocidade: jogador.velocidade,
    habilidade: jogador.habilidade,
    passe: jogador.passe
  };
}

function media(jogador) {
  const avaliacao = extrairAvaliacao(jogador);
  if (!avaliacao) return null;
  return ATTRS.reduce((sum, [key]) => sum + num(avaliacao[key]), 0) / 5;
}

function totalTecnico(jogador) {
  const avaliacao = extrairAvaliacao(jogador);
  if (!avaliacao) return 0;
  return ATTRS.reduce((sum, [key]) => sum + num(avaliacao[key]), 0);
}

function pontos(jogador) {
  return num(jogador.pontos);
}

function escolhido(id) {
  return equipes.some(time => time.some(j => String(j.id) === String(id)));
}

function timeDo(id) {
  return equipes.findIndex(time => time.some(j => String(j.id) === String(id)));
}

function mesclarJogadores(base, desempenho) {
  const porId = new Map(desempenho.map(j => [String(j.id), j]));
  const porNome = new Map(desempenho.map(j => [norm(j.nome ?? j.name), j]));

  return base.map(jogador => {
    const dados = porId.get(String(jogador.id)) || porNome.get(norm(jogador.nome ?? jogador.name));
    return {
      ...jogador,
      ...(dados || {}),
      id: jogador.id ?? dados?.id,
      nome: jogador.nome ?? dados?.nome ?? dados?.name ?? "Jogador sem nome"
    };
  });
}

async function tentar(endpoint) {
  try {
    return await apiRequest(endpoint);
  } catch (error) {
    console.warn(`Endpoint ${endpoint} indisponível:`, error);
    return null;
  }
}

async function carregar() {
  try {
    const [baseResposta, desempenhoResposta] = await Promise.all([
      tentar(PLAYERS_ENDPOINT),
      tentar(PERFORMANCE_ENDPOINT)
    ]);

    const base = Array.isArray(baseResposta) ? baseResposta : [];
    const desempenho = Array.isArray(desempenhoResposta) ? desempenhoResposta : [];

    if (!base.length && !desempenho.length) {
      throw new Error("As APIs não retornaram jogadores.");
    }

    if (base.length) {
      jogadores = mesclarJogadores(base, desempenho);
    } else {
      jogadores = desempenho.map(j => ({
        ...j,
        nome: j.nome ?? j.name ?? "Jogador sem nome"
      }));
    }

    jogadores = jogadores.filter(j => j.id !== undefined && j.id !== null && String(j.nome || "").trim());

    jogadores.sort((a, b) => {
      const mediaA = media(a);
      const mediaB = media(b);
      if (mediaA !== null && mediaB !== null && mediaA !== mediaB) return mediaB - mediaA;
      if (mediaA !== null && mediaB === null) return -1;
      if (mediaA === null && mediaB !== null) return 1;
      return pontos(b) - pontos(a) || String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });

    render();

    const fontes = [
      base.length ? "jogadores" : null,
      desempenho.length ? "desempenho" : null
    ].filter(Boolean).join(" + ");

    if ($("status")) {
      $("status").textContent = `${jogadores.length} jogadores carregados • fonte: ${fontes || "API"} • seleção manual ativa.`;
    }
  } catch (error) {
    console.error("Erro ao carregar montagem de times:", error);
    if ($("status")) $("status").textContent = `Erro ao carregar jogadores: ${error.message}`;
  }
}

function render() {
  renderPlayers();
  renderTeams();
  renderSummary();
  if ($("pickedCount")) {
    $("pickedCount").textContent = equipes.reduce((sum, time) => sum + time.length, 0);
  }
}

function renderPlayers() {
  const search = $("searchPlayer");
  const query = norm(search ? search.value : "");
  const disponiveis = jogadores.filter(j => !escolhido(j.id) && (!query || norm(j.nome).includes(query)));

  if ($("availableCount")) $("availableCount").textContent = disponiveis.length;
  if (!$("players")) return;

  $("players").innerHTML = disponiveis.length
    ? disponiveis.map((j, index) => playerCard(j, index)).join("")
    : '<div class="empty">Nenhum jogador disponível para a busca atual.</div>';
}

function playerCard(jogador, index) {
  const avaliacao = extrairAvaliacao(jogador);
  const mediaTecnica = media(jogador);
  const total = totalTecnico(jogador);

  const botoes = Array.from({ length: numeroTimes }, (_, time) => {
    const disabled = equipes[time].length >= 7 ? "disabled" : "";
    return `<button class="pick" data-id="${esc(jogador.id)}" data-team="${time}" ${disabled}>TIME ${time + 1}</button>`;
  }).join("");

  const atributos = ATTRS.map(([key, label]) => {
    const valor = avaliacao ? num(avaliacao[key]) : "—";
    return `<div class="attr"><small>${label}</small><b>${valor}</b></div>`;
  }).join("");

  return `<article class="player-card" style="animation-delay:${Math.min(index * 18, 500)}ms">
    <div class="player-main">
      <div class="avatar">${esc(initials(jogador.nome))}</div>
      <div class="player-info">
        <div class="player-name">${esc(jogador.nome)}</div>
        <div class="player-meta">
          ${pontos(jogador)} pts • ${num(jogador.vitorias)} vitórias • ${num(jogador.gols)} gols
          ${mediaTecnica !== null ? ` • <span class="mini-avg">média ${mediaTecnica.toFixed(1)}</span>` : " • avaliação pendente"}
        </div>
      </div>
    </div>
    <div class="attr-row">${atributos}</div>
    ${mediaTecnica !== null
      ? `<div class="player-meta technical-line">Técnico: <b>${total}/100</b> • Defesa ${num(avaliacao.defesa)} • Ataque ${num(avaliacao.ataque)}</div>`
      : '<div class="player-meta technical-line">Este jogador ainda não possui avaliação técnica.</div>'}
    <div class="pick-row">${botoes}</div>
  </article>`;
}

function renderTeams() {
  if (!$("teams")) return;

  $("teams").innerHTML = equipes.slice(0, numeroTimes).map((time, index) => {
    const tecnico = time.reduce((sum, jogador) => sum + totalTecnico(jogador), 0);
    const mediaTime = time.length ? tecnico / (time.length * 5) : 0;

    const membros = time.length
      ? time.map(jogador => `<div class="member">
          <div class="avatar">${esc(initials(jogador.nome))}</div>
          <div class="member-name">
            ${esc(jogador.nome)}<br>
            <span class="player-meta">${media(jogador) !== null ? `Média ${media(jogador).toFixed(1)} • ${pontos(jogador)} pts` : "Sem avaliação"}</span>
          </div>
          <button class="remove" data-remove="${esc(jogador.id)}" title="Remover">×</button>
        </div>`).join("")
      : '<div class="empty">Nenhum jogador selecionado</div>';

    return `<article class="team" style="--team:${COLORS[index]}">
      <div class="team-head">
        <div>
          <h3>TIME ${index + 1}</h3>
          <div class="team-count">${time.length}/7 jogadores${time.length >= 7 ? " • COMPLETO" : ""}</div>
        </div>
        <div class="team-total">${tecnico}<div class="team-avg">média ${mediaTime.toFixed(1)}</div></div>
      </div>
      <div class="members">${membros}</div>
    </article>`;
  }).join("");
}

function renderSummary() {
  if (!$("summary")) return;

  $("summary").innerHTML = equipes.slice(0, numeroTimes).map((time, index) => {
    const pts = time.reduce((sum, jogador) => sum + pontos(jogador), 0);
    const mediaTime = time.length
      ? time.reduce((sum, jogador) => sum + (media(jogador) ?? 0), 0) / time.length
      : 0;

    return `<div class="summary">
      <strong style="color:${COLORS[index]}">TIME ${index + 1}</strong>
      <span>${time.length}/7 jogadores • ${pts} pontos de classificação • média técnica ${mediaTime.toFixed(1)}</span>
    </div>`;
  }).join("");
}

function adicionar(id, time) {
  const jogador = jogadores.find(j => String(j.id) === String(id));
  if (!jogador) return;

  if (equipes[time].length >= 7) {
    if ($("status")) $("status").textContent = `Time ${time + 1} já está completo (7 jogadores).`;
    return;
  }

  if (escolhido(id)) return;
  equipes[time].push(jogador);
  render();

  if ($("status")) $("status").textContent = `${jogador.nome} foi escolhido para o Time ${time + 1}.`;
}

function remover(id) {
  const index = timeDo(id);
  if (index < 0) return;

  const jogador = equipes[index].find(j => String(j.id) === String(id));
  equipes[index] = equipes[index].filter(j => String(j.id) !== String(id));
  render();

  if ($("status")) $("status").textContent = `${jogador?.nome || "Jogador"} removido do Time ${index + 1}.`;
}

function alterarNumero() {
  const novo = Number($("teamCount").value);
  for (let i = novo; i < 5; i++) equipes[i] = [];
  numeroTimes = novo;
  render();
}

$("players")?.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (button) adicionar(button.dataset.id, Number(button.dataset.team));
});

$("teams")?.addEventListener("click", event => {
  const button = event.target.closest("button[data-remove]");
  if (button) remover(button.dataset.remove);
});

$("searchPlayer")?.addEventListener("input", renderPlayers);
$("teamCount")?.addEventListener("change", alterarNumero);
$("clearAll")?.addEventListener("click", () => {
  equipes = Array.from({ length: 5 }, () => []);
  render();
  if ($("status")) $("status").textContent = "Todas as escolhas foram removidas.";
});

carregar();
