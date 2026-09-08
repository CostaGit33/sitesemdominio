const CLIPS_URL = "https://media.semdominio.online/clips.json";

function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char])); }
function normalizeClips(payload) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.clips) ? payload.clips : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : [];
  return list.map((item, idx) => {
    if (typeof item === "string") return { title: `Clip ${idx + 1}`, url: item, createdAt: "" };
    return { title: item?.title || item?.titulo || item?.name || item?.nome || `Clip ${idx + 1}`, url: item?.url || item?.public_url || item?.src || item?.link || item?.video || item?.file, thumb: item?.thumb || item?.thumbnail || "", createdAt: item?.created_at || item?.createdAt || item?.time || "" };
  }).filter(item => typeof item.url === "string" && item.url.trim());
}
function icon(type) { return type === "mute" ? "🔇" : type === "share" ? "↗" : type === "like" ? "♡" : "▶"; }
function renderClips(clips) {
  const feed = document.getElementById("videosGrid"); const status = document.getElementById("videosStatus"); const empty = document.getElementById("reelsStatus");
  if (!feed || !status) return;
  if (!clips.length) { status.textContent = "0 vídeos"; empty.textContent = "Nenhum clip encontrado."; return; }
  empty.classList.add("hidden"); status.textContent = `${clips.length} vídeos`;
  feed.innerHTML = clips.map((clip, idx) => `<article class="reel" data-index="${idx}"><div class="reel-loading">Carregando vídeo...</div><video playsinline loop preload="metadata" ${clip.thumb ? `poster="${esc(clip.thumb)}"` : ""}><source src="${esc(clip.url)}" type="video/mp4" /></video><button class="reel-play" aria-label="Reproduzir">▶</button><span class="reel-counter">${idx + 1}/${clips.length}</span><div class="reel-copy"><h2>${esc(clip.title)}</h2><p>${esc(clip.createdAt || "FutPontos • vídeo do baba")}</p></div><div class="reel-actions"><button class="reel-action" data-action="like" aria-label="Curtir">${icon("like")}<small>curtir</small></button><button class="reel-action" data-action="mute" aria-label="Silenciar">${icon("mute")}<small>som</small></button><button class="reel-action" data-action="share" aria-label="Compartilhar">${icon("share")}<small>enviar</small></button></div></article>`).join("");
  setupFeed();
}
function setupFeed() {
  const feed = document.getElementById("videosGrid"); const reels = [...feed.querySelectorAll(".reel")];
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { const video = entry.target.querySelector("video"); if (entry.isIntersecting && entry.intersectionRatio >= .65) { reels.forEach(other => { if (other !== entry.target) { other.classList.add("paused"); other.querySelector("video")?.pause(); } }); video.muted = true; video.play().then(() => entry.target.classList.remove("paused")).catch(() => entry.target.classList.add("paused")); } else { video.pause(); entry.target.classList.add("paused"); } }), { root: feed, threshold: [.2, .65, .9] });
  reels.forEach(reel => { observer.observe(reel); const video = reel.querySelector("video"); const play = reel.querySelector(".reel-play"); video.addEventListener("loadeddata", () => reel.querySelector(".reel-loading")?.remove()); play.addEventListener("click", () => { if (video.paused) video.play().then(() => reel.classList.remove("paused")); else { video.pause(); reel.classList.add("paused"); } }); reel.addEventListener("click", event => { const button = event.target.closest("[data-action]"); if (!button) return; const action = button.dataset.action; if (action === "like") { button.classList.toggle("liked"); button.firstChild.textContent = button.classList.contains("liked") ? "♥" : "♡"; } if (action === "mute") { video.muted = !video.muted; button.firstChild.textContent = video.muted ? "🔇" : "🔊"; } if (action === "share") { navigator.clipboard?.writeText(video.currentSrc || video.src).then(() => { button.firstChild.textContent = "✓"; setTimeout(() => button.firstChild.textContent = "↗", 1400); }); } }); });
}
async function loadClips() { try { const response = await fetch(CLIPS_URL, { cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`); renderClips(normalizeClips(await response.json())); } catch (error) { console.error("Erro ao carregar clips:", error); const status = document.getElementById("reelsStatus"); if (status) status.textContent = "Não foi possível carregar os vídeos."; } }
document.addEventListener("DOMContentLoaded", loadClips);
