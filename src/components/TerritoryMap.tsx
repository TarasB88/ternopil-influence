// @ts-nocheck -- dynamic sheet columns
import { useState } from "react";
import geo from "@/lib/ternopil-geo.json";
import { fmt, num } from "@/lib/metrics";
import type { Row } from "@/lib/sheets.functions";

const METRICS = [
  ["incidence_per_100k", "На 100 тис. населення", 1],
  ["cases_total", "Випадки всього", 0],
  ["cases_children_under_18", "Діти до 18", 0],
  ["hospitalized_total", "Госпіталізовано", 0],
] as const;

const W = 520, H = 560;
const all = geo.flatMap((g) => g.coords.flat());
const lons = all.map((c) => c[0]), lats = all.map((c) => c[1]);
const [minX, maxX, minY, maxY] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
const kx = Math.cos(((minY + maxY) / 2) * (Math.PI / 180));
const scale = Math.min((W - 20) / ((maxX - minX) * kx), (H - 20) / (maxY - minY));
const proj = ([x, y]: number[]) => [10 + (x - minX) * kx * scale, 10 + (maxY - y) * scale];
const pathOf = (coords: number[][][]) =>
  coords.map((ring) => "M" + ring.map((c) => proj(c).map((v) => v.toFixed(1)).join(",")).join("L") + "Z").join("");
const centroid = (coords: number[][][]) => {
  const pts = coords[0].map(proj);
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
};

export function TerritoryMap({ rows, selected, onSelect }: { rows: Row[]; selected: string | null; onSelect: (s: string | null) => void }) {
  const [metric, setMetric] = useState<string>("incidence_per_100k");
  const [hover, setHover] = useState<string | null>(null);
  const m = METRICS.find((x) => x[0] === metric)!;
  const val = (name: string) => num(rows.find((r) => r.administrative_territory === name)?.[metric]);
  const vals = geo.map((g) => val(g.name)).filter((v) => v !== null) as number[];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const shade = (v: number | null) => {
    if (v === null) return "var(--muted)";
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    return `color-mix(in oklch, var(--chart-1) ${Math.round(25 + t * 75)}%, var(--chart-5))`;
  };
  const info = hover ?? selected;
  const infoRow = info ? rows.find((r) => r.administrative_territory === info) : null;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-h-[460px]" role="img" aria-label="Карта районів Тернопільської області">
          {geo.map((g) => {
            const isCity = g.name === "м. Тернопіль";
            const active = selected === g.name;
            const v = val(g.name);
            const [cx, cy] = centroid(g.coords);
            return (
              <g key={g.name} className="cursor-pointer" onMouseEnter={() => setHover(g.name)} onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(active ? null : g.name)}>
                <path d={pathOf(g.coords)} fill={shade(v)}
                  stroke={active ? "var(--foreground)" : "var(--card)"} strokeWidth={active ? 3 : isCity ? 1.5 : 2}
                  opacity={selected && !active ? 0.55 : 1} className="transition-opacity" />
                {!isCity && (
                  <text x={cx} y={cy} textAnchor="middle" className="pointer-events-none fill-[var(--primary-foreground)] text-[15px] font-semibold" style={{ paintOrder: "stroke", stroke: "var(--chart-1)", strokeWidth: 3 }}>
                    <tspan x={cx}>{g.name.replace(" район", "")}</tspan>
                    <tspan x={cx} dy="18">{fmt(v, m[2])}</tspan>
                  </text>
                )}
              </g>
            );
          })}
          {(() => {
            const c = geo.find((g) => g.name === "м. Тернопіль")!;
            const [cx, cy] = centroid(c.coords);
            return (
              <g className="pointer-events-none">
                <circle cx={cx} cy={cy} r={4} fill="var(--card)" stroke="var(--foreground)" />
                <text x={cx + 10} y={cy - 8} className="text-[13px] font-semibold" fill="var(--foreground)" style={{ paintOrder: "stroke", stroke: "var(--card)", strokeWidth: 3 }}>
                  м. Тернопіль · {fmt(val("м. Тернопіль"), m[2])}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          {METRICS.map(([k, label]) => (
            <button key={k} onClick={() => setMetric(k)}
              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${metric === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </div>
        <div>
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${shade(lo)}, ${shade(hi)})` }} />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{fmt(lo, m[2])}</span><span>{fmt(hi, m[2])}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Відтінок — лише величина показника, не оцінка рівня.</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-sm">
          {infoRow ? (
            <>
              <div className="font-semibold">{info}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-2 text-xs">
                <span className="text-muted-foreground">Випадки</span><span className="text-right">{fmt(num(infoRow.cases_total))}</span>
                <span className="text-muted-foreground">Діти</span><span className="text-right">{fmt(num(infoRow.cases_children_under_18))}</span>
                <span className="text-muted-foreground">Госпіт.</span><span className="text-right">{fmt(num(infoRow.hospitalized_total))}</span>
                <span className="text-muted-foreground">На 100 тис.</span><span className="text-right">{fmt(num(infoRow.incidence_per_100k), 1)}</span>
              </div>
            </>
          ) : <span className="text-xs text-muted-foreground">Наведіть або клікніть на територію</span>}
        </div>
      </div>
    </div>
  );
}
