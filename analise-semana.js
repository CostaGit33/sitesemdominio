import { apiRequest, calculatePoints } from "./globais.js";

const SNAPSHOT_KEY = "fp_points_snapshot_v1";
const DELTA_KEY = "fp_points_delta_history_v1";
const DELTA_EVENTS_KEY = "fp_points_delta_events_v1";
const REFRESH_MS = 15000;

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

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function ensureBucket(store, type, periodKey) {
  if (!store[type]) store[type] = {};
  if (!store[type][periodKey]) store[type][periodKey] = {};
  return store[type][periodKey];
}

function addDelta(store, type, periodKey, playerId, name, delta) {
  const bucket = ensureBucket(store, type, periodKey);
  if (!bucket[playerId]) bucket[playerId] = { nome: name, delta: 0 };
  bucket[playerId].nome = name;
  bucket[playerId].delta += delta;
}

function toRanking(periodObj) {
  return Object.entries(periodObj || {})
    .map(([id, value]) => ({ id, nome: value.nome, delta: Number(value.delta) || 0 }))
    .filter(item => item.delta !== 0)
    .sort((a, b) => b.delta - a.delta || a.nome.localeCompare(b.nome));
}

function formatDelta(value) {
  const n = Number(value) || 0;
  return `${n >= 0 ? "+" : ""}${n}`;
}

function pulseWinnerCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("is-updated");
  void cardEl.offsetWidth;
  cardEl.classList.add("is-updated");
  setTimeout(() => cardEl.classList.remove("is-updated"), 700);
}

function renderWinner(winnerEl, winnerPointsEl, ranking, cardEl) {
  const previousName = winnerEl.textContent;
  const previousPoints = winnerPointsEl.textContent;

  if (!ranking.length) {
    winnerEl.textContent = "Sem dados";
    winnerPointsEl.textContent = "+0 pontos";
    return;
  }

  const best = ranking[0];
  winnerEl.textContent = best.nome;
  winnerPointsEl.textContent = `${formatDelta(best.delta)} pontos`;

  if (previousName !== winnerEl.textContent || previousPoints !== winnerPointsEl.textContent) {
    pulseWinnerCard(cardEl);
  }
}

function renderTable(tbodyId, ranking) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!ranking.length) {
    tbody.innerHTML = '<tr><td colspan="3">Sem dados ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = ranking.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.nome}</td>
      <td><strong>${formatDelta(item.delta)}</strong></td>
    </tr>
  `).join("");
}

function normalizePlayers(players) {
  return (players || []).map(p => {
    const id = String(p.id ?? p.nome ?? Math.random());
    const pontosApi = Number(p.pontos);
    const pontosCalc = calculatePoints(p.vitorias, p.empate, p.defesa, p.gols, p.infracoes);
    return {
      id,
      nome: p.nome || "Sem nome",
      pontos: Number.isFinite(pontosApi) ? pontosApi : pontosCalc
    };
  });
}

function seedCurrentPeriod(history, players, semanaKey, mesKey, anoKey) {
  if (!history.week) history.week = {};
  if (!history.month) history.month = {};
  if (!history.year) history.year = {};

  const hasWeek = history.week[semanaKey] && Object.keys(history.week[semanaKey]).length;
  const hasMonth = history.month[mesKey] && Object.keys(history.month[mesKey]).length;
  const hasYear = history.year[anoKey] && Object.keys(history.year[anoKey]).length;

  const eligiblePlayers = players.filter(p => Number(p.pontos) > 0);

  if (!hasWeek) {
    history.week[semanaKey] = {};
    eligiblePlayers.forEach(p => {
      history.week[semanaKey][p.id] = { nome: p.nome, delta: p.pontos };
    });
  }

  if (!hasMonth) {
    history.month[mesKey] = {};
    eligiblePlayers.forEach(p => {
      history.month[mesKey][p.id] = { nome: p.nome, delta: p.pontos };
    });
  }

  if (!hasYear) {
    history.year[anoKey] = {};
    eligiblePlayers.forEach(p => {
      history.year[anoKey][p.id] = { nome: p.nome, delta: p.pontos };
    });
  }
}

function pruneHistory(store) {
  const keepWeeks = 70;
  const keepMonths = 24;
  const keepYears = 5;

  const prune = (obj, limit) => {
    const keys = Object.keys(obj || {}).sort();
    const overflow = Math.max(0, keys.length - limit);
    for (let i = 0; i < overflow; i += 1) {
      delete obj[keys[i]];
    }
  };

  prune(store.week || {}, keepWeeks);
  prune(store.month || {}, keepMonths);
  prune(store.year || {}, keepYears);
}

function pruneEvents(events) {
  const keep = 800;
  if (!Array.isArray(events)) return [];
  return events.slice(-keep);
}

function isLikelyReset(snapshotPlayers, currentMap) {
  const ids = Object.keys(currentMap);
  if (!ids.length) return false;

  let compared = 0;
  let negativeCount = 0;
  let totalDrop = 0;

  ids.forEach(id => {
    const prev = snapshotPlayers[id];
    const curr = currentMap[id];
    if (!prev || !curr) return;

    compared += 1;
    const delta = curr.pontos - (Number(prev.pontos) || 0);
    if (delta < 0) {
      negativeCount += 1;
      totalDrop += Math.abs(delta);
    }
  });

  if (compared < 3) return false;
  const negativeRatio = negativeCount / compared;
  const averageDrop = totalDrop / compared;

  return negativeRatio >= 0.7 && averageDrop >= 5;
}

async function atualizarAnalise() {
  const agora = new Date();
  const semanaKey = getISOWeekKey(agora);
  const mesKey = getMonthKey(agora);
  const anoKey = getYearKey(agora);

  const jogadores = normalizePlayers(await apiRequest("/jogadores"));
  const snapshot = safeParse(SNAPSHOT_KEY, { players: {}, at: null, monthKey: null });
  const history = safeParse(DELTA_KEY, { week: {}, month: {}, year: {} });
  const events = safeParse(DELTA_EVENTS_KEY, []);

  seedCurrentPeriod(history, jogadores, semanaKey, mesKey, anoKey);

  const currentMap = {};
  jogadores.forEach(j => {
    currentMap[j.id] = { nome: j.nome, pontos: j.pontos };
  });

  const monthChanged = snapshot.monthKey && snapshot.monthKey !== mesKey;
  const resetDetected = monthChanged || isLikelyReset(snapshot.players || {}, currentMap);
  const eventChanges = [];

  if (!resetDetected) {
    Object.entries(currentMap).forEach(([id, current]) => {
      const previous = snapshot.players[id];
      if (!previous) return;

      const delta = current.pontos - (Number(previous.pontos) || 0);
      const previousPoints = Number(previous.pontos) || 0;
      const currentPoints = Number(current.pontos) || 0;

      // Remove apenas quem segue zerado (0 -> 0)
      if (previousPoints === 0 && currentPoints === 0) return;
      if (delta === 0) return;

      addDelta(history, "week", semanaKey, id, current.nome, delta);
      addDelta(history, "month", mesKey, id, current.nome, delta);
      addDelta(history, "year", anoKey, id, current.nome, delta);
      eventChanges.push({ id, nome: current.nome, delta });
    });
  }

  pruneHistory(history);

  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
    players: currentMap,
    at: agora.toISOString(),
    monthKey: mesKey
  }));
  localStorage.setItem(DELTA_KEY, JSON.stringify(history));

  if (!resetDetected && eventChanges.length) {
    events.push({
      at: agora.toISOString(),
      weekKey: semanaKey,
      monthKey: mesKey,
      yearKey: anoKey,
      changes: eventChanges
    });
    localStorage.setItem(DELTA_EVENTS_KEY, JSON.stringify(pruneEvents(events)));
  }

  const weekRanking = toRanking(history.week[semanaKey]);
  const monthRanking = toRanking(history.month[mesKey]);
  const yearRanking = toRanking(history.year[anoKey]);

  renderWinner(
    document.getElementById("winnerWeek"),
    document.getElementById("winnerWeekPoints"),
    weekRanking,
    document.getElementById("winnerCardWeek")
  );
  renderWinner(
    document.getElementById("winnerMonth"),
    document.getElementById("winnerMonthPoints"),
    monthRanking,
    document.getElementById("winnerCardMonth")
  );
  renderWinner(
    document.getElementById("winnerYear"),
    document.getElementById("winnerYearPoints"),
    yearRanking,
    document.getElementById("winnerCardYear")
  );

  renderTable("weekRankBody", weekRanking);
  renderTable("monthRankBody", monthRanking);
  renderTable("yearRankBody", yearRanking);

  const lastUpdate = document.getElementById("lastUpdate");
  if (lastUpdate) {
    lastUpdate.textContent = `Última atualização: ${agora.toLocaleString("pt-BR")}`;
  }
}

async function init() {
  try {
    await atualizarAnalise();
  } catch (error) {
    console.error("Erro ao carregar análise:", error);
    const bodies = ["weekRankBody", "monthRankBody", "yearRankBody"];
    bodies.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
    });
  }

  setInterval(async () => {
    try {
      await atualizarAnalise();
    } catch (error) {
      console.error("Erro ao atualizar análise:", error);
    }
  }, REFRESH_MS);
}

document.addEventListener("DOMContentLoaded", init);
