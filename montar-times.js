import { apiRequest } from "./globais.js";

const PLAYERS_ENDPOINT = "/jogadores";
const PERFORMANCE_ENDPOINT = "/desempenho";
const COLORS = ["#e53b46","#48a8ff","#36d996","#ffc529","#b77bff"];
const ATTRS = [["ataque","ATQ"],["defesa","DEF"],["velocidade","VEL"],["habilidade","HAB"],["passe","PAS"]];

let jogadores = [];
let equipes = Array.from({ length: 5 }, () => []);
let numeroTimes = 5;

const $ = id => document.getElementById(id);
const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
const initials = n => { const p=String(n).trim().split(/\s+/).filter(Boolean); return (p.length>1?p[0][0]+p.at(-1)[0]:String(p[0]||"?").slice(0,2)).toUpperCase(); };

function media(j){ const a=j.avaliacao; if(!a) return null; const vals=ATTRS.map(([k])=>num(a[k])); return vals.reduce((s,v)=>s+v,0)/5; }
function totalTecnico(j){ const a=j.avaliacao; return a ? ATTRS.reduce((s,[k])=>s+num(a[k]),0) : 0; }
function pontos(j){ return num(j.pontos); }
function escolhido(id){ return equipes.some(t=>t.some(p=>String(p.id)===String(id))); }
function timeDo(id){ return equipes.findIndex(t=>t.some(p=>String(p.id)===String(id))); }

function mergeDados(base, desempenho){
  const mapa = new Map((desempenho || []).map(j => [String(j.id), j]));
  const porNome = new Map((desempenho || []).map(j => [norm(j.nome), j]));
  return base.map(j => {
    const d = mapa.get(String(j.id)) || porNome.get(norm(j.nome));
    return { ...j, ...(d || {}), avaliacao: d?.avaliacao ?? j.avaliacao ?? null };
  });
}

async function carregar(){
  try{
    const [base, desempenho] = await Promise.all([apiRequest(PLAYERS_ENDPOINT), apiRequest(PERFORMANCE_ENDPOINT)]);
    if(!Array.isArray(base)) throw new Error("A API de jogadores não retornou uma lista válida.");
    jogadores = mergeDados(base, Array.isArray(desempenho) ? desempenho : []);
    jogadores.sort((a,b)=>{
      const ma=media(a), mb=media(b);
      if(ma!==null && mb!==null && ma!==mb) return mb-ma;
      if(ma!==null && mb===null) return -1;
      if(ma===null && mb!==null) return 1;
      return pontos(b)-pontos(a) || String(a.nome).localeCompare(String(b.nome),"pt-BR");
    });
    render();
    $("status").textContent=`${jogadores.length} jogadores carregados • dados de classificação + avaliação técnica integrados.`;
  }catch(e){
    console.error(e);
    $("status").textContent=`Erro ao carregar jogadores: ${e.message}`;
  }
}

function render(){
  renderPlayers(); renderTeams(); renderSummary();
  $("pickedCount").textContent=equipes.reduce((s,t)=>s+t.length,0);
}

function renderPlayers(){
  const q=norm($("searchPlayer").value);
  const disponiveis=jogadores.filter(j=>!escolhido(j.id) && (!q || norm(j.nome).includes(q)));
  $("availableCount").textContent=disponiveis.length;
  $("players").innerHTML=disponiveis.length ? disponiveis.map((j,i)=>playerCard(j,i)).join("") : `<div class="empty">Nenhum jogador disponível para a busca atual.</div>`;
}

function playerCard(j,i){
  const m=media(j), t=totalTecnico(j), selected=escolhido(j.id);
  const buttons=Array.from({length:numeroTimes},(_,i)=>`<button class="pick" data-id="${esc(j.id)}" data-team="${i}" ${equipes[i].length>=7?"disabled":""}>TIME ${i+1}</button>`).join("");
  return `<article class="player-card ${selected?"selected":""}" style="animation-delay:${Math.min(i*18,500)}ms">
    <div class="player-main"><div class="avatar">${esc(initials(j.nome))}</div><div class="player-info"><div class="player-name">${esc(j.nome)}</div><div class="player-meta">${pontos(j)} pts • ${num(j.vitorias)} vitórias • ${num(j.gols)} gols ${m!==null?`• <span class="mini-avg">média ${m.toFixed(1)}</span>`:"• avaliação pendente"}</div></div></div>
    <div class="attr-row">${ATTRS.map(([k,l])=>`<div class="attr"><small>${l}</small><b>${j.avaliacao?num(j.avaliacao[k]):"—"}</b></div>`).join("")}</div>
    ${m!==null?`<div class="player-meta" style="margin-top:7px">Técnico: <b>${t}/100</b> • Defesa ${num(j.avaliacao.defesa)} • Ataque ${num(j.avaliacao.ataque)}</div>`:"<div class="player-meta" style="margin-top:7px">Este jogador ainda não possui avaliação técnica.</div>"}
    <div class="pick-row">${buttons}</div>
  </article>`;
}

function renderTeams(){
  $("teams").innerHTML=equipes.slice(0,numeroTimes).map((t,i)=>{
    const tecn=t.reduce((s,p)=>s+totalTecnico(p),0), avg=t.length?tecn/(t.length*5):0;
    return `<article class="team" style="--team:${COLORS[i]}"><div class="team-head"><div><h3>TIME ${i+1}</h3><div class="team-count">${t.length}/7 jogadores ${t.length>=7?"• COMPLETO":""}</div></div><div class="team-total">${tecn}<div class="team-avg">média ${avg.toFixed(1)}</div></div></div><div class="members">${t.length?t.map(p=>`<div class="member"><div class="avatar">${esc(initials(p.nome))}</div><div class="member-name">${esc(p.nome)}<br><span class="player-meta">${media(p)!==null?`Média ${media(p).toFixed(1)} • ${pontos(p)} pts`:`Sem avaliação`}</span></div><button class="remove" data-remove="${esc(p.id)}" title="Remover">×</button></div>`).join(""):"<div class="empty">Nenhum jogador selecionado</div>"}</div></article>`;
  }).join("");
}

function renderSummary(){
  $("summary").innerHTML=equipes.slice(0,numeroTimes).map((t,i)=>{
    const pts=t.reduce((s,p)=>s+pontos(p),0), avg=t.length?t.reduce((s,p)=>s+(media(p)??0),0)/t.length:0;
    return `<div class="summary"><strong style="color:${COLORS[i]}">TIME ${i+1}</strong><span>${t.length}/7 jogadores • ${pts} pontos de classificação • média técnica ${avg.toFixed(1)}</span></div>`;
  }).join("");
}

function adicionar(id,time){
  const j=jogadores.find(p=>String(p.id)===String(id)); if(!j) return;
  if(equipes[time].length>=7){ $("status").textContent=`Time ${time+1} já está completo (7 jogadores).`; return; }
  if(escolhido(id)) return;
  equipes[time].push(j); render(); $("status").textContent=`${j.nome} foi escolhido para o Time ${time+1}.`;
}
function remover(id){ const i=timeDo(id); if(i>=0){const j=equipes[i].find(p=>String(p.id)===String(id)); equipes[i]=equipes[i].filter(p=>String(p.id)!==String(id)); render(); $("status").textContent=`${j?.nome||"Jogador"} removido do Time ${i+1}.`;}}
function alterarNumero(){ const novo=Number($("teamCount").value); for(let i=novo;i<5;i++){ equipes[i]=[]; } numeroTimes=novo; render(); }

$("players").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b)addicionar(b.dataset.id,Number(b.dataset.team));});
$("teams").addEventListener("click",e=>{const b=e.target.closest("button[data-remove]");if(b)remover(b.dataset.remove);});
$("searchPlayer").addEventListener("input",renderPlayers);
$("teamCount").addEventListener("change",alterarNumero);
$("clearAll").addEventListener("click",()=>{equipes=Array.from({length:5},()=>[]);render();$("status").textContent="Todas as escolhas foram removidas.";});
carregar();
