function polar(cx: number, cy: number, r: number, a: number): [number, number] {
  const rad = (a - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a1);
  const [x1, y1] = polar(cx, cy, r, a0);
  const big = a1 - a0 <= 180 ? 0 : 1;
  return `M${x0} ${y0} A${r} ${r} 0 ${big} 0 ${x1} ${y1}`;
}

export function gaugeSVG(pct: number): string {
  const s = -120, e = 120, sw = e - s;
  const v = s + (pct / 100) * sw;
  const col = pct >= 80 ? "var(--ok)" : pct >= 60 ? "var(--warn)" : "var(--bad)";
  return `<svg width="170" height="140" viewBox="0 0 170 140"><path d="${arc(85,90,66,s,e)}" stroke="var(--panel-3)" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${arc(85,90,66,s,v)}" stroke="${col}" stroke-width="11" fill="none" stroke-linecap="round"/></svg>`;
}

export function areaForecastSVG(hist: number[], fc: number[]): string {
  const w = 620, h = 200, pad = 18;
  const all = [...hist, ...fc.slice(1)];
  const mn = Math.min(...all) - 3, mx = Math.max(...all) + 3, rng = mx - mn;
  const n = all.length - 1, step = (w - pad * 2) / n;
  const X = (i: number) => pad + i * step;
  const Y = (v: number) => h - pad - ((v - mn) / rng) * (h - pad * 2);
  const hp = hist.map((v, i) => (i ? "L" : "M") + X(i) + " " + Y(v)).join(" ");
  const hi = hist.length - 1;
  const fp = fc.map((v, i) => (i ? "L" : "M") + X(hi + i) + " " + Y(v)).join(" ");
  const ha = hp + ` L${X(hi)} ${h - pad} L${X(0)} ${h - pad} Z`;
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const y = pad + i * ((h - pad * 2) / 4);
    g += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="overflow:visible">${g}<path d="${ha}" fill="var(--brand)" opacity=".08"/><path d="${hp}" fill="none" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round"/><path d="${fp}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-dasharray="5 5" stroke-linejoin="round"/><circle cx="${X(hi)}" cy="${Y(hist[hi])}" r="3.5" fill="var(--brand)"/><circle cx="${X(all.length - 1)}" cy="${Y(all[all.length - 1])}" r="3.5" fill="var(--accent)"/></svg>`;
}

export function miniSparkSVG(data: number[], w: number, h: number, color: string, fill = true): string {
  if (!data.length) return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
  const mn = Math.min(...data), mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pad = 2;
  const X = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const Y = (v: number) => h - pad - ((v - mn) / rng) * (h - pad * 2);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = fill ? `<path d="${path} L${X(data.length-1).toFixed(1)} ${h} L${pad} ${h} Z" fill="${color}" opacity=".12"/>` : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${area}<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}

export function fullChartSVG(data: number[], w: number, h: number, color: string, label: string, unit = '%', maxVal?: number): string {
  const pad = { t: 10, r: 10, b: 28, l: 36 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const mn = 0, mx = maxVal ?? Math.max(...data, 1);
  const X = (i: number) => pad.l + (i / (data.length - 1)) * cw;
  const Y = (v: number) => pad.t + ch - ((v - mn) / (mx - mn)) * ch;
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `<path d="${path} L${X(data.length-1).toFixed(1)} ${Y(0).toFixed(1)} L${X(0).toFixed(1)} ${Y(0).toFixed(1)} Z" fill="${color}" opacity=".1"/>`;
  let grid = '';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = mn + (mx - mn) * (i / steps);
    const y = Y(v);
    grid += `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${w - pad.r}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`;
    grid += `<text x="${(pad.l - 4).toFixed(0)}" y="${(y + 3).toFixed(0)}" fill="var(--ink-3)" font-size="9" font-family="var(--mono)" text-anchor="end">${Math.round(v)}${unit}</text>`;
  }
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible">${grid}${area}<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><circle cx="${X(data.length-1).toFixed(1)}" cy="${Y(data[data.length-1]).toFixed(1)}" r="3" fill="${color}"/></svg>`;
}

export function upTimelineSVG(segments: {up: boolean; frac: number}[], w: number, h: number): string {
  let x = 0;
  const rects = segments.map(s => {
    const sw = s.frac * w;
    const r = `<rect x="${x.toFixed(1)}" y="0" width="${sw.toFixed(1)}" height="${h}" fill="${s.up ? 'var(--ok)' : 'var(--bad)'}" opacity="${s.up ? '0.7' : '0.8'}"/>`;
    x += sw;
    return r;
  }).join('');
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="border-radius:4px;overflow:hidden">${rects}</svg>`;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

export function makeSeries(n: number, base: number, noise: number, seed: number, trend = 0): number[] {
  const r = rng(seed);
  return Array.from({length: n}, (_, i) => {
    const wave = Math.sin(i * 0.18) * noise * 0.4 + Math.sin(i * 0.07) * noise * 0.3;
    const rand = (r() - 0.5) * noise;
    return Math.max(0, Math.min(100, base + wave + rand + trend * i / n));
  });
}

export function tempChartSVG(temps: number[]): string {
  const mn = 55, mx = 92, n = temps.length - 1, step = (620 - 36) / n;
  const Y = (v: number) => 180 - 18 - ((v - mn) / (mx - mn)) * (180 - 36);
  const ty = Y(85);
  const p = temps.map((v, i) => (i ? "L" : "M") + (18 + i * step) + " " + Y(v)).join(" ");
  return `<svg viewBox="0 0 620 180" width="100%" height="180" style="overflow:visible">
    <line x1="18" y1="${ty}" x2="602" y2="${ty}" stroke="var(--bad)" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="600" y="${ty - 5}" fill="var(--bad)" font-size="10" font-family="var(--mono)" text-anchor="end">85°C</text>
    <path d="${p} L${18 + n * step} 162 L18 162 Z" fill="var(--bad)" opacity=".08"/>
    <path d="${p}" fill="none" stroke="var(--bad)" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="${18 + n * step}" cy="${Y(temps[n])}" r="4" fill="var(--bad)"/>
  </svg>`;
}
