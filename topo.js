import { apiRequest, calculatePoints } from "./globais.js";

const DELTA_KEY = "fp_points_delta_history_v1";
const DELTA_EVENTS_KEY = "fp_points_delta_events_v1";

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getISOWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getYearKey(date = new Date()) {
  return String(date.getFullYear());
}

function formatDelta(v) {
  const n = Number(v) || 0;
  return `${n >= 0 ? "+" : ""}${n}`;
}

function toRanking(periodObj) {
  return Object.entries(periodObj || {})
    .map(([id, value]) => ({ id, nome: value.nome, delta: Number(value.delta) || 0 }))
    .filter(item => item.delta !== 0)
    .sort((a, b) => b.delta - a.delta || a.nome.localeCompare(b.nome));
}

function normalizePlayers(players) {
  return (players || []).map(p => {
    const pontosApi = Number(p.pontos);
    const pontosCalc = calculatePoints(p.vitorias, p.empate, p.defesa, p.gols, p.infracoes);
    return {
      id: String(p.id ?? p.nome),
      nome: p.nome || "Sem nome",
      pontos: Number.isFinite(pontosApi) ? pontosApi : pontosCalc
    };
  }).sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
}

async function seedFromCurrentClassification(history) {
  const jogadores = normalizePlayers(await apiRequest("/jogadores"))
    .filter(j => Number(j.pontos) > 0);
  if (!jogadores.length) return history;

  const weekKey = getISOWeekKey(new Date());
  const monthKey = getMonthKey(new Date());
  const yearKey = getYearKey(new Date());

  if (!history.week) history.week = {};
  if (!history.month) history.month = {};
  if (!history.year) history.year = {};

  if (!history.week[weekKey] || !Object.keys(history.week[weekKey]).length) {
    history.week[weekKey] = {};
    jogadores.forEach(j => {
      history.week[weekKey][j.id] = { nome: j.nome, delta: j.pontos };
    });
  }

  if (!history.month[monthKey] || !Object.keys(history.month[monthKey]).length) {
    history.month[monthKey] = {};
    jogadores.forEach(j => {
      history.month[monthKey][j.id] = { nome: j.nome, delta: j.pontos };
    });
  }

  if (!history.year[yearKey] || !Object.keys(history.year[yearKey]).length) {
    history.year[yearKey] = {};
    jogadores.forEach(j => {
      history.year[yearKey][j.id] = { nome: j.nome, delta: j.pontos };
    });
  }

  localStorage.setItem(DELTA_KEY, JSON.stringify(history));
  return history;
}

function renderTopCards(weekRanking) {
  const topUpName = document.getElementById("topUpName");
  const topUpValue = document.getElementById("topUpValue");
  const topDownName = document.getElementById("topDownName");
  const topDownValue = document.getElementById("topDownValue");

  if (!weekRanking.length) {
    topUpName.textContent = "Sem dados";
    topUpValue.textContent = "+0 pontos";
    topDownName.textContent = "Sem dados";
    topDownValue.textContent = "0 pontos";
    return;
  }

  const up = weekRanking[0];
  topUpName.textContent = up.nome;
  topUpValue.textContent = `${formatDelta(up.delta)} pontos`;

  const negatives = [...weekRanking].sort((a, b) => a.delta - b.delta);
  const down = negatives[0];
  topDownName.textContent = down.nome;
  topDownValue.textContent = `${formatDelta(down.delta)} pontos`;
}

function renderTimeline(events, selectedId) {
  const tbody = document.getElementById("timelineBody");
  if (!tbody) return;

  const rows = [];
  events.forEach(event => {
    (event.changes || []).forEach(change => {
      if (String(change.id) !== String(selectedId)) return;
      rows.push({
        at: event.at,
        delta: Number(change.delta) || 0,
        weekKey: event.weekKey || "-"
      });
    });
  });

  rows.sort((a, b) => new Date(b.at) - new Date(a.at));

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="3">Sem eventos ainda para este jogador.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr>
      <td>${new Date(row.at).toLocaleString("pt-BR")}</td>
      <td>${row.weekKey}</td>
      <td><strong>${formatDelta(row.delta)}</strong></td>
    </tr>
  `).join("");
}

function buildHall(history) {
  const hall = {};

  const addWin = (player, field) => {
    if (!player) return;
    const id = String(player.id);
    if (!hall[id]) hall[id] = { nome: player.nome, weekWins: 0, monthWins: 0 };
    hall[id].nome = player.nome;
    hall[id][field] += 1;
  };

  Object.keys(history.week || {}).forEach(key => {
    const ranking = toRanking(history.week[key]);
    addWin(ranking[0], "weekWins");
  });

  Object.keys(history.month || {}).forEach(key => {
    const ranking = toRanking(history.month[key]);
    addWin(ranking[0], "monthWins");
  });

  return Object.values(hall)
    .map(item => ({
      ...item,
      total: item.weekWins + item.monthWins
    }))
    .sort((a, b) => b.total - a.total || b.weekWins - a.weekWins || a.nome.localeCompare(b.nome));
}

function renderHall(hall) {
  const tbody = document.getElementById("hallBody");
  if (!tbody) return;

  if (!hall.length) {
    tbody.innerHTML = '<tr><td colspan="5">Sem dados ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = hall.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.nome}</td>
      <td>${item.weekWins}</td>
      <td>${item.monthWins}</td>
      <td><strong>${item.total}</strong></td>
    </tr>
  `).join("");
}

async function init() {
  let history = safeParse(DELTA_KEY, { week: {}, month: {}, year: {} });
  const events = safeParse(DELTA_EVENTS_KEY, []);
  const weekKey = getISOWeekKey(new Date());

  const hasWeekData = !!(history.week && history.week[weekKey] && Object.keys(history.week[weekKey]).length);
  if (!hasWeekData) {
    history = await seedFromCurrentClassification(history);
  }

  const weekRanking = toRanking((history.week || {})[weekKey]);

  renderTopCards(weekRanking);
  renderHall(buildHall(history));

  const filter = document.getElementById("playerFilter");
  if (!filter) return;

  const playersMap = {};
  events.forEach(event => {
    (event.changes || []).forEach(change => {
      playersMap[String(change.id)] = change.nome;
    });
  });

  const players = Object.entries(playersMap).map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  if (!players.length) {
    filter.innerHTML = '<option value="">Sem histórico disponível</option>';
    renderTimeline([], "");
    return;
  }

  filter.innerHTML = players.map(p => `<option value="${p.id}">${p.nome}</option>`).join("");
  renderTimeline(events, players[0].id);

  filter.addEventListener("change", () => {
    renderTimeline(events, filter.value);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(error => {
    console.error("Erro ao iniciar Topos:", error);
  });
});
