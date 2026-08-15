import { desempenhoJogadores } from "./desempenho_data.js";

const radarOptions = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      min: 0,
      max: 20,
      ticks: { stepSize: 4, color: "#fff", backdropColor: "transparent", display: false },
      grid: { color: "rgba(255,255,255,0.1)" },
      angleLines: { color: "rgba(255,255,255,0.1)" },
      pointLabels: { color: "#fff", font: { size: 12 } }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  elements: { line: { tension: 0.2 } }
};

function renderDesempenho() {
  const container = document.getElementById("desempenhoContainer");
  if (!container) return;

  container.innerHTML = "";

  const jogadoresArray = Object.entries(desempenhoJogadores)
    .map(([nome, stats]) => ({
      nome,
      stats,
      media: stats.reduce((a, b) => a + b, 0) / stats.length
    }))
    .sort((a, b) => b.media - a.media);

  jogadoresArray.forEach((j, index) => {
    const percentual = Math.min((j.media / 20) * 100, 100);
    const card = document.createElement("div");
    const canvasId = `chart_desempenho_${index}`;

    card.className = "player-card";
    card.style.animation = "fadeUp .4s ease both";
    card.style.animationDelay = `${index * 0.05}s`;
    card.style.position = "relative";

    if (index === 0) card.classList.add("top-1");
    if (index === 1) card.classList.add("top-2");
    if (index === 2) card.classList.add("top-3");

    card.innerHTML = `
      <div class="player-rank" style="position:absolute;top:10px;left:10px;">#${String(index + 1).padStart(2, "0")}</div>
      <div class="media-badge" style="position:absolute;top:10px;right:10px;background:rgba(0,255,136,.2);color:#00ff88;padding:4px 8px;border-radius:8px;font-weight:bold;font-size:.8rem;">${j.media.toFixed(1)}</div>
      <h3 style="margin-top:10px;">${j.nome}</h3>
      <div class="canvas-wrapper"><canvas id="${canvasId}"></canvas></div>
      <div class="player-points" style="font-size:1.05rem;font-weight:bold;color:#00ff88;">Média Técnica</div>
      <div class="progress-bar" style="width:100%;height:4px;background:rgba(255,255,255,.1);border-radius:2px;margin:10px 0;overflow:hidden;">
        <div class="progress-fill" style="height:100%;background:#00ff88;width:${percentual}%;transition:width 1s ease-out;"></div>
      </div>
      <div class="player-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;font-size:.8rem;opacity:.8;">
        <span>Def: ${j.stats[0]}</span>
        <span>Atq: ${j.stats[1]}</span>
        <span>Vel: ${j.stats[2]}</span>
        <span>Hab: ${j.stats[3]}</span>
        <span>Passe: ${j.stats[4]}</span>
      </div>
    `;

    container.appendChild(card);

    const ctx = card.querySelector(`#${canvasId}`);
    if (ctx && typeof window.Chart === "function") {
      new window.Chart(ctx, {
        type: "radar",
        data: {
          labels: ["Defesa", "Ataque", "Velocidade", "Habilidade", "Passe"],
          datasets: [{
            data: j.stats,
            borderColor: "#00ff88",
            backgroundColor: "rgba(0,255,136,.2)",
            borderWidth: 2,
            pointBackgroundColor: "#00ff88"
          }]
        },
        options: radarOptions
      });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderDesempenho, { once: true });
} else {
  renderDesempenho();
}
