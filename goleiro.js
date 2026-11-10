import { apiRequest } from "./globais.js";

const state = document.getElementById("playerState");
const root = document.getElementById("playerProfile");
const id = new URLSearchParams(location.search).get("id");
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const fmt = value => n(value).toLocaleString("pt-BR");

function metric(label,value){return `<article class="goalkeeper-metric"><strong>${fmt(value)}</strong><span>${label}</span></article>`;}
function photo(g){const url=typeof g.foto==="string"&&/^https?:\/\//i.test(g.foto)?g.foto:"futponts_large.png";return `<img class="goalkeeper-profile-photo" src="${esc(url)}" alt="Foto de ${esc(g.nome)}" onerror="this.onerror=null;this.src='futponts_large.png'">`;}

function render(g,matches,evolution){
  document.title=`${g.nome} | Goleiros • FutPontos`;
  const avg=n(g.media_gols_sofridos);
  const win=n(g.aproveitamento_vitorias);
  root.hidden=false;state.hidden=true;
  root.innerHTML=`
    <section class="reference-hero">
      <a class="hero-back" href="goleiros.html" aria-label="Voltar ao ranking">‹</a>
      <div class="hero-watermark">FP</div>
      <div class="hero-player">${photo(g)}
        <p class="eyebrow">FUTPONTOS / CATEGORIA GOLEIROS</p>
        <h1>${esc(g.nome)}</h1>
        <div class="hero-meta"><span>${fmt(g.pontos)} pontos</span><span>${esc(g.competencia||"Competência atual")}</span></div>
      </div>
    </section>
    <nav class="profile-tabs reference-tabs" aria-label="Seções do perfil">
      <a class="active" href="#geral">Visão geral</a><a href="#estatisticas">Estatísticas</a><a href="#partidas">Partidas</a><a href="#evolucao">Evolução</a>
    </nav>
    <section class="reference-content" id="geral">
      <div class="section-heading"><h2>Resumo da temporada</h2></div>
      <div class="goalkeeper-metrics">
        ${metric("Pontos",g.pontos)}${metric("Jogos",g.jogos_disputados)}
        ${metric("Vitórias",g.vitorias)}${metric("Empates",g.empates??g.empate)}
        ${metric("Derrotas",g.derrotas)}${metric("Defesas",g.defesas??g.defesa)}
      </div>
    </section>
    <section class="reference-content" id="estatisticas">
      <div class="section-heading"><h2>Estatísticas de goleiro</h2></div>
      <div class="goalkeeper-metrics">
        ${metric("Gols marcados",g.gols)}${metric("Gols sofridos",g.gols_sofridos)}
        ${metric("Média de gols sofridos",avg.toFixed(2))}${metric("Aproveitamento",win.toFixed(1)+"%")}
        ${metric("Infrações",g.infracoes)}
      </div>
    </section>
    <section class="reference-content" id="partidas">
      <div class="section-heading"><h2>Histórico de partidas</h2></div>
      <div class="goalkeeper-history">${matches.length?matches.map(m=>`<article><div><strong>${esc(String(m.resultado||"").toUpperCase())}</strong><br><small>${esc(m.competencia||"")} · ${m.registrada_em?new Date(m.registrada_em).toLocaleDateString("pt-BR"):""}</small><br><small>${fmt(m.defesas)} defesas · ${fmt(m.gols)} gols · ${fmt(m.gols_sofridos)} sofridos</small></div><strong>${fmt(m.pontos)} pts</strong></article>`).join(""):'<p>Nenhuma partida registrada.</p>'}</div>
    </section>
    <section class="reference-content" id="evolucao">
      <div class="section-heading"><h2>Evolução por competência</h2></div>
      <div class="goalkeeper-history">${evolution.length?evolution.map(e=>`<article><div><strong>${esc(e.nome||e.chave||"Competência")}</strong><br><small>${fmt(e.jogos_disputados)} jogos · ${fmt(e.defesas)} defesas · ${fmt(e.gols_sofridos)} gols sofridos</small></div><strong>${fmt(e.pontos)} pts</strong></article>`).join(""):'<p>Ainda não há histórico de competências.</p>'}</div>
    </section>`;
}

async function load(){
  if(!id){state.textContent="Goleiro não informado. Volte ao ranking de goleiros.";return;}
  try{
    const [g,matches,evolution]=await Promise.all([
      apiRequest(`/goleiros/${encodeURIComponent(id)}`),
      apiRequest(`/goleiros/${encodeURIComponent(id)}/partidas`),
      apiRequest(`/goleiros/${encodeURIComponent(id)}/evolucao`)
    ]);
    if(!g||!g.id)throw new Error("Goleiro não encontrado.");
    render(g,Array.isArray(matches)?matches:[],Array.isArray(evolution)?evolution:[]);
  }catch(error){state.textContent=error.message||"Não foi possível carregar o perfil do goleiro.";state.className="player-error";}
}
load();
