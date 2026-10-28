import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Activity, AlertTriangle, Baby, BedDouble, Download, RefreshCw, RotateCcw, Search, Syringe, Users, X,
  ArrowUpDown, ShieldPlus, Microscope, HeartPulse, MapPin, CalendarDays, Stethoscope,
  ChartNoAxesCombined, Thermometer, Hospital, ShieldCheck, ClipboardList,
} from "lucide-react";
import * as XLSX from "xlsx";
import { getDashboardData, type Row } from "@/lib/sheets.functions";
import {
  AGE_GROUPS, RECORD_TYPE_LABEL, RISK_GROUPS, fmt, intensityLevel, levelLabel, listWeeks, num,
  territorial, totalRow, weekKey, type Level,
} from "@/lib/metrics";

const dataQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardData(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Грип, ГРВІ, COVID-19 та вакцинація — Тернопільська область" },
      { name: "description", content: "Щотижневий епідемічний дашборд: захворюваність, госпіталізації, інтенсивність і щеплення проти грипу." },
      { property: "og:title", content: "Епідмоніторинг Тернопільщини" },
      { property: "og:description", content: "Щотижневі дані про грип, ГРВІ, COVID-19 та вакцинацію." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: Dashboard,
});

const CH = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const LEVEL_COLOR: Record<Level, string> = {
  below: "var(--level-below)", low: "var(--level-low)", medium: "var(--level-medium)",
  high: "var(--level-high)", nodata: "var(--muted-foreground)",
};
const fmtDate = (d: string | null) => (d ? d.split("-").reverse().join(".") : "—");
const shortName = (s: string | null) => (s ?? "").replace(" район", "");

function Dashboard() {
  const { data, refetch, isFetching } = useSuspenseQuery(dataQuery);
  const weeks = useMemo(() => listWeeks(data.respiratory), [data.respiratory]);
  const [week, setWeek] = useState(weeks[weeks.length - 1] ?? "");
  const [territory, setTerritory] = useState<string | null>(null);

  const weekRows = data.respiratory.filter((r) => weekKey(r) === week);
  const terr = territorial(weekRows);
  const total = totalRow(weekRows);
  const focus = territory ? terr.find((r) => r.administrative_territory === territory) : total;
  const prevWeek = weeks[weeks.indexOf(week) - 1];
  const prevRows = data.respiratory.filter((r) => weekKey(r) === prevWeek);
  const prevFocus = territory
    ? prevRows.find((r) => r.administrative_territory === territory)
    : totalRow(prevRows);

  const resetAll = () => { setTerritory(null); setWeek(weeks[weeks.length - 1] ?? ""); };
  const sample = weekRows[0];

  return (
    <div className="min-h-screen">
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 text-white shadow-lg">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute right-24 top-12 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-96 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="hidden shrink-0 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner backdrop-blur-sm sm:block">
                <ShieldPlus className="h-12 w-12 text-cyan-200" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/25 bg-teal-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100">
                  <Microscope className="h-3.5 w-3.5" />
                  Епідеміологічний нагляд · Тернопільська область
                </div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-4xl">Грип, ГРВІ та COVID-19</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/80 md:text-base">
                  Щотижневий моніторинг захворюваності, госпіталізацій, епідемічної інтенсивності та вакцинації
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-cyan-50/90">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><HeartPulse className="h-3.5 w-3.5 text-rose-200" /> Захворюваність</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><Hospital className="h-3.5 w-3.5 text-sky-200" /> Госпіталізації</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><Syringe className="h-3.5 w-3.5 text-emerald-200" /> Вакцинація</span>
                </div>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/15 bg-slate-950/25 p-4 shadow-xl backdrop-blur-sm sm:w-auto sm:min-w-[260px]">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/75"><CalendarDays className="h-4 w-4" /> Звітний період</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-semibold text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Дані дашборду</span>
              </div>
              <div className="mt-3 text-sm text-white/70">Тиждень {sample?.week ?? "—"} / {sample?.year ?? "—"}</div>
              <div className="mt-1 text-lg font-bold tracking-tight md:text-xl">{fmtDate(sample?.period_start ?? null)} – {fmtDate(sample?.period_end ?? null)}</div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs text-cyan-100/65"><MapPin className="h-3.5 w-3.5" /> Тернопільська область, Україна</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Тиждень</span>
            <select value={week} onChange={(e) => setWeek(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
              {weeks.map((w) => <option key={w} value={w}>{w.replace("-", " / тиж. ")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Територія</span>
            <select value={territory ?? ""} onChange={(e) => setTerritory(e.target.value || null)} className="rounded-md border bg-background px-2 py-1.5">
              <option value="">Уся область</option>
              {terr.map((r) => <option key={r.administrative_territory!}>{r.administrative_territory}</option>)}
            </select>
          </label>
          <div className="ml-auto flex items-center gap-2">
            {territory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                {territory}
                <button onClick={() => setTerritory(null)} aria-label="Прибрати фільтр"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={resetAll} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> Скинути
            </button>
            <button onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Оновити
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        {data.error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4" /> {data.error}
          </div>
        )}

        <TopEpidemiologyStatus current={total} />

        <RespiratorySituation week={week} sample={sample} current={total} previous={totalRow(prevRows)} fetchedAt={data.fetchedAt} />


        <Kpis focus={focus} prev={prevFocus} prevWeek={prevWeek} label={territory ?? "Уся область"} />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3" title="Випадки за територіями" sub="Клікніть стовпчик, щоб відфільтрувати. Підсумок не входить до ранжування.">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...terr].sort((a, b) => (num(b.cases_total) ?? 0) - (num(a.cases_total) ?? 0)).map((r) => ({ name: shortName(r.administrative_territory), full: r.administrative_territory, Випадки: num(r.cases_total), Діти: num(r.cases_children_under_18) }))} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Випадки" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: { full: string }) => setTerritory(d.full === territory ? null : d.full)}>
                  {terr.map((r, i) => <Cell key={i} fill={"var(--chart-1)"} />)}
                </Bar>
                <Bar dataKey="Діти" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="lg:col-span-2" title="Діти та дорослі" sub={`${territory ?? "Уся область"} · дорослі = всього − діти до 18`}>
            <ChildAdult r={focus} />
          </Card>
        </div>

        <Card title="Порівняння територій" sub="Території громад/районів і підсумок по Тернопільській області · значення джерела, без перерахунків">
          <TerritoryTable rows={total ? [...terr, total] : terr} selected={territory} onSelect={setTerritory} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Вікова структура випадків" sub="Вікові групи дітей; «діти до 18» і «школярі» — окремі, перехресні категорії, не сумуються">
            <AgeChart r={focus} />
          </Card>
          <Card title="Інтенсивність на 100 тис. населення" sub="Рівень показано лише там, де джерело має пороги">
            <Intensity total={total} />
          </Card>
        </div>

        {weeks.length >= 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Динаміка захворюваності на 100 тис. населення" sub={`Епідемічні пороги показані окремими лініями · ${territory ?? "Уся область"} · доступно тижнів: ${weeks.length}`}>
              <IncidenceTrend rows={data.respiratory} weeks={weeks} territory={territory} />
            </Card>
            <Card title="Динаміка абсолютної кількості випадків" sub={`Кількість випадків без ліній епідемічних порогів · ${territory ?? "Уся область"} · доступно тижнів: ${weeks.length}`}>
              <CasesTrend rows={data.respiratory} weeks={weeks} territory={territory} />
            </Card>
          </div>
        )}

        <Vaccination rows={data.vaccination} week={week} />

        <footer className="pb-6 text-center text-xs text-muted-foreground">
          Джерело: Google Sheets (weekly_respiratory, weekly_vaccination) · оновлено {new Date(data.fetchedAt).toLocaleString("uk-UA")}
        </footer>
      </main>
    </div>
  );
}

function Card({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  const Icon = title.includes("територ") || title.includes("Територ") ? MapPin
    : title.includes("Випадки") || title.includes("захворюван") || title.includes("Динаміка") ? ChartNoAxesCombined
    : title.includes("Діти") || title.includes("Вікова") ? Baby
    : title.includes("Інтенсивність") || title.includes("поріг") ? Thermometer
    : title.includes("вакцин") || title.includes("щепл") ? Syringe
    : title.includes("епідем") || title.includes("Якість") ? ShieldCheck
    : title.includes("госпітал") ? Hospital
    : title.includes("ризик") ? AlertTriangle
    : ClipboardList;
  return (
    <section className={`rounded-xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="section-title">{title}</h2>
          {sub && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{sub}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}



type GeoFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
};

function DistrictMap({ rows, selected, onSelect }: { rows: Row[]; selected: string | null; onSelect: (s: string | null) => void }) {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [geoError, setGeoError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("https://raw.githubusercontent.com/slawomirmatuszak/ukrainian_geodata/main/rayony.geojson")
      .then((r) => { if (!r.ok) throw new Error("GeoJSON unavailable"); return r.json(); })
      .then((data: { features?: GeoFeature[] }) => {
        if (!active) return;
        const wanted = ["кременецький", "тернопільський", "чортківський", "kremenets", "ternopil", "chortkiv"];
        const found = (data.features ?? []).filter((f) => {
          const props = Object.values(f.properties ?? {}).filter((v) => typeof v === "string").join(" ").toLocaleLowerCase("uk-UA");
          return wanted.some((n) => props.includes(n)) && !!f.geometry;
        });
        setFeatures(found);
        setGeoError(found.length === 0);
      })
      .catch(() => { if (active) setGeoError(true); });
    return () => { active = false; };
  }, []);

  const selectedRows = [
    { key: "кременецький", label: "Кременецький район", aliases: ["кременецький район", "кременецький"], color: "var(--chart-1)" },
    { key: "тернопільський", label: "Тернопільський район", aliases: ["тернопільський район", "тернопільський"], color: "var(--chart-2)" },
    { key: "чортківський", label: "Чортківський район", aliases: ["чортківський район", "чортківський"], color: "var(--chart-3)" },
  ];
  const findRow = (aliases: string[]) => rows.find((r) => aliases.some((a) => (r.administrative_territory ?? "").toLocaleLowerCase("uk-UA").includes(a)));
  const cityRow = rows.find((r) => {
    const n = (r.administrative_territory ?? "").toLocaleLowerCase("uk-UA");
    return n.includes("терноп") && (n.includes("м.") || n.includes("місто") || n === "тернопіль");
  });
  const allCoords: number[][] = [];
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) {
      if (v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") allCoords.push([v[0], v[1]]);
      else v.forEach(collect);
    }
  };
  features.forEach((f) => collect(f.geometry?.coordinates));
  const minLon = allCoords.length ? Math.min(...allCoords.map((p) => p[0])) : 25.0;
  const maxLon = allCoords.length ? Math.max(...allCoords.map((p) => p[0])) : 26.7;
  const minLat = allCoords.length ? Math.min(...allCoords.map((p) => p[1])) : 48.5;
  const maxLat = allCoords.length ? Math.max(...allCoords.map((p) => p[1])) : 50.3;
  const project = (coord: number[]) => {
    const x = 30 + ((coord[0] - minLon) / Math.max(0.0001, maxLon - minLon)) * 840;
    const y = 25 + ((maxLat - coord[1]) / Math.max(0.0001, maxLat - minLat)) * 510;
    return [x, y];
  };
  const ringsToPath = (coordinates: unknown): string => {
    const paths: string[] = [];
    const walk = (v: unknown): void => {
      if (!Array.isArray(v)) return;
      if (v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") return;
      if (v.length && Array.isArray(v[0]) && typeof v[0][0] === "number" && typeof v[0][1] === "number") {
        const pts = (v as number[][]).map(project);
        if (pts.length) paths.push("M " + pts.map((p) => p.join(" ")).join(" L ") + " Z");
      } else v.forEach(walk);
    };
    walk(coordinates);
    return paths.join(" ");
  };
  const featureLabel = (f: GeoFeature) => Object.values(f.properties ?? {}).find((v) => typeof v === "string" && ["кременецький", "тернопільський", "чортківський", "kremenets", "ternopil", "chortkiv"].some((n) => v.toLocaleLowerCase("uk-UA").includes(n))) as string | undefined;
  const getFeatureGroup = (f: GeoFeature) => {
    const label = (featureLabel(f) ?? Object.values(f.properties ?? {}).join(" ")).toLocaleLowerCase("uk-UA");
    return selectedRows.find((d) => label.includes(d.key) || (d.key === "кременецький" && label.includes("kremenets")) || (d.key === "тернопільський" && label.includes("ternopil")) || (d.key === "чортківський" && label.includes("chortkiv")));
  };
  const cityPoint = project([25.5948, 49.5535]);
  const citySelected = !!selected && !!cityRow && selected === cityRow.administrative_territory;

  // If the source has no explicit epidemiological thresholds, use a transparent
  // fallback scale based on incidence per 100,000 so polygons still show the indicator.
  const mapLevel = (row: Row | undefined): Level => {
    if (!row) return "nodata";
    const incidence = num(row.incidence_per_100k);
    if (incidence === null) return "nodata";
    const low = num(row.intensity_low_threshold);
    const medium = num(row.intensity_medium_threshold);
    const high = num(row.intensity_high_threshold);
    if (low !== null && medium !== null && high !== null) return intensityLevel(row);
    if (incidence >= 1000) return "high";
    if (incidence >= 500) return "medium";
    if (incidence > 0) return "low";
    return "below";
  };
  const mapFill = (row: Row | undefined) => {
    const level = mapLevel(row);
    const colors: Record<Level, string> = {
      below: "#d9f0e3",
      low: "#91cfb0",
      medium: "#f6c85f",
      high: "#d95f59",
      nodata: "#d1d5db",
    };
    return colors[level];
  };

  return (
    <Card title="Карта епідемічної ситуації за районами та м. Тернопіль" sub="Колір показує захворюваність на 100 тис. населення; натисніть район для фільтрації.">
      {geoError ? (
        <p className="text-sm text-muted-foreground">Не вдалося завантажити географічні межі. Перевірте підключення до джерела GeoJSON.</p>
      ) : features.length === 0 ? (
        <p className="text-sm text-muted-foreground">Завантаження географічних меж районів…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-lg border bg-muted/20">
            <svg viewBox="0 0 900 560" role="img" aria-label="Карта Кременецького, Тернопільського, Чортківського районів і міста Тернополя" className="mx-auto h-auto max-h-[340px] w-full max-w-[560px]">
              {features.map((f, i) => {
                const group = getFeatureGroup(f);
                const row = group ? findRow(group.aliases) : undefined;
                const level = mapLevel(row);
                const fill = mapFill(row);
                return <path key={i} d={ringsToPath(f.geometry?.coordinates)} fill={fill} fillOpacity={selected && group && !group.aliases.some((a) => selected.toLocaleLowerCase("uk-UA").includes(a)) ? 0.35 : 0.88} stroke="var(--border)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => group && row && onSelect(selected === row.administrative_territory ? null : row.administrative_territory ?? null)}><title>{group?.label ?? featureLabel(f) ?? "Район"} · {row ? fmt(num(row.cases_total)) + " випадків; " + fmt(num(row.incidence_per_100k), 1) + " на 100 тис." : "немає відповідного рядка даних"}</title></path>;
              })}
              <line x1={cityPoint[0] - 7} y1={cityPoint[1]} x2={cityPoint[0] + 7} y2={cityPoint[1]} stroke="var(--foreground)" strokeWidth="2.5" />
              <line x1={cityPoint[0]} y1={cityPoint[1] - 7} x2={cityPoint[0]} y2={cityPoint[1] + 7} stroke="var(--foreground)" strokeWidth="2.5" />
              <circle cx={cityPoint[0]} cy={cityPoint[1]} r="5" fill={mapFill(cityRow)} stroke="var(--background)" strokeWidth="2" />
              <text x={cityPoint[0] + 10} y={cityPoint[1] - 10} fontSize="15" fontWeight="700" fill="var(--foreground)" stroke="var(--background)" strokeWidth="3" paintOrder="stroke">м. Тернопіль</text>
            </svg>
          </div>
          <div className="space-y-3">
            {selectedRows.map((group) => {
              const row = findRow(group.aliases);
              const active = !!row && selected === row.administrative_territory;
              return <button key={group.key} onClick={() => row && onSelect(active ? null : row.administrative_territory ?? null)} className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${active ? "border-primary bg-accent" : "bg-card"}`}>
                <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: mapFill(row) }} />{group.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span className="text-muted-foreground">Випадки</span><strong className="text-right">{fmt(num(row?.cases_total))}</strong><span className="text-muted-foreground">На 100 тис.</span><strong className="text-right">{fmt(num(row?.incidence_per_100k), 1)}</strong><span className="text-muted-foreground">Рівень</span><span className="text-right">{row ? levelLabel[intensityLevel(row)] : "Немає даних"}</span></div>
              </button>;
            })}
            <button onClick={() => cityRow && onSelect(citySelected ? null : cityRow.administrative_territory ?? null)} className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${citySelected ? "border-primary bg-accent" : "bg-card"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: mapFill(cityRow) }} />м. Тернопіль</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span className="text-muted-foreground">Випадки</span><strong className="text-right">{fmt(num(cityRow?.cases_total))}</strong><span className="text-muted-foreground">На 100 тис.</span><strong className="text-right">{fmt(num(cityRow?.incidence_per_100k), 1)}</strong><span className="text-muted-foreground">Рівень</span><span className="text-right">{cityRow ? levelLabel[intensityLevel(cityRow)] : "Немає окремого рядка"}</span></div>
            </button>
            <div className="rounded-md border p-3"><p className="mb-2 text-xs font-semibold">Захворюваність на 100 тис. населення</p><div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d9f0e3"}} />0 / нижче порогу</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#91cfb0"}} />Низька</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#f6c85f"}} />Середня</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d95f59"}} />Висока</span><span className="col-span-2 flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d1d5db"}} />Немає значення показника</span></div><p className="mt-2 text-[11px] text-muted-foreground">Якщо в таблиці є офіційні пороги інтенсивності, використовуються вони; інакше застосовано технічну шкалу: &lt;500, 500–999, ≥1000 на 100 тис.</p></div>
            <p className="text-xs text-muted-foreground">Геодані: <a className="underline" href="https://github.com/slawomirmatuszak/ukrainian_geodata" target="_blank" rel="noreferrer">Ukrainian geodata (CC BY 4.0)</a>. Маркер міста — координати центру Тернополя; це не адміністративний контур міста.</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function TopEpidemiologyStatus({ current }: { current?: Row }) {
  const incidence = num(current?.incidence_per_100k);
  const threshold = num(current?.intensity_low_threshold);
  const thresholdKnown = incidence !== null && threshold !== null;
  const exceeded = thresholdKnown && incidence >= threshold;
  const level: Level = thresholdKnown && incidence < threshold ? "below" : current ? intensityLevel(current) : "nodata";
  const thresholdTone = !thresholdKnown
    ? "border-muted bg-muted/40"
    : exceeded
      ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
      : "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30";
  const levelTone: Record<Level, string> = {
    below: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
    low: "border-lime-300 bg-lime-50 dark:border-lime-900 dark:bg-lime-950/30",
    medium: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    high: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
    nodata: "border-muted bg-muted/40",
  };
  const thresholdText = !thresholdKnown ? "Немає даних для оцінки" : exceeded ? "Епідпоріг перевищено" : "Епідпоріг не перевищено";
  const levelText: Record<Level, string> = {
    below: "Фоновий",
    low: "Низький",
    medium: "Середній",
    high: "Високий",
    nodata: "Немає даних про рівень інтенсивності",
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className={`rounded-xl border-2 p-5 shadow-sm ${thresholdTone}`} aria-live="polite">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Епідемічний поріг</div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${!thresholdKnown ? "bg-muted-foreground" : exceeded ? "bg-red-600" : "bg-emerald-600"}`} />
          <h2 className="text-xl font-bold">{thresholdText}</h2>
        </div>
        <p className="mt-2 text-sm">Обласна захворюваність: <strong>{fmt(incidence, 1)}</strong> на 100 тис. населення</p>
        <p className="text-sm">Поріг низької інтенсивності: <strong>{fmt(threshold, 1)}</strong> на 100 тис.</p>
      </section>
      <section className={`rounded-xl border-2 p-5 shadow-sm ${levelTone[level]}`} aria-live="polite">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Рівень інтенсивності епідемічного процесу</div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${LEVEL_COLOR[level]}`} />
          <h2 className="text-xl font-bold">{levelText[level]}</h2>
        </div>
        <p className="mt-2 text-sm">Показник захворюваності: <strong>{fmt(incidence, 1)}</strong> на 100 тис. населення</p>
        <p className="text-sm">Оцінка визначається за порогами, що надійшли з джерела даних.</p>
      </section>
    </div>
  );
}

function RespiratorySituation({ week, sample, current, previous, fetchedAt }: { week: string; sample?: Row; current?: Row; previous?: Row; fetchedAt: string }) {
  const n = (row: Row | undefined, key: string) => num(row?.[key]);
  const optionalMetric = (row: Row | undefined, keys: string[]) => {
    const key = keys.find((k) => row?.[k] !== undefined);
    return key ? num(row?.[key]) : null;
  };
  const fmtPct = (v: number | null) => v === null ? "—" : fmt(v, 1);
  const deltaPct = (now: number | null, before: number | null) =>
    now === null || before === null || before === 0 ? null : (now - before) / before * 100;
  const trend = (now: number | null, before: number | null) => {
    const d = deltaPct(now, before);
    if (d === null) return "—";
    return `${d > 0 ? "+" : ""}${fmt(d, 1)}%`;
  };
  const cases = n(current, "cases_total");
  const prevCases = n(previous, "cases_total");
  const incidence = n(current, "incidence_per_100k");
  const lowThreshold = n(current, "intensity_low_threshold");
  const belowThreshold = incidence !== null && lowThreshold !== null && lowThreshold > 0
    ? (lowThreshold - incidence) / lowThreshold * 100
    : null;
  const children = n(current, "cases_children_under_18");
  const prevChildren = n(previous, "cases_children_under_18");
  const schoolchildren = n(current, "cases_schoolchildren");
  const prevSchoolchildren = n(previous, "cases_schoolchildren");
  const hospital = n(current, "hospitalized_total");
  const prevHospital = n(previous, "hospitalized_total");
  const hospitalChildren = n(current, "hospitalized_children");
  const childShare = cases !== null && cases > 0 && children !== null ? children / cases * 100 : null;
  const schoolShare = children !== null && children > 0 && schoolchildren !== null ? schoolchildren / children * 100 : null;
  const hospitalChildShare = hospital !== null && hospital > 0 && hospitalChildren !== null ? hospitalChildren / hospital * 100 : null;
  const covidKeys = [
    "cases_covid19", "covid19_cases", "cases_covid",
    "випадків (дорослі) захворювання на covid-19",
    "Випадків (дорослі) захворювання на COVID-19",
    "Випадків (дорослі) захворювання на COVID-19 ",
  ];
  const covid = optionalMetric(current, covidKeys);
  const prevCovid = optionalMetric(previous, covidKeys);
  const deaths = optionalMetric(current, ["deaths_total", "deaths_influenza_covid19", "deaths_flu_covid"]);
  const optionalText = (row: Row | undefined, keys: string[]) => {
    const key = keys.find((k) => row?.[k] !== undefined && row?.[k] !== null && String(row[k]).trim() !== "");
    return key ? String(row?.[key]).trim() : null;
  };
  const tests = optionalMetric(current, [
    "lab_tests_total", "pcr_tested", "tested_by_pcr", "pcr_tested_patients",
    "pcr_examinations", "number_tested_pcr", "Обстежено методом ПЛР", "Обстежено ПЛР",
    "Кількість обстежених методом ПЛР", "Обстежено хворих",
    "У вірусологічній лабораторії ДУ «Тернопільський ОЦКПХ МОЗ» методом ПЛР на групу респіраторних вірусів за тиждень обстежено"
  ]);
  const pcrResult = optionalText(current, [
    "pcr_results", "lab_results", "respiratory_virus_pcr_results", "pcr_result",
    "результати", "Результати ПЛР", "Результати досліджень", "Результати", "Результати ПЛР на групу респіраторних вірусів"
  ]);
  const pcrNegative = optionalMetric(current, ["lab_tests_negative", "pcr_negative", "negative_pcr_results"]);
  const wastewaterResult = optionalText(current, [
    "wastewater_monitoring", "wastewater_result", "wastewater_results", "sewage_monitoring",
    "Моніторинг стічних вод", "Результати моніторингу стічних вод", "Стічні води",
    "Результати дослідження стічних вод", "Стічні води SARS-CoV-2, грип А/В",
    "За результатами моніторингу стічних вод за тиждень"
  ]);
  const wastewater = optionalMetric(current, ["wastewater_samples_total", "wastewater_samples", "sewage_samples"]);
  const negativeWastewater = optionalMetric(current, ["wastewater_negative", "wastewater_negative_samples"]);
  const periodStart = sample?.period_start ? fmtDate(sample.period_start) : "—";
  const periodEnd = sample?.period_end ? fmtDate(sample.period_end) : "—";
  const period = `${periodStart} – ${periodEnd}`;
  const reportingDate = sample?.period_end ? fmtDate(sample.period_end) : "—";
  const reportDay = sample?.period_start && sample?.period_end ? `${periodStart} – ${periodEnd}` : period;
  const totalCasesText = cases === null ? "—" : fmt(cases);
  const incidenceText = incidence === null ? "—" : fmt(incidence, 1);
  const lowThresholdText = belowThreshold === null ? "—" : `${fmt(Math.abs(belowThreshold), 1)}% ${belowThreshold >= 0 ? "нижче" : "вище"}`;
  const pctChange = deltaPct(cases, prevCases);
  const childrenChange = deltaPct(children, prevChildren);
  const schoolChange = deltaPct(schoolchildren, prevSchoolchildren);
  const hospitalChange = deltaPct(hospital, prevHospital);
  const formatChange = (d: number | null) => d === null ? "—" : `${fmt(Math.abs(d), 1)}%`;
  const direction = (d: number | null) => d === null ? "—" : d > 0 ? "зросла" : d < 0 ? "зменшилась" : "не змінилась";
  const dateLoaded = new Date(fetchedAt).toLocaleDateString("uk-UA");

  return (
    <Card title="Епідситуація із захворюваності на грип, ГРВІ та COVID-19 у Тернопільській області"
      sub={`Звітний період: ${period} · дані завантажено ${dateLoaded}`}>
      {!current ? (
        <p className="text-sm text-muted-foreground">Для вибраного періоду немає підсумкового рядка в джерелі даних.</p>
      ) : (
        <div className="flex flex-col gap-[1pt] text-sm leading-7">
          <p>Інформуємо про результати епідеміологічного моніторингу за грипом, ГРВІ та COVID-19 станом на {reportingDate}.</p>
          <p>Загальна захворюваність на грип, ГРВІ та COVID-19 за останні 7 днів склала {incidenceText} випадки на 100 тисяч населення (захворіло {totalCasesText} осіб), що на {lowThresholdText} епідемічного порогу низької інтенсивності.</p>
          <p>За останній ({sample?.week ?? week.split("-")[1] ?? "—"}) тиждень ({reportDay}) кількість захворілих ГРВІ у порівнянні з попереднім тижнем {direction(pctChange)} на {formatChange(pctChange)} ({totalCasesText} випадків проти {prevCases === null ? "—" : fmt(prevCases)}). Питома вага дітей серед хворих склала {fmtPct(childShare)}% ({children === null ? "—" : fmt(children)} ос.), школярів – {fmtPct(schoolShare)}% ({schoolchildren === null ? "—" : fmt(schoolchildren)} ос.) від усіх захворілих дітей. У порівнянні з попереднім тижнем відмічається {direction(childrenChange)} кількість хворих на ГРВІ дітей на {formatChange(childrenChange)} ({children === null ? "—" : fmt(children)} випадків проти {prevChildren === null ? "—" : fmt(prevChildren)}), школярів – {direction(schoolChange)} на {formatChange(schoolChange)} ({schoolchildren === null ? "—" : fmt(schoolchildren)} випадків проти {prevSchoolchildren === null ? "—" : fmt(prevSchoolchildren)}).</p>
          <p>Госпіталізовано за звітний тиждень {hospital === null ? "—" : fmt(hospital)} осіб, із них {hospitalChildren === null ? "—" : fmt(hospitalChildren)} дітей ({fmtPct(hospitalChildShare)}%). Кількість госпіталізованих {direction(hospitalChange)} у порівнянні з минулим тижнем на {formatChange(hospitalChange)} (госпіталізовано {hospital === null ? "—" : fmt(hospital)} осіб проти {prevHospital === null ? "—" : fmt(prevHospital)}).</p>
          <p>За тиждень зареєстровано {covid === null ? "—" : fmt(covid)} випадків (дорослі) захворювання на COVID-19 (на минулому тижні – {prevCovid === null ? "—" : fmt(prevCovid)} випадків).</p>
        </div>
      )}
    </Card>
  );
}

function OblastIndicator({ current, previous, week }: { current?: Row; previous?: Row; week: string }) {
  const cases = num(current?.cases_total);
  const incidence = num(current?.incidence_per_100k);
  const hospital = num(current?.hospitalized_total);
  const previousIncidence = num(previous?.incidence_per_100k);
  const previousCases = num(previous?.cases_total);
  const low = num(current?.intensity_low_threshold);
  const medium = num(current?.intensity_medium_threshold);
  const high = num(current?.intensity_high_threshold);
  const level = current ? intensityLevel(current) : "nodata";
  const change = (now: number | null, before: number | null) =>
    now === null || before === null || before === 0 ? null : ((now - before) / before) * 100;
  const incidenceChange = change(incidence, previousIncidence);
  const casesChange = change(cases, previousCases);
  const changeLabel = (value: number | null) =>
    value === null ? "немає даних для порівняння" : `${value > 0 ? "+" : ""}${fmt(value, 1)}% до попереднього тижня`;
  const thresholdLabel = incidence === null || low === null
    ? "Порівняння з епідемічним порогом: немає даних"
    : incidence < low
      ? `${fmt(((low - incidence) / low) * 100, 1)}% нижче порогу низької інтенсивності`
      : medium !== null && incidence >= medium
        ? high !== null && incidence >= high ? "Досягнуто порогу високої інтенсивності" : "Досягнуто порогу середньої інтенсивності"
        : "Досягнуто порогу низької інтенсивності";
  return (
    <section className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Обласний показник</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Тернопільська область · тиждень {week.split("-")[1] ?? "—"}</p>
        </div>
        <LevelBadge l={level} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">Захворюваність на 100 тис. населення</div>
          <div className="mt-1 font-display text-3xl font-bold text-primary">{fmt(incidence, 1)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{changeLabel(incidenceChange)}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">Випадки за тиждень</div>
          <div className="mt-1 font-display text-3xl font-bold">{fmt(cases)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{changeLabel(casesChange)}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">Госпіталізовано</div>
          <div className="mt-1 font-display text-3xl font-bold">{fmt(hospital)}</div>
          <div className="mt-1 text-xs text-muted-foreground">За вибраний звітний тиждень</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">Епідемічний поріг</div>
          <div className="mt-1 text-base font-semibold">{thresholdLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {low === null ? "Пороги відсутні в джерелі" : `Низький: ${fmt(low, 1)}${medium === null ? "" : ` · середній: ${fmt(medium, 1)}`}${high === null ? "" : ` · високий: ${fmt(high, 1)}`}`}
          </div>
        </div>
      </div>
      {!current && <p className="mt-3 text-sm text-muted-foreground">Для вибраного періоду обласний підсумок відсутній у джерелі даних.</p>}
    </section>
  );
}

function Kpis({ focus, prev, prevWeek, label }: { focus?: Row; prev?: Row; prevWeek?: string; label: string }) {
  const items = [
    { k: "cases_total", t: "Випадки всього", icon: Users, d: 0 },
    { k: "cases_children_under_18", t: "Діти до 18 років", icon: Baby, d: 0 },
    { k: "hospitalized_total", t: "Госпіталізовано", icon: BedDouble, d: 0 },
    { k: "incidence_per_100k", t: "На 100 тис. населення", icon: Activity, d: 1 },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ k, t, icon: Icon, d }) => (
        <div key={k} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wide">{t}</span>
            <Icon className="h-5 w-5 text-teal" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">{fmt(num(focus?.[k]), d)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {label}
            {prevWeek && prev && <> · тиж. {prevWeek.split("-")[1]}: {fmt(num(prev[k]), d)}</>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChildAdult({ r }: { r?: Row }) {
  const all = num(r?.cases_total), ch = num(r?.cases_children_under_18);
  if (all === null || ch === null) return <p className="text-sm text-muted-foreground">Немає даних</p>;
  const d = [{ name: "Діти до 18", value: ch }, { name: "Дорослі", value: all - ch }];
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={220}>
        <PieChart>
          <Pie data={d} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {d.map((_, i) => <Cell key={i} fill={CH[i]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3">
        {d.map((x, i) => (
          <div key={x.name}>
            <div className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-sm" style={{ background: CH[i] }} />{x.name}</div>
            <div className="font-display text-2xl font-semibold">{((x.value / all) * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}%</div>
            <div className="text-xs text-muted-foreground">{fmt(x.value)} випадків</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerritoryTable({ rows, selected, onSelect }: { rows: Row[]; selected: string | null; onSelect: (s: string | null) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr className="border-b">
            <th className="py-2">Територія</th><th>Тип</th><th className="text-right">Випадки</th><th className="text-right">Діти</th>
            <th className="text-right">Госпіт.</th><th className="text-right">Госпіт. діти</th><th className="text-right">На 100 тис.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isTotal = r.record_type === "total";
            return (
              <tr key={r.administrative_territory!}
                onClick={() => !isTotal && onSelect(selected === r.administrative_territory ? null : r.administrative_territory)}
                className={`border-b last:border-0 ${isTotal ? "bg-muted font-semibold" : "cursor-pointer hover:bg-muted/60"} ${selected === r.administrative_territory ? "bg-accent" : ""}`}>
                <td className="py-2">{r.administrative_territory}</td>
                <td className="text-muted-foreground">{RECORD_TYPE_LABEL[r.record_type ?? ""] ?? r.record_type}</td>
                <td className="text-right">{fmt(num(r.cases_total))}</td>
                <td className="text-right">{fmt(num(r.cases_children_under_18))}</td>
                <td className="text-right">{fmt(num(r.hospitalized_total))}</td>
                <td className="text-right">{fmt(num(r.hospitalized_children))}</td>
                <td className="text-right font-medium">{fmt(num(r.incidence_per_100k), 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LevelBadge({ l }: { l: Level }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
      <span className={l === "nodata" ? "text-muted-foreground" : ""}>{levelLabel[l]}</span>
    </span>
  );
}

function AgeChart({ r }: { r?: Row }) {
  const d = AGE_GROUPS.map(([k, n]) => ({ name: n, Випадки: num(r?.[k]) }));
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={d}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Bar dataKey="Випадки" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Діти до 18 років" v={num(r?.cases_children_under_18)} />
        <Stat label="Школярі" v={num(r?.cases_schoolchildren)} />
      </div>
    </>
  );
}
const Stat = ({ label, v }: { label: string; v: number | null }) => (
  <div className="rounded-lg bg-muted p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-display text-xl font-semibold">{fmt(v)}</div>
  </div>
);

function Intensity({ total }: { total?: Row }) {
  if (!total) return <p className="text-sm text-muted-foreground">Немає обласного показника за цей тиждень.</p>;
  const r = total;
  const v = num(r.incidence_per_100k) ?? 0;
  const th = [num(r.intensity_low_threshold), num(r.intensity_medium_threshold), num(r.intensity_high_threshold)];
  const max = Math.max(num(r.intensity_high_threshold) ?? 0, v, 1) * 1.1;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between gap-3 text-sm">
          <span className="font-semibold">Тернопільська область</span>
          <span className="font-semibold">{fmt(num(r.incidence_per_100k), 1)} на 100 тис.</span>
        </div>
        <div className="relative h-4 rounded-full border border-border bg-muted/70">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: LEVEL_COLOR[intensityLevel(r)] === LEVEL_COLOR.nodata ? "var(--chart-3)" : LEVEL_COLOR[intensityLevel(r)] }} />
          {th.map((t, i) => t !== null && (
            <div
              key={i}
              title={["Низький епідпоріг", "Середній епідпоріг", "Високий епідпоріг"][i] + ": " + fmt(t, 1)}
              className="absolute -top-1.5 h-7 w-1 -translate-x-1/2 rounded-sm border border-background shadow-sm"
              style={{ left: `${Math.min(100, (t / max) * 100)}%`, background: ["#2563eb", "#d97706", "#dc2626"][i], zIndex: 2 }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {th.map((t, i) => t !== null && (
            <span key={i} className="inline-flex items-center gap-1.5 font-medium">
              <span className="inline-block h-3 w-1.5 rounded-sm" style={{ background: ["#2563eb", "#d97706", "#dc2626"][i] }} />
              {["Низький", "Середній", "Високий"][i]} поріг: {fmt(t, 1)}
            </span>
          ))}
        </div>
        <div className="mt-1"><LevelBadge l={intensityLevel(r)} /></div>
      </div>
      <p className="text-xs text-muted-foreground">Показано лише обласний показник; вертикальні мітки позначають пороги низького, середнього та високого рівня.</p>
    </div>
  );
}

function IncidenceTrend({ rows, weeks, territory }: { rows: Row[]; weeks: string[]; territory: string | null }) {
  const d = weeks.map((w) => {
    const wr = rows.filter((r) => weekKey(r) === w);
    const r = territory ? wr.find((x) => x.administrative_territory === territory) : totalRow(wr);
    return {
      name: `тиж. ${w.split("-")[1]} / ${w.split("-")[0]}`,
      "На 100 тис.": num(r?.incidence_per_100k),
      "Низький епідпоріг": num(r?.intensity_low_threshold),
      "Середній поріг": num(r?.intensity_medium_threshold),
      "Високий поріг": num(r?.intensity_high_threshold),
    };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={d} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip formatter={(v: number) => fmt(v, 1)} />
        <Legend />
        <Line type="monotone" dataKey="На 100 тис." stroke="var(--chart-1)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Низький епідпоріг" stroke="var(--chart-2)" strokeDasharray="6 4" strokeWidth={1.8} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey="Середній поріг" stroke="var(--chart-3)" strokeDasharray="3 4" strokeWidth={1.8} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey="Високий поріг" stroke="var(--chart-4)" strokeDasharray="8 4" strokeWidth={1.8} dot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CasesTrend({ rows, weeks, territory }: { rows: Row[]; weeks: string[]; territory: string | null }) {
  const d = weeks.map((w) => {
    const wr = rows.filter((r) => weekKey(r) === w);
    const r = territory ? wr.find((x) => x.administrative_territory === territory) : totalRow(wr);
    return {
      name: `тиж. ${w.split("-")[1]} / ${w.split("-")[0]}`,
      "Усього випадків": num(r?.cases_total),
      "Діти до 18 років": num(r?.cases_children_under_18),
      "Школярі": num(r?.cases_schoolchildren),
    };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={d} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={(v: number) => fmt(v)} />
        <Legend />
        <Line type="monotone" dataKey="Усього випадків" stroke="var(--chart-1)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Діти до 18 років" stroke="var(--chart-2)" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Школярі" stroke="var(--chart-3)" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Vaccination({ rows, week }: { rows: Row[]; week: string }) {
  const wr = rows.filter((r) => weekKey(r) === week);
  const brands = Array.from(new Set(wr.map((r) => r.vaccine_brand!)));
  const terrs = Array.from(new Set(wr.filter((r) => r.record_type !== "total").map((r) => r.administrative_territory!)));
  const [brand, setBrand] = useState("ВСЬОГО");
  const [terr, setTerr] = useState("ВСЬОГО");
  const row = wr.find((r) => r.vaccine_brand === brand && r.administrative_territory === terr);
  const allZero = wr.length > 0 && wr.every((r) => (num(r.vaccinated_this_week) ?? 0) === 0);
  const byTerr = wr.filter((r) => r.vaccine_brand === brand && r.record_type !== "total");
  return (
    <section className="rounded-xl border-2 border-teal/40 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title flex items-center gap-2"><Syringe className="h-5 w-5 text-teal" /> Вакцинація проти грипу</h2>
          <p className="text-xs text-muted-foreground">Окремий блок · аркуш weekly_vaccination · без відсотків охоплення (немає знаменника)</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
            {brands.map((b) => <option key={b} value={b}>{b === "ВСЬОГО" ? "Усі вакцини" : b}</option>)}
          </select>
          <select value={terr} onChange={(e) => setTerr(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
            <option value="ВСЬОГО">Уся область</option>
            {terrs.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {wr.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Немає даних про щеплення за цей тиждень.</p>
      ) : (
        <>
          {allZero && (
            <div className="mt-4 flex gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Усі значення за тиждень — нулі. Потрібно підтвердити, що це фактичні нулі, а не незаповнений шаблон.
            </div>
          )}
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div className="space-y-3">
              <Stat label="Щеплено за тиждень" v={num(row?.vaccinated_this_week)} />
              <Stat label="Групи ризику — всього" v={num(row?.risk_groups_total)} />
              <Stat label="Медичний ризик" v={num(row?.medical_risk_total)} />
              <Stat label="Епідемічний ризик" v={num(row?.epidemic_risk_total)} />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">За групами ризику</div>
              <div className="space-y-1.5">
                {RISK_GROUPS.map(([k, n]) => (
                  <div key={k} className="flex justify-between border-b py-1 text-sm last:border-0">
                    <span>{n}</span><span className="font-medium">{fmt(num(row?.[k]))}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 mb-2 text-xs font-medium uppercase text-muted-foreground">За територіями ({brand === "ВСЬОГО" ? "усі вакцини" : brand})</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byTerr.map((r) => ({ name: r.administrative_territory, Щеплено: num(r.vaccinated_this_week) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Щеплено" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function DataTable({ rows }: { rows: Row[] }) {
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const filtered = useMemo(() => {
    let r = rows.filter((x) => (!type || x.record_type === type) && (!q || Object.values(x).join(" ").toLowerCase().includes(q.toLowerCase())));
    if (sort) r = [...r].sort((a, b) => {
      const na = num(a[sort.k]), nb = num(b[sort.k]);
      if (na !== null && nb !== null) return (na - nb) * sort.dir;
      return String(a[sort.k] ?? "").localeCompare(String(b[sort.k] ?? "")) * sort.dir;
    });
    return r;
  }, [rows, q, type, sort]);
  const exportFile = (kind: "csv" | "xlsx") => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "weekly_respiratory");
    XLSX.writeFile(wb, `respiratory_export.${kind}`, { bookType: kind });
  };
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук…" className="rounded-md border bg-background py-1.5 pl-8 pr-2 text-sm" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm">
          <option value="">Усі типи записів</option>
          <option value="district">Район</option><option value="city">Місто</option><option value="total">Підсумок</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} записів</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => exportFile("csv")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => exportFile("xlsx")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><Download className="h-4 w-4" />XLSX</button>
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto rounded-lg border">
        <table className="w-full whitespace-nowrap text-xs">
          <thead className="sticky top-0 bg-secondary text-secondary-foreground">
            <tr>{cols.map((c) => (
              <th key={c} className="cursor-pointer px-2 py-2 text-left font-medium" onClick={() => setSort({ k: c, dir: sort?.k === c ? (-sort.dir as 1 | -1) : 1 })}>
                <span className="inline-flex items-center gap-1">{c}<ArrowUpDown className="h-3 w-3 opacity-50" /></span>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={`border-t ${r.record_type === "total" ? "bg-muted font-semibold" : ""}`}>
                {cols.map((c) => <td key={c} className={`px-2 py-1.5 ${r[c] === null ? "text-muted-foreground italic" : ""}`}>{r[c] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">«—» — відсутнє значення в джерелі (не нуль). Сірі рядки — підсумкові записи.</p>
    </>
  );
}

function QualityNotes() {
  const notes = [
    "Рядок «ВСЬОГО» не додається до сум територій.",
    "Порожні значення не замінюються нулями.",
    "Пороги інтенсивності — лише там, де вони є в джерелі.",
    "Немає карти громад: дані агреговані на рівні районів і міста.",
    "Охоплення вакцинацією у % не показується без узгодженого знаменника.",
    "Нульові дані вакцинації потребують перевірки перед публікацією.",
  ];
  return (
    <section className="rounded-xl border bg-muted/50 p-5">
      <h2 className="section-title">Методологічні обмеження</h2>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        {notes.map((n) => <li key={n} className="flex gap-2"><span className="text-teal">•</span>{n}</li>)}
      </ul>
    </section>
  );
}
