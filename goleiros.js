import { apiRequest } from "./globais.js";

const endpoint = "/goleiros";
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const points = value => number(value).toLocaleString("pt-BR");

function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list.map(g => ({
    ...g,
    pontos: number(g.pontos),
    vitorias: number(g.vitorias),
    empate: number(g.empate ?? g.empates),
    gols: number(g.gols),
    defesa: number(g.defesa ?? g.defesas),
    infracoes: number(g.infracoes),
    jogos_disputados: number(g.jogos_disputados),
    derrotas: number(g.derrotas),
    gols_sofridos: number(g.gols_sofridos),
    media_gols_sofridos: number(g.media_gols_sofridos),
    aproveitamento_vitorias: number(g.aproveitamento_vitorias)
  })).sort((a,b) =>
    b.pontos-a.pontos || b.vitorias-a.vitorias || b.gols-a.gols || b.defesa-a.defesa
  );
}

function renderTable(list, tbody) {
  tbody.innerHTML = list.map((g,i) => `
    <tr>
      <td>${String(i+1).padStart(2,"0")}</td>
      <td><a class="player-link" href="goleiro.html?id=${encodeURIComponent(g.id)}">${esc(g.nome)}</a></td>
      <td><strong>${points(g.pontos)}</strong></td>
      <td>${g.vitorias}</td><td>${g.empate}</td><td>${g.gols}</td><td>${g.defesa}</td><td>${g.infracoes}</td>
    </tr>`).join("") || '<tr><td colspan="8">Nenhum goleiro cadastrado.</td></tr>';
}

function renderCards(list, container) {
  container.innerHTML = list.map((g,i) => {
    const pct = list[0]?.pontos > 0 ? Math.min(100, g.pontos/list[0].pontos*100) : 0;
    return `
      <article class="player-card goalkeeper-card ${i<3 ? `top-${i+1}` : ""}">
        <span class="player-rank">#${String(i+1).padStart(2,"0")}</span>
        <a class="goalkeeper-photo-link" href="goleiro.html?id=${encodeURIComponent(g.id)}">
          <img src="${esc(g.foto || "futponts_large.png")}" alt="Foto de ${esc(g.nome)}" loading="lazy" onerror="this.onerror=null;this.src='futponts_large.png'">
        </a>
        <h3 class="player-name"><a href="goleiro.html?id=${encodeURIComponent(g.id)}">${esc(g.nome)}</a></h3>
        <strong class="player-points">${points(g.pontos)} pts</strong>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="player-stats">
          <span>Vitórias: ${g.vitorias}</span><span>Jogos: ${g.jogos_disputados}</span>
          <span>Defesas: ${g.defesa}</span><span>Gols: ${g.gols}</span>
          <span>Sofridos: ${g.gols_sofridos}</span><span>Empates: ${g.empate}</span>
        </div>
        <a class="goalkeeper-profile-link" href="goleiro.html?id=${encodeURIComponent(g.id)}">Ver perfil completo →</a>
      </article>`;
  }).join("") || '<p class="empty-state">Nenhum goleiro cadastrado.</p>';
}

async function load() {
  const tbody = document.getElementById("tabela-goleiros");
  const cards = document.getElementById("cards-goleiros");
  try {
    const list = normalize(await apiRequest(endpoint));
    if (tbody) renderTable(list, tbody);
    if (cards) renderCards(list, cards);
  } catch (error) {
    console.error("Erro ao carregar goleiros:", error);
    if (tbody) tbody.innerHTML = '<tr><td colspan="8">Não foi possível carregar os goleiros.</td></tr>';
    if (cards) cards.innerHTML = '<p class="empty-state">Não foi possível carregar os goleiros.</p>';
  }
}

document.addEventListener("DOMContentLoaded", load);
