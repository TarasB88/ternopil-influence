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

type UiLanguage = "uk" | "en";
let uiLanguage: UiLanguage = "uk";
const EN: Record<string, string> = {
  "Епідеміологічний нагляд · Тернопільська область": "Epidemiological surveillance · Ternopil Oblast",
  "Грип, ГРВІ та COVID-19": "Influenza, ARI and COVID-19",
  "Щотижневий моніторинг захворюваності, госпіталізацій, епідемічної інтенсивності та вакцинації": "Weekly monitoring of illness, hospitalizations, epidemic intensity and vaccination",
  "Захворюваність": "Incidence",
  "Госпіталізації": "Hospitalizations",
  "Вакцинація": "Vaccination",
  "Звітний період": "Reporting period",
  "Дані дашборду": "Dashboard data",
  "Тернопільська область, Україна": "Ternopil Oblast, Ukraine",
  "Тиждень": "Week",
  "Територія": "Territory",
  "Уся область": "Entire oblast",
  "Прибрати фільтр": "Remove filter",
  "Скинути": "Reset",
  "Оновити": "Refresh",
  "Випадки за територіями": "Cases by territory",
  "Клікніть стовпчик, щоб відфільтрувати. Підсумок не входить до ранжування.": "Click a bar to filter. The total is excluded from ranking.",
  "Діти та дорослі": "Children and adults",
  "Дорослі": "Adults",
  "Діти до 18": "Children under 18",
  "Порівняння територій": "Territory comparison",
  "Території громад/районів і підсумок по Тернопільській області · значення джерела, без перерахунків": "Hromadas/districts and Ternopil Oblast total · source values, no recalculation",
  "Вікова структура випадків": "Age distribution of cases",
  "Вікові групи дітей; «діти до 18» і «школярі» — окремі, перехресні категорії, не сумуються": "Child age groups; “children under 18” and “schoolchildren” are separate, overlapping categories and are not added together",
  "Інтенсивність на 100 тис. населення": "Incidence per 100,000 population",
  "Рівень показано лише там, де джерело має пороги": "Level is shown only where thresholds are available in the source",
  "Динаміка захворюваності на 100 тис. населення": "Incidence trend per 100,000 population",
  "Динаміка абсолютної кількості випадків": "Trend in absolute case counts",
  "Джерело: Google Sheets (weekly_respiratory, weekly_vaccination)": "Source: Google Sheets (weekly_respiratory, weekly_vaccination)",
  "Розробник:": "Developer:",
  "Не вдалося завантажити географічні межі. Перевірте підключення до джерела GeoJSON.": "Could not load geographic boundaries. Check the GeoJSON source connection.",
  "Завантаження географічних меж районів…": "Loading district boundaries…",
  "м. Тернопіль": "Ternopil city",
  "Випадки": "Cases",
  "На 100 тис.": "Per 100,000",
  "Рівень": "Level",
  "Захворюваність на 100 тис. населення": "Incidence per 100,000 population",
  "0 / нижче порогу": "0 / below threshold",
  "Низька": "Low",
  "Середня": "Medium",
  "Висока": "High",
  "Немає значення показника": "Indicator value unavailable",
  "Геодані:": "Geodata:",
  ". Маркер міста — координати центру Тернополя; це не адміністративний контур міста.": ". The city marker shows central Ternopil coordinates; it is not the city's administrative boundary.",
  "Епідемічний поріг": "Epidemic threshold",
  "Обласна захворюваність:": "Oblast incidence:",
  "на 100 тис. населення": "per 100,000 population",
  "Поріг низької інтенсивності:": "Low-intensity threshold:",
  "на 100 тис.": "per 100,000",
  "Рівень інтенсивності епідемічного процесу": "Epidemic process intensity level",
  "Показник захворюваності:": "Incidence indicator:",
  "Оцінка визначається за порогами, що надійшли з джерела даних.": "Assessment is based on thresholds provided by the data source.",
  "Для вибраного періоду немає підсумкового рядка в джерелі даних.": "No total row is available in the source for the selected period.",
  "Обласний показник": "Oblast indicator",
  "Випадки за тиждень": "Cases this week",
  "За вибраний звітний тиждень": "For the selected reporting week",
  "Для вибраного періоду обласний підсумок відсутній у джерелі даних.": "The oblast total is missing from the source for the selected period.",
  "Немає даних": "No data",
  "Тип": "Type",
  "Діти": "Children",
  "Госпіт.": "Hosp.",
  "Госпіт. діти": "Hosp. children",
  "Немає обласного показника за цей тиждень.": "No oblast indicator for this week.",
  "Окремий блок · аркуш weekly_vaccination · без відсотків охоплення (немає знаменника)": "Separate section · weekly_vaccination sheet · no coverage percentages (denominator unavailable)",
  "Немає даних про щеплення за цей тиждень.": "No vaccination data for this week.",
  "За групами ризику": "By risk group",
  "Щеплено за тиждень": "Vaccinated this week",
  "Групи ризику — всього": "Risk groups — total",
  "Медичний ризик": "Medical risk",
  "Епідемічний ризик": "Epidemic risk",
  "Усі вакцини": "All vaccines",
  "Усі типи записів": "All record types",
  "Місто": "City",
  "Підсумок": "Total",
  "«—» — відсутнє значення в джерелі (не нуль). Сірі рядки — підсумкові записи.": "“—” means the source value is missing (not zero). Grey rows are totals.",
  "Методологічні обмеження": "Methodological limitations",
  "Пошук…": "Search…",
  "Діти до 18 років": "Children under 18",
  "Школярі": "Schoolchildren",
  "Низький": "Low",
  "Середній": "Medium",
  "Високий": "High",
  "Поріг": "threshold",
  "Тернопільська область": "Ternopil Oblast",
  "Вакцинація проти грипу": "Influenza vaccination",
  "Показано лише обласний показник; вертикальні мітки позначають пороги низького, середнього та високого рівня.": "Only the oblast indicator is shown; vertical markers indicate low, medium and high thresholds.",
  "Якщо в таблиці є офіційні пороги інтенсивності, використовуються вони; інакше застосовано технічну шкалу: &lt;500, 500–999, ≥1000 на 100 тис.": "Official intensity thresholds are used when available; otherwise, a technical scale is applied: <500, 500–999, ≥1000 per 100,000.",
  "Зареєстровано": "Registered",
  "Зміна": "Change",
  "Зростання": "Increase",
  "Зниження": "Decrease",
  "Без змін": "No change",
  "На минулому тижні": "Last week",
  "Усього випадків": "Total cases",
  "Середній поріг": "Medium threshold",
  "Високий поріг": "High threshold",
  "Щеплено": "Vaccinated",
  "Низький поріг": "Low threshold",
  "Грип, ГРВІ, COVID-19 та вакцинація — Тернопільська область": "Influenza, ARI, COVID-19 and vaccination — Ternopil Oblast",
  "Щотижневий епідемічний дашборд: захворюваність, госпіталізації, інтенсивність і щеплення проти грипу.": "Weekly epidemiological dashboard: illness, hospitalizations, intensity and influenza vaccination.",
  "Епідмоніторинг Тернопільщини": "Epidemiological monitoring in Ternopil Oblast",
  "Щотижневі дані про грип, ГРВІ, COVID-19 та вакцинацію.": "Weekly data on influenza, ARI, COVID-19 and vaccination.",
  "Доступно тижнів": "Weeks available",
  "до попереднього тижня": "compared with the previous week",
  "тиждень": "week",
  "Джерело": "Source",
  "Оновлено": "Updated",
  "Епідемічні пороги показані окремими лініями": "Epidemic thresholds are shown as separate lines",
  "Кількість випадків без ліній епідемічних порогів": "Case counts without epidemic threshold lines",
  "немає даних": "no data",
  "тиж.": "wk",
  "поріг": "threshold",
  "дані завантажено": "Data loaded",
  "Не вдалося завантажити дані з Google Sheets. Перевірте доступність джерела.": "Could not load data from Google Sheets. Check source availability.",
  "Немає даних про рівень інтенсивності": "Intensity level unavailable",
  "Нижче епідпорогу": "Below epidemic threshold",
  "Немає даних про пороги": "Threshold data unavailable",
  "Немає даних для оцінки": "Insufficient data for assessment",
  "Епідпоріг перевищено": "Epidemic threshold exceeded",
  "Епідпоріг не перевищено": "Epidemic threshold not exceeded",
  "Фоновий": "Baseline",
  "Низький епідпоріг": "Low epidemic threshold",
  "Середній епідпоріг": "Medium epidemic threshold",
  "Високий епідпоріг": "High epidemic threshold",
  "випадків": "cases",
  "випадок": "case",
  "випадки": "cases",
  "нижче": "below",
  "вище": "above",
  "зросла": "increased",
  "зменшилась": "decreased",
  "не змінилась": "did not change",
  "немає даних для порівняння": "no comparison data",
  "Порівняння з епідемічним порогом: немає даних": "Epidemic threshold comparison: no data",
  "Досягнуто порогу високої інтенсивності": "High-intensity threshold reached",
  "Досягнуто порогу середньої інтенсивності": "Medium-intensity threshold reached",
  "Досягнуто порогу низької інтенсивності": "Low-intensity threshold reached",
  "Території": "Territories",
  "Випадки всього": "Total cases",
  "Госпіталізовано": "Hospitalized",
  "На 100 тис. населення": "Per 100,000 population",
  "Записів": "records",
  "записів": "records",
  "Усі значення за тиждень — нулі. Потрібно підтвердити, що це фактичні нулі, а не незаповнений шаблон.": "All values for this week are zero. Confirm these are actual zeros and not an unfilled template.",
  "Рядок «ВСЬОГО» не додається до сум територій.": "The “TOTAL” row is not added to territory sums.",
  "Порожні значення не замінюються нулями.": "Blank values are not replaced with zeros.",
  "Пороги інтенсивності — лише там, де вони є в джерелі.": "Intensity thresholds are shown only where provided by the source.",
  "Немає карти громад: дані агреговані на рівні районів і міста.": "No hromada map is available: data are aggregated by district and city.",
  "Охоплення вакцинацією у % не показується без узгодженого знаменника.": "Vaccination coverage (%) is not shown without a validated denominator.",
  "Нульові дані вакцинації потребують перевірки перед публікацією.": "Zero vaccination values must be verified before publication.",
  "За територіями": "By territory",
  "усі вакцини": "all vaccines",
  "Карта епідемічної ситуації за районами та м. Тернопіль": "Epidemiological situation map by district and Ternopil city",
  "Колір показує захворюваність на 100 тис. населення; натисніть район для фільтрації.": "Colour indicates incidence per 100,000 population; click a district to filter.",
  "Карта Кременецького, Тернопільського, Чортківського районів і міста Тернополя": "Map of Kremenets, Ternopil and Chortkiv districts and Ternopil city",
  "Район": "District",
  "район": "district",
  "місто": "city",
  "підсумок": "total",
  "немає відповідного рядка даних": "no matching data row",
  "Немає окремого рядка": "No separate record",
  "Епідситуація із захворюваності на грип, ГРВІ та COVID-19 у Тернопільській області": "Epidemiological situation: influenza, ARI and COVID-19 in Ternopil Oblast",
  "Пороги відсутні в джерелі": "Thresholds unavailable in source",
  "Немає даних для порівняння": "No comparison data",
  "Дорослі = всього − діти до 18": "Adults = total − children under 18",
  "до 1 року": "Under 1 year",
  "Хронічні захворювання": "Chronic conditions",
  "Віком 65+": "Age 65+",
  "Заклади довгострокового догляду": "Long-term care facilities",
  "Діти 6 міс – 5 років": "Children aged 6 months–5 years",
  "Медичні працівники": "Healthcare workers",
  "Вагітні": "Pregnant people",
  "Інші групи ризику": "Other risk groups",
  "administrative_territory": "Territory",
  "record_type": "Record type",
  "year": "Year",
  "week": "Week",
  "period_start": "Period start",
  "period_end": "Period end",
  "cases_total": "Total cases",
  "cases_children_under_18": "Children under 18",
  "cases_schoolchildren": "Schoolchildren",
  "hospitalized_total": "Hospitalized",
  "hospitalized_children": "Hospitalized children",
  "incidence_per_100k": "Incidence per 100,000",
  "intensity_low_threshold": "Low-intensity threshold",
  "intensity_medium_threshold": "Medium-intensity threshold",
  "intensity_high_threshold": "High-intensity threshold",
  "vaccinated_this_week": "Vaccinated this week",
  "risk_groups_total": "Risk groups — total",
  "medical_risk_total": "Medical risk — total",
  "epidemic_risk_total": "Epidemic risk — total",
  "Language": "Language",
const tr = (text: string) => {
  if (uiLanguage !== "en") return text;
  if (EN[text]) return EN[text];
  if (text.endsWith(" район")) return text.slice(0, -" район".length) + " District";
  if (text.endsWith(" територіальна громада")) return text.slice(0, -" територіальна громада".length) + " Territorial Hromada";
  if (/^[a-z][a-z0-9_]*$/.test(text)) return text.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return text;
  "Кременецький район": "Kremenets District",
  "Тернопільський район": "Ternopil District",
  "Чортківський район": "Chortkiv District",
  "кременецький район": "Kremenets District",
  "тернопільський район": "Ternopil District",
  "чортківський район": "Chortkiv District",
  "Кременецький": "Kremenets",
  "Тернопільський": "Ternopil",
  "Чортківський": "Chortkiv",
  "Кременецького": "Kremenets",
  "Тернопільського": "Ternopil",
  "Чортківського": "Chortkiv",
  "міста Тернополя": "Ternopil city",
  "«ВСЬОГО»": "“TOTAL”",
  "ВСЬОГО": "TOTAL",
  "1–4": "1–4 years",
  "5–9": "5–9 years",
  "10–14": "10–14 years",
  "15–17": "15–17 years",
  "Епідситуація": "Epidemiological situation",
  "Грип": "Influenza",
  "ГРВІ": "Acute respiratory infections (ARI)",
  "COVID-19 у Тернопільській області": "COVID-19 in Ternopil Oblast",

};

const dataQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardData(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: tr("Грип, ГРВІ, COVID-19 та вакцинація — Тернопільська область") },
      { name: "description", content: tr("Щотижневий епідемічний дашборд: захворюваність, госпіталізації, інтенсивність і щеплення проти грипу.") },
      { property: "og:title", content: tr("Епідмоніторинг Тернопільщини") },
      { property: "og:description", content: tr("Щотижневі дані про грип, ГРВІ, COVID-19 та вакцинацію.") },
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
  const [language, setLanguage] = useState<UiLanguage>("uk");
  uiLanguage = language;
  useEffect(() => {
    document.documentElement.lang = language;
    try { window.localStorage.setItem("dashboard-language", language); } catch {}
  }, [language]);
  useEffect(() => {
    try { if (window.localStorage.getItem("dashboard-language") === "en") setLanguage("en"); } catch {}
  }, []);

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
                  {tr("Епідеміологічний нагляд · Тернопільська область")}
                </div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-4xl">{tr("Грип, ГРВІ та COVID-19")}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/80 md:text-base">
                  {tr("Щотижневий моніторинг захворюваності, госпіталізацій, епідемічної інтенсивності та вакцинації")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-cyan-50/90">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><HeartPulse className="h-3.5 w-3.5 text-rose-200" /> {tr("Захворюваність")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><Hospital className="h-3.5 w-3.5 text-sky-200" /> {tr("Госпіталізації")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5"><Syringe className="h-3.5 w-3.5 text-emerald-200" /> {tr("Вакцинація")}</span>
                </div>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/15 bg-slate-950/25 p-4 shadow-xl backdrop-blur-sm sm:w-auto sm:min-w-[260px]">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/75"><CalendarDays className="h-4 w-4" /> {tr("Звітний період")}</span>
                <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 p-1" aria-label={tr("Language")}>
                  <button type="button" onClick={() => setLanguage("uk")} aria-pressed={language === "uk"} className={`rounded-md px-2 py-1 text-[10px] font-bold ${language === "uk" ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/10"}`}>UA</button>
                  <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`rounded-md px-2 py-1 text-[10px] font-bold ${language === "en" ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/10"}`}>EN</button>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-semibold text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {tr("Дані дашборду")}</span>
              </div>
              <div className="mt-3 text-sm text-white/70">{tr("Тиждень")} {sample?.week ?? "—"} / {sample?.year ?? "—"}</div>
              <div className="mt-1 text-lg font-bold tracking-tight md:text-xl">{fmtDate(sample?.period_start ?? null)} – {fmtDate(sample?.period_end ?? null)}</div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs text-cyan-100/65"><MapPin className="h-3.5 w-3.5" /> {tr("Тернопільська область, Україна")}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{tr("Тиждень")}</span>
            <select value={week} onChange={(e) => setWeek(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
              {weeks.map((w) => <option key={w} value={w}>{language === "en" ? w.replace("-", " / wk ") : w.replace("-", " / тиж. ")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{tr("Територія")}</span>
            <select value={territory ?? ""} onChange={(e) => setTerritory(e.target.value || null)} className="rounded-md border bg-background px-2 py-1.5">
              <option value="">{tr("Уся область")}</option>
              {terr.map((r) => <option key={r.administrative_territory!}>{tr(r.administrative_territory ?? "")}</option>)}
            </select>
          </label>
          <div className="ml-auto flex items-center gap-2">
            {territory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                {tr(territory)}
                <button onClick={() => setTerritory(null)} aria-label={tr("Прибрати фільтр")}><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={resetAll} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> {tr("Скинути")}
            </button>
            <button onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> {tr("Оновити")}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        {data.error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4" /> {tr(data.error)}
          </div>
        )}

        <TopEpidemiologyStatus current={total} />

        <RespiratorySituation week={week} sample={sample} current={total} previous={totalRow(prevRows)} fetchedAt={data.fetchedAt} language={language} />


        <Kpis focus={focus} prev={prevFocus} prevWeek={prevWeek} label={territory ? tr(territory) : tr("Уся область")} />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3" title={tr("Випадки за територіями")} sub={tr("Клікніть стовпчик, щоб відфільтрувати. Підсумок не входить до ранжування.")}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...terr].sort((a, b) => (num(b.cases_total) ?? 0) - (num(a.cases_total) ?? 0)).map((r) => ({ name: shortName(r.administrative_territory), full: r.administrative_territory, [tr("Випадки")]: num(r.cases_total), [tr("Діти")]: num(r.cases_children_under_18) }))} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey={tr("Випадки")} radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: { full: string }) => setTerritory(d.full === territory ? null : d.full)}>
                  {terr.map((r, i) => <Cell key={i} fill={"var(--chart-1)"} />)}
                </Bar>
                <Bar dataKey={tr("Діти")} fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="lg:col-span-2" title={tr("Діти та дорослі")} sub={`${territory ? tr(territory) : tr("Уся область")} · ${tr("Дорослі = всього − діти до 18")}`}>
            <ChildAdult r={focus} />
          </Card>
        </div>

        <Card title={tr("Порівняння територій")} sub={tr("Території громад/районів і підсумок по Тернопільській області · значення джерела, без перерахунків")}>
          <TerritoryTable rows={total ? [...terr, total] : terr} selected={territory} onSelect={setTerritory} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={tr("Вікова структура випадків")} sub={tr("Вікові групи дітей; «діти до 18» і «школярі» — окремі, перехресні категорії, не сумуються")}>
            <AgeChart r={focus} />
          </Card>
          <Card title={tr("Інтенсивність на 100 тис. населення")} sub={tr("Рівень показано лише там, де джерело має пороги")}>
            <Intensity total={total} />
          </Card>
        </div>

        {weeks.length >= 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={tr("Динаміка захворюваності на 100 тис. населення")} sub={`${tr("Епідемічні пороги показані окремими лініями")} · ${territory ? tr(territory) : tr("Уся область")} · ${tr("Доступно тижнів")}: ${weeks.length}`}>
              <IncidenceTrend rows={data.respiratory} weeks={weeks} territory={territory} />
            </Card>
            <Card title={tr("Динаміка абсолютної кількості випадків")} sub={`${tr("Кількість випадків без ліній епідемічних порогів")} · ${territory ? tr(territory) : tr("Уся область")} · ${tr("Доступно тижнів")}: ${weeks.length}`}>
              <CasesTrend rows={data.respiratory} weeks={weeks} territory={territory} />
            </Card>
          </div>
        )}

        <Vaccination rows={data.vaccination} week={week} />

        <footer className="pb-6 text-center text-xs text-muted-foreground">
          <p>{tr("Джерело")}: Google Sheets (weekly_respiratory, weekly_vaccination) · {tr("Оновлено")} {new Date(data.fetchedAt).toLocaleString(language === "en" ? "en-GB" : "uk-UA")}</p>
          <p className="mt-2">{tr("Розробник:")} <a href="https://www.linkedin.com/in/taras-burda-410401318/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Taras Burda</a></p>
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
    <Card title={tr("Карта епідемічної ситуації за районами та м. Тернопіль")} sub={tr("Колір показує захворюваність на 100 тис. населення; натисніть район для фільтрації.")}>
      {geoError ? (
        <p className="text-sm text-muted-foreground">{tr("Не вдалося завантажити географічні межі. Перевірте підключення до джерела GeoJSON.")}</p>
      ) : features.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tr("Завантаження географічних меж районів…")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-lg border bg-muted/20">
            <svg viewBox="0 0 900 560" role="img" aria-label={tr("Карта Кременецького, Тернопільського, Чортківського районів і міста Тернополя")} className="mx-auto h-auto max-h-[340px] w-full max-w-[560px]">
              {features.map((f, i) => {
                const group = getFeatureGroup(f);
                const row = group ? findRow(group.aliases) : undefined;
                const level = mapLevel(row);
                const fill = mapFill(row);
                return <path key={i} d={ringsToPath(f.geometry?.coordinates)} fill={fill} fillOpacity={selected && group && !group.aliases.some((a) => selected.toLocaleLowerCase("uk-UA").includes(a)) ? 0.35 : 0.88} stroke="var(--border)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => group && row && onSelect(selected === row.administrative_territory ? null : row.administrative_territory ?? null)}><title>{tr(group?.label ?? featureLabel(f) ?? "Район")} · {row ? fmt(num(row.cases_total)) + " " + tr("випадків") + "; " + fmt(num(row.incidence_per_100k), 1) + " " + tr("на 100 тис.") : tr("немає відповідного рядка даних")}</title></path>;
              })}
              <line x1={cityPoint[0] - 7} y1={cityPoint[1]} x2={cityPoint[0] + 7} y2={cityPoint[1]} stroke="var(--foreground)" strokeWidth="2.5" />
              <line x1={cityPoint[0]} y1={cityPoint[1] - 7} x2={cityPoint[0]} y2={cityPoint[1] + 7} stroke="var(--foreground)" strokeWidth="2.5" />
              <circle cx={cityPoint[0]} cy={cityPoint[1]} r="5" fill={mapFill(cityRow)} stroke="var(--background)" strokeWidth="2" />
              <text x={cityPoint[0] + 10} y={cityPoint[1] - 10} fontSize="15" fontWeight="700" fill="var(--foreground)" stroke="var(--background)" strokeWidth="3" paintOrder="stroke">{tr("м. Тернопіль")}</text>
            </svg>
          </div>
          <div className="space-y-3">
            {selectedRows.map((group) => {
              const row = findRow(group.aliases);
              const active = !!row && selected === row.administrative_territory;
              return <button key={group.key} onClick={() => row && onSelect(active ? null : row.administrative_territory ?? null)} className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${active ? "border-primary bg-accent" : "bg-card"}`}>
                <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: mapFill(row) }} />{tr(group.label)}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span className="text-muted-foreground">{tr("Випадки")}</span><strong className="text-right">{fmt(num(row?.cases_total))}</strong><span className="text-muted-foreground">{tr("На 100 тис.")}</span><strong className="text-right">{fmt(num(row?.incidence_per_100k), 1)}</strong><span className="text-muted-foreground">{tr("Рівень")}</span><span className="text-right">{row ? tr(levelLabel[intensityLevel(row)]) : tr("Немає даних")}</span></div>
              </button>;
            })}
            <button onClick={() => cityRow && onSelect(citySelected ? null : cityRow.administrative_territory ?? null)} className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${citySelected ? "border-primary bg-accent" : "bg-card"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: mapFill(cityRow) }} />{tr("м. Тернопіль")}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span className="text-muted-foreground">{tr("Випадки")}</span><strong className="text-right">{fmt(num(cityRow?.cases_total))}</strong><span className="text-muted-foreground">{tr("На 100 тис.")}</span><strong className="text-right">{fmt(num(cityRow?.incidence_per_100k), 1)}</strong><span className="text-muted-foreground">{tr("Рівень")}</span><span className="text-right">{cityRow ? tr(levelLabel[intensityLevel(cityRow)]) : tr("Немає окремого рядка")}</span></div>
            </button>
            <div className="rounded-md border p-3"><p className="mb-2 text-xs font-semibold">{tr("Захворюваність на 100 тис. населення")}</p><div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d9f0e3"}} />{tr("0 / нижче порогу")}</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#91cfb0"}} />{tr("Низька")}</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#f6c85f"}} />{tr("Середня")}</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d95f59"}} />{tr("Висока")}</span><span className="col-span-2 flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{background:"#d1d5db"}} />{tr("Немає значення показника")}</span></div><p className="mt-2 text-[11px] text-muted-foreground">{tr("Якщо в таблиці є офіційні пороги інтенсивності, використовуються вони; інакше застосовано технічну шкалу: &lt;500, 500–999, ≥1000 на 100 тис.")}</p></div>
            <p className="text-xs text-muted-foreground">{tr("Геодані:")} <a className="underline" href="https://github.com/slawomirmatuszak/ukrainian_geodata" target="_blank" rel="noreferrer">Ukrainian geodata (CC BY 4.0)</a>{tr(". Маркер міста — координати центру Тернополя; це не адміністративний контур міста.")}</p>
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
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Епідемічний поріг")}</div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${!thresholdKnown ? "bg-muted-foreground" : exceeded ? "bg-red-600" : "bg-emerald-600"}`} />
          <h2 className="text-xl font-bold">{tr(thresholdText)}</h2>
        </div>
        <p className="mt-2 text-sm">{tr("Обласна захворюваність:")} <strong>{fmt(incidence, 1)}</strong> {tr("на 100 тис. населення")}</p>
        <p className="text-sm">{tr("Поріг низької інтенсивності:")} <strong>{fmt(threshold, 1)}</strong> {tr("на 100 тис.")}</p>
      </section>
      <section className={`rounded-xl border-2 p-5 shadow-sm ${levelTone[level]}`} aria-live="polite">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Рівень інтенсивності епідемічного процесу")}</div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${LEVEL_COLOR[level]}`} />
          <h2 className="text-xl font-bold">{tr(levelText[level])}</h2>
        </div>
        <p className="mt-2 text-sm">{tr("Показник захворюваності:")} <strong>{fmt(incidence, 1)}</strong> {tr("на 100 тис. населення")}</p>
        <p className="text-sm">{tr("Оцінка визначається за порогами, що надійшли з джерела даних.")}</p>
      </section>
    </div>
  );
}

function RespiratorySituation({ week, sample, current, previous, fetchedAt, language }: { week: string; sample?: Row; current?: Row; previous?: Row; fetchedAt: string; language: UiLanguage }) {
  const n = (row: Row | undefined, key: string) => num(row?.[key]);
  const normalizeMetricKey = (value: string) =>
    value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("uk-UA");
  const optionalMetric = (row: Row | undefined, keys: string[]) => {
    if (!row) return null;
    const rowKeys = Object.keys(row);
    const matchedKey = keys.map(normalizeMetricKey);
    const key = rowKeys.find((rowKey) => matchedKey.includes(normalizeMetricKey(rowKey)));
    return key ? num(row[key]) : null;
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
  const caseWord = (value: number | null) => {
    if (value === null) return "випадків";
    const n = Math.abs(Math.trunc(value)) % 100;
    const last = n % 10;
    if (n > 10 && n < 20) return "випадків";
    if (last === 1) return "випадок";
    if (last >= 2 && last <= 4) return "випадки";
    return "випадків";
  };
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
  const direction = (d: number | null) => d === null ? "—" : language === "en" ? (d > 0 ? "increased" : d < 0 ? "decreased" : "did not change") : d > 0 ? "зросла" : d < 0 ? "зменшилась" : "не змінилась";
  const dateLoaded = new Date(fetchedAt).toLocaleDateString(language === "en" ? "en-GB" : "uk-UA");

  return (
    <Card title={tr("Епідситуація із захворюваності на грип, ГРВІ та COVID-19 у Тернопільській області")}
      sub={`${tr("Звітний період")}: ${period} · ${tr("дані завантажено")} ${dateLoaded}`}>
      {!current ? (
        <p className="text-sm text-muted-foreground">{tr("Для вибраного періоду немає підсумкового рядка в джерелі даних.")}</p>
      ) : (
        <div className="flex flex-col gap-[1pt] text-sm leading-7">
          <p>{language === "en" ? `This report summarises epidemiological monitoring of influenza, acute respiratory infections (ARI) and COVID-19 as of ${reportingDate}.` : `Інформуємо про результати епідеміологічного моніторингу за грипом, ГРВІ та COVID-19 станом на ${reportingDate}.`}</p>
          <p>{language === "en" ? `The overall incidence of influenza, ARI and COVID-19 over the past 7 days was ${incidenceText} cases per 100,000 population (${totalCasesText} people affected), ${belowThreshold === null ? "with no low-intensity epidemic-threshold comparison available" : `${fmt(Math.abs(belowThreshold), 1)}% ${belowThreshold >= 0 ? "below" : "above"} the low-intensity epidemic threshold`}.` : `Загальна захворюваність на грип, ГРВІ та COVID-19 за останні 7 днів склала ${incidenceText} випадки на 100 тисяч населення (захворіло ${totalCasesText} осіб), що на ${lowThresholdText} епідемічного порогу низької інтенсивності.`}</p>
          <p>{language === "en" ? `In reporting week ${sample?.week ?? week.split("-")[1] ?? "—"} (${reportDay}), ARI cases ${pctChange === null ? "could not be compared with the previous week" : `${pctChange > 0 ? "increased" : pctChange < 0 ? "decreased" : "did not change"} by ${formatChange(pctChange)}`} (${totalCasesText} compared with ${prevCases === null ? "—" : fmt(prevCases)}). Children accounted for ${fmtPct(childShare)}% of cases (${children === null ? "—" : fmt(children)}); schoolchildren accounted for ${fmtPct(schoolShare)}% of cases among children (${schoolchildren === null ? "—" : fmt(schoolchildren)}). Compared with the previous week, ARI cases among children ${childrenChange === null ? "could not be compared" : `${childrenChange > 0 ? "increased" : childrenChange < 0 ? "decreased" : "did not change"} by ${formatChange(childrenChange)}`} (${children === null ? "—" : fmt(children)} versus ${prevChildren === null ? "—" : fmt(prevChildren)}); cases among schoolchildren ${schoolChange === null ? "could not be compared" : `${schoolChange > 0 ? "increased" : schoolChange < 0 ? "decreased" : "did not change"} by ${formatChange(schoolChange)}`} (${schoolchildren === null ? "—" : fmt(schoolchildren)} versus ${prevSchoolchildren === null ? "—" : fmt(prevSchoolchildren)}).` : `За останній (${sample?.week ?? week.split("-")[1] ?? "—"}) тиждень (${reportDay}) кількість захворілих ГРВІ у порівнянні з попереднім тижнем ${direction(pctChange)} на ${formatChange(pctChange)} (${totalCasesText} випадків проти ${prevCases === null ? "—" : fmt(prevCases)}). Питома вага дітей серед хворих склала ${fmtPct(childShare)}% (${children === null ? "—" : fmt(children)} ос.), школярів – ${fmtPct(schoolShare)}% (${schoolchildren === null ? "—" : fmt(schoolchildren)} ос.) від усіх захворілих дітей. У порівнянні з попереднім тижнем відмічається ${direction(childrenChange)} кількість хворих на ГРВІ дітей на ${formatChange(childrenChange)} (${children === null ? "—" : fmt(children)} випадків проти ${prevChildren === null ? "—" : fmt(prevChildren)}), школярів – ${direction(schoolChange)} на ${formatChange(schoolChange)} (${schoolchildren === null ? "—" : fmt(schoolchildren)} випадків проти ${prevSchoolchildren === null ? "—" : fmt(prevSchoolchildren)}).`}</p>
          <p>{language === "en" ? `${hospital === null ? "—" : fmt(hospital)} people were hospitalised during the reporting week, including ${hospitalChildren === null ? "—" : fmt(hospitalChildren)} children (${fmtPct(hospitalChildShare)}%). Hospitalisations ${hospitalChange === null ? "could not be compared with the previous week" : `${hospitalChange > 0 ? "increased" : hospitalChange < 0 ? "decreased" : "did not change"} by ${formatChange(hospitalChange)}`} (${hospital === null ? "—" : fmt(hospital)} versus ${prevHospital === null ? "—" : fmt(prevHospital)}).` : `Госпіталізовано за звітний тиждень ${hospital === null ? "—" : fmt(hospital)} осіб, із них ${hospitalChildren === null ? "—" : fmt(hospitalChildren)} дітей (${fmtPct(hospitalChildShare)}%). Кількість госпіталізованих ${direction(hospitalChange)} у порівнянні з минулим тижнем на ${formatChange(hospitalChange)} (госпіталізовано ${hospital === null ? "—" : fmt(hospital)} осіб проти ${prevHospital === null ? "—" : fmt(prevHospital)}).`}</p>
          <p>{language === "en" ? `${covid === null ? "—" : fmt(covid)} adult COVID-19 cases were reported this week (previous week: ${prevCovid === null ? "—" : fmt(prevCovid)}).` : `За тиждень зареєстровано ${covid === null ? "—" : fmt(covid)} ${caseWord(covid)} (дорослі) захворювання на COVID-19 (на минулому тижні – ${prevCovid === null ? "—" : fmt(prevCovid)} ${caseWord(prevCovid)}).`}</p>
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
    value === null ? tr("немає даних для порівняння") : `${value > 0 ? "+" : ""}${fmt(value, 1)}% ${tr("до попереднього тижня")}`;
  const thresholdLabel = incidence === null || low === null
    ? tr("Порівняння з епідемічним порогом: немає даних")
    : incidence < low
      ? (language === "en"
          ? `${fmt(((low - incidence) / low) * 100, 1)}% below the low-intensity threshold`
          : `${fmt(((low - incidence) / low) * 100, 1)}% нижче порогу низької інтенсивності`)
      : medium !== null && incidence >= medium
        ? high !== null && incidence >= high ? tr("Досягнуто порогу високої інтенсивності") : tr("Досягнуто порогу середньої інтенсивності")
        : tr("Досягнуто порогу низької інтенсивності");
  return (
    <section className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title">{tr("Обласний показник")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{tr("Тернопільська область")} · {tr("тиждень")} {week.split("-")[1] ?? "—"}</p>
        </div>
        <LevelBadge l={level} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">{tr("Захворюваність на 100 тис. населення")}</div>
          <div className="mt-1 font-display text-3xl font-bold text-primary">{fmt(incidence, 1)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{changeLabel(incidenceChange)}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">{tr("Випадки за тиждень")}</div>
          <div className="mt-1 font-display text-3xl font-bold">{fmt(cases)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{changeLabel(casesChange)}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">{tr("Госпіталізовано")}</div>
          <div className="mt-1 font-display text-3xl font-bold">{fmt(hospital)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{tr("За вибраний звітний тиждень")}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="text-xs text-muted-foreground">{tr("Епідемічний поріг")}</div>
          <div className="mt-1 text-base font-semibold">{thresholdLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {low === null ? tr("Пороги відсутні в джерелі") : `${tr("Низький")}: ${fmt(low, 1)}${medium === null ? "" : ` · ${tr("Середній")}: ${fmt(medium, 1)}`}${high === null ? "" : ` · ${tr("Високий")}: ${fmt(high, 1)}`}`}
          </div>
        </div>
      </div>
      {!current && <p className="mt-3 text-sm text-muted-foreground">{tr("Для вибраного періоду обласний підсумок відсутній у джерелі даних.")}</p>}
    </section>
  );
}

function Kpis({ focus, prev, prevWeek, label }: { focus?: Row; prev?: Row; prevWeek?: string; label: string }) {
  const items = [
    { k: "cases_total", t: tr("Випадки всього"), icon: Users, d: 0 },
    { k: "cases_children_under_18", t: tr("Діти до 18 років"), icon: Baby, d: 0 },
    { k: "hospitalized_total", t: tr("Госпіталізовано"), icon: BedDouble, d: 0 },
    { k: "incidence_per_100k", t: tr("На 100 тис. населення"), icon: Activity, d: 1 },
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
            {prevWeek && prev && <> · {tr("тиж.")} {prevWeek.split("-")[1]}: {fmt(num(prev[k]), d)}</>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChildAdult({ r }: { r?: Row }) {
  const all = num(r?.cases_total), ch = num(r?.cases_children_under_18);
  if (all === null || ch === null) return <p className="text-sm text-muted-foreground">{tr("Немає даних")}</p>;
  const d = [{ name: tr("Діти до 18"), value: ch }, { name: tr("Дорослі"), value: all - ch }];
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
            <div className="text-xs text-muted-foreground">{fmt(x.value)} {tr("випадків")}</div>
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
            <th className="py-2">{tr("Територія")}</th><th>{tr("Тип")}</th><th className="text-right">{tr("Випадки")}</th><th className="text-right">{tr("Діти")}</th>
            <th className="text-right">{tr("Госпіт.")}</th><th className="text-right">{tr("Госпіт. діти")}</th><th className="text-right">{tr("На 100 тис.")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isTotal = r.record_type === "total";
            return (
              <tr key={r.administrative_territory!}
                onClick={() => !isTotal && onSelect(selected === r.administrative_territory ? null : r.administrative_territory)}
                className={`border-b last:border-0 ${isTotal ? "bg-muted font-semibold" : "cursor-pointer hover:bg-muted/60"} ${selected === r.administrative_territory ? "bg-accent" : ""}`}>
                <td className="py-2">{tr(r.administrative_territory ?? "")}</td>
                <td className="text-muted-foreground">{tr(RECORD_TYPE_LABEL[r.record_type ?? ""] ?? r.record_type ?? "")}</td>
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
      <span className={l === "nodata" ? "text-muted-foreground" : ""}>{tr(levelLabel[l])}</span>
    </span>
  );
}

function AgeChart({ r }: { r?: Row }) {
  const d = AGE_GROUPS.map(([k, n]) => ({ name: tr(n), [tr("Випадки")]: num(r?.[k]) }));
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={d}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Bar dataKey={tr("Випадки")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label={tr("Діти до 18 років")} v={num(r?.cases_children_under_18)} />
        <Stat label={tr("Школярі")} v={num(r?.cases_schoolchildren)} />
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
  if (!total) return <p className="text-sm text-muted-foreground">{tr("Немає обласного показника за цей тиждень.")}</p>;
  const r = total;
  const v = num(r.incidence_per_100k) ?? 0;
  const th = [num(r.intensity_low_threshold), num(r.intensity_medium_threshold), num(r.intensity_high_threshold)];
  const max = Math.max(num(r.intensity_high_threshold) ?? 0, v, 1) * 1.1;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between gap-3 text-sm">
          <span className="font-semibold">{tr("Тернопільська область")}</span>
          <span className="font-semibold">{fmt(num(r.incidence_per_100k), 1)} {tr("на 100 тис.")}</span>
        </div>
        <div className="relative h-4 rounded-full border border-border bg-muted/70">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: LEVEL_COLOR[intensityLevel(r)] === LEVEL_COLOR.nodata ? "var(--chart-3)" : LEVEL_COLOR[intensityLevel(r)] }} />
          {th.map((t, i) => t !== null && (
            <div
              key={i}
              title={tr(["Низький епідпоріг", "Середній епідпоріг", "Високий епідпоріг"][i]) + ": " + fmt(t, 1)}
              className="absolute -top-1.5 h-7 w-1 -translate-x-1/2 rounded-sm border border-background shadow-sm"
              style={{ left: `${Math.min(100, (t / max) * 100)}%`, background: ["#2563eb", "#d97706", "#dc2626"][i], zIndex: 2 }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {th.map((t, i) => t !== null && (
            <span key={i} className="inline-flex items-center gap-1.5 font-medium">
              <span className="inline-block h-3 w-1.5 rounded-sm" style={{ background: ["#2563eb", "#d97706", "#dc2626"][i] }} />
              {tr(["Низький", "Середній", "Високий"][i])} {tr("поріг")}: {fmt(t, 1)}
            </span>
          ))}
        </div>
        <div className="mt-1"><LevelBadge l={intensityLevel(r)} /></div>
      </div>
      <p className="text-xs text-muted-foreground">{tr("Показано лише обласний показник; вертикальні мітки позначають пороги низького, середнього та високого рівня.")}</p>
    </div>
  );
}

function IncidenceTrend({ rows, weeks, territory }: { rows: Row[]; weeks: string[]; territory: string | null }) {
  const d = weeks.map((w) => {
    const wr = rows.filter((r) => weekKey(r) === w);
    const r = territory ? wr.find((x) => x.administrative_territory === territory) : totalRow(wr);
    return {
      name: `${tr("тиж.")} ${w.split("-")[1]} / ${w.split("-")[0]}`,
      [tr("На 100 тис.")]: num(r?.incidence_per_100k),
      [tr("Низький епідпоріг")]: num(r?.intensity_low_threshold),
      [tr("Середній поріг")]: num(r?.intensity_medium_threshold),
      [tr("Високий поріг")]: num(r?.intensity_high_threshold),
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
        <Line type="monotone" dataKey={tr("На 100 тис.")} stroke="var(--chart-1)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={tr("Низький епідпоріг")} stroke="var(--chart-2)" strokeDasharray="6 4" strokeWidth={1.8} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey={tr("Середній поріг")} stroke="var(--chart-3)" strokeDasharray="3 4" strokeWidth={1.8} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey={tr("Високий поріг")} stroke="var(--chart-4)" strokeDasharray="8 4" strokeWidth={1.8} dot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CasesTrend({ rows, weeks, territory }: { rows: Row[]; weeks: string[]; territory: string | null }) {
  const d = weeks.map((w) => {
    const wr = rows.filter((r) => weekKey(r) === w);
    const r = territory ? wr.find((x) => x.administrative_territory === territory) : totalRow(wr);
    return {
      name: `${tr("тиж.")} ${w.split("-")[1]} / ${w.split("-")[0]}`,
      [tr("Усього випадків")]: num(r?.cases_total),
      [tr("Діти до 18 років")]: num(r?.cases_children_under_18),
      [tr("Школярі")]: num(r?.cases_schoolchildren),
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
        <Line type="monotone" dataKey={tr("Усього випадків")} stroke="var(--chart-1)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={tr("Діти до 18 років")} stroke="var(--chart-2)" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={tr("Школярі")} stroke="var(--chart-3)" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
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
          <h2 className="section-title flex items-center gap-2"><Syringe className="h-5 w-5 text-teal" /> {tr("Вакцинація проти грипу")}</h2>
          <p className="text-xs text-muted-foreground">{tr("Окремий блок · аркуш weekly_vaccination · без відсотків охоплення (немає знаменника)")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
            {brands.map((b) => <option key={b} value={b}>{b === "ВСЬОГО" ? tr("Усі вакцини") : tr(b)}</option>)}
          </select>
          <select value={terr} onChange={(e) => setTerr(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
            <option value="ВСЬОГО">{tr("Уся область")}</option>
            {terrs.map((t) => <option key={t}>{tr(t)}</option>)}
          </select>
        </div>
      </div>
      {wr.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{tr("Немає даних про щеплення за цей тиждень.")}</p>
      ) : (
        <>
          {allZero && (
            <div className="mt-4 flex gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {tr("Усі значення за тиждень — нулі. Потрібно підтвердити, що це фактичні нулі, а не незаповнений шаблон.")}
            </div>
          )}
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div className="space-y-3">
              <Stat label={tr("Щеплено за тиждень")} v={num(row?.vaccinated_this_week)} />
              <Stat label={tr("Групи ризику — всього")} v={num(row?.risk_groups_total)} />
              <Stat label={tr("Медичний ризик")} v={num(row?.medical_risk_total)} />
              <Stat label={tr("Епідемічний ризик")} v={num(row?.epidemic_risk_total)} />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">{tr("За групами ризику")}</div>
              <div className="space-y-1.5">
                {RISK_GROUPS.map(([k, n]) => (
                  <div key={k} className="flex justify-between border-b py-1 text-sm last:border-0">
                    <span>{tr(n)}</span><span className="font-medium">{fmt(num(row?.[k]))}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 mb-2 text-xs font-medium uppercase text-muted-foreground">{tr("За територіями")} ({brand === "ВСЬОГО" ? tr("усі вакцини") : brand})</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byTerr.map((r) => ({ name: r.administrative_territory, [tr("Щеплено")]: num(r.vaccinated_this_week) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey={tr("Щеплено")} fill="var(--teal)" radius={[4, 4, 0, 0]} />
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Пошук…")} className="rounded-md border bg-background py-1.5 pl-8 pr-2 text-sm" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm">
          <option value="">{tr("Усі типи записів")}</option>
          <option value="district">{tr("Район")}</option><option value="city">{tr("Місто")}</option><option value="total">{tr("Підсумок")}</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} {tr("записів")}</span>
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
                <span className="inline-flex items-center gap-1">{tr(c)}<ArrowUpDown className="h-3 w-3 opacity-50" /></span>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={`border-t ${r.record_type === "total" ? "bg-muted font-semibold" : ""}`}>
                {cols.map((c) => <td key={c} className={`px-2 py-1.5 ${r[c] === null ? "text-muted-foreground italic" : ""}`}>{r[c] === null ? "—" : c === "administrative_territory" ? tr(r[c] ?? "") : r[c]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{tr("«—» — відсутнє значення в джерелі (не нуль). Сірі рядки — підсумкові записи.")}</p>
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
      <h2 className="section-title">{tr("Методологічні обмеження")}</h2>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        {notes.map((n) => <li key={n} className="flex gap-2"><span className="text-teal">•</span>{tr(n)}</li>)}
      </ul>
    </section>
  );
}
