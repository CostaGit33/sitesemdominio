const CLIPS_URL = "https://media.semdominio.online/clips.json";

function normalizeClips(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.clips)
      ? payload.clips
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

  return list
    .map((item, idx) => {
      if (typeof item === "string") {
        return { title: `Clip ${idx + 1}`, url: item };
      }

      const title = item?.title || item?.titulo || item?.name || item?.nome || `Clip ${idx + 1}`;
      const url = item?.url || item?.public_url || item?.src || item?.link || item?.video || item?.file;
      const thumb = item?.thumb || item?.thumbnail || "";

      return { title, url, thumb };
    })
    .filter(item => typeof item.url === "string" && item.url.trim().length > 0);
}

function renderClips(clips) {
  const grid = document.getElementById("videosGrid");
  const status = document.getElementById("videosStatus");
  if (!grid || !status) return;

  if (!clips.length) {
    status.textContent = "Nenhum clip encontrado no JSON.";
    grid.innerHTML = "";
    return;
  }

  status.textContent = `${clips.length} clip(s) carregado(s) de media.semdominio.online`;

  grid.innerHTML = clips.map((clip, idx) => `
    <article class="video-card">
      <h3>${clip.title}</h3>
      <video controls preload="metadata" playsinline ${idx === 0 ? "autoplay muted" : ""}>
        <source src="${clip.url}" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>
    </article>
  `).join("");
}

async function loadClips() {
  const status = document.getElementById("videosStatus");

  try {
    const response = await fetch(CLIPS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const clips = normalizeClips(payload);
    renderClips(clips);
  } catch (error) {
    console.error("Erro ao carregar clips:", error);
    if (status) {
      status.textContent = "Erro ao carregar clips.json. Verifique CORS/URL/formato do JSON.";
    }
  }
}

document.addEventListener("DOMContentLoaded", loadClips);
