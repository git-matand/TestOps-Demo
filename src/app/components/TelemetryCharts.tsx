import { useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TestBench } from "../data";
import { makeSeries } from "../utils";

// ─── types ──────────────────────────────────────────────────────────────────

export type TimeRange = "Last 6 h" | "Last 24 h" | "Last 7 d";

interface DataPoint {
  t: string;        // x-axis label (shown only at ticks)
  tFull: string;    // full timestamp for tooltip
  cpu: number;
  mem: number;
  disk: number;
  net: number;
  temp: number;
  cmpCpu?: number;
  cmpMem?: number;
  cmpDisk?: number;
}

// ─── data generation ────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return d.toTimeString().slice(0, 5);
}
function fmtDay(d: Date) {
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function makeTimeSeriesData(
  range: TimeRange,
  bench: TestBench,
  cmpBench?: TestBench | null,
): DataPoint[] {
  const configs: Record<TimeRange, { n: number; stepMs: number; tick: (i: number, n: number) => boolean; fmt: (d: Date) => string }> = {
    "Last 6 h":  { n: 72,  stepMs: 5 * 60_000,  tick: (i) => i % 12 === 0, fmt: fmtTime },
    "Last 24 h": { n: 96,  stepMs: 15 * 60_000, tick: (i) => i % 8 === 0,  fmt: fmtTime },
    "Last 7 d":  { n: 168, stepMs: 60 * 60_000, tick: (i) => i % 24 === 0, fmt: fmtDay  },
  };
  const { n, stepMs, tick, fmt } = configs[range];
  const now = Date.now();

  const cpuB  = bench.telemetry.cpuPct;
  const memB  = bench.telemetry.memUsedGb;
  const diskB = bench.telemetry.diskPct;
  const tempB = cpuB > 80 ? 76 : cpuB > 60 ? 58 : cpuB > 40 ? 46 : 38;

  // disk slowly fills over 7d if bench is Down with full disk
  const diskTrend = bench.status === "Down" && bench.telemetry.diskPct > 90 ? 0.8 : 0;

  const cpuS  = makeSeries(n, cpuB,  18, 1);
  const memS  = makeSeries(n, memB,   1.8, 2);
  const diskS = makeSeries(n, diskB,  4, 3, diskTrend);
  const netS  = makeSeries(n, 48,    42, 4);
  const tempS = makeSeries(n, tempB, 10, 5);

  const cmpCpuS  = cmpBench ? makeSeries(n, cmpBench.telemetry.cpuPct, 18, 10) : null;
  const cmpMemS  = cmpBench ? makeSeries(n, cmpBench.telemetry.memUsedGb, 1.8, 11) : null;
  const cmpDiskS = cmpBench ? makeSeries(n, cmpBench.telemetry.diskPct, 4, 12) : null;

  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now - (n - 1 - i) * stepMs);
    const label = tick(i, n) ? fmt(d) : "";
    const full  = range === "Last 7 d"
      ? `${fmtDay(d)} ${fmtTime(d)}`
      : fmtTime(d);
    return {
      t:    label,
      tFull: full,
      cpu:  +cpuS[i].toFixed(1),
      mem:  +memS[i].toFixed(2),
      disk: +diskS[i].toFixed(1),
      net:  +netS[i].toFixed(1),
      temp: +tempS[i].toFixed(1),
      ...(cmpCpuS  && { cmpCpu:  +cmpCpuS[i].toFixed(1)  }),
      ...(cmpMemS  && { cmpMem:  +cmpMemS[i].toFixed(2)  }),
      ...(cmpDiskS && { cmpDisk: +cmpDiskS[i].toFixed(1) }),
    };
  });
}

// ─── shared tooltip ──────────────────────────────────────────────────────────

function Tip({ active, payload, label, unit, tFull }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--panel-3)", border: "1px solid var(--line-2)",
      borderRadius: 8, padding: "9px 13px", fontSize: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,.5)",
    }}>
      {(tFull || label) && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-3)", marginBottom: 6 }}>
          {tFull || label}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--ink-2)" }}>{p.name}:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600, fontFamily: "var(--mono)" }}>
            {p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── single metric area chart ─────────────────────────────────────────────────

interface TsChartProps {
  data: DataPoint[];
  dataKey: keyof DataPoint;
  cmpKey?: keyof DataPoint;
  label: string;
  cmpLabel?: string;
  unit: string;
  color: string;
  cmpColor?: string;
  domain?: [number, number];
  threshold?: { value: number; label: string };
  height?: number;
  currentVal: string;
  cmpCurrentVal?: string;
}

export function TsChart({
  data, dataKey, cmpKey, label, cmpLabel, unit, color, cmpColor,
  domain, threshold, height = 140, currentVal, cmpCurrentVal,
}: TsChartProps) {
  const tip = ({ active, payload }: any) => {
    const point = payload?.[0]?.payload as DataPoint | undefined;
    return (
      <Tip active={active} payload={payload} unit={unit} tFull={point?.tFull} label="" />
    );
  };

  return (
    <div className="to-panel" style={{ overflow: "hidden" }}>
      <div className="to-panel-h">
        <span className="to-eyebrow">{label}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--mono)",
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            color, borderRadius: 5, padding: "2px 8px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            {currentVal}{unit}
          </span>
          {cmpKey && cmpCurrentVal && cmpColor && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontFamily: "var(--mono)",
              background: `color-mix(in srgb, ${cmpColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${cmpColor} 30%, transparent)`,
              color: cmpColor, borderRadius: 5, padding: "2px 8px",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cmpColor }} />
              {cmpCurrentVal}{unit}
            </span>
          )}
        </div>
      </div>
      <div className="to-panel-b" style={{ padding: "4px 0 0" }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 32 }}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
              {cmpKey && cmpColor && (
                <linearGradient id={`g-${cmpKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cmpColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={cmpColor} stopOpacity={0.01} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--ink-3)", fontSize: 9.5, fontFamily: "var(--mono)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,.07)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={domain || ["auto", "auto"]}
              tick={{ fill: "var(--ink-3)", fontSize: 9.5, fontFamily: "var(--mono)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}${unit}`}
              width={30}
            />
            <Tooltip content={tip} cursor={{ stroke: "rgba(255,255,255,.1)", strokeWidth: 1 }} />
            {threshold && (
              <ReferenceLine
                y={threshold.value}
                stroke="var(--bad)"
                strokeDasharray="4 3"
                label={{ value: threshold.label, fill: "var(--bad)", fontSize: 9, fontFamily: "var(--mono)", position: "insideTopRight" }}
              />
            )}
            <Area
              type="monotone"
              dataKey={dataKey as string}
              name={label}
              stroke={color}
              strokeWidth={1.8}
              fill={`url(#g-${dataKey})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "var(--panel)", strokeWidth: 2 }}
            />
            {cmpKey && cmpColor && (
              <Area
                type="monotone"
                dataKey={cmpKey as string}
                name={cmpLabel || "Compare"}
                stroke={cmpColor}
                strokeWidth={1.8}
                strokeDasharray="5 3"
                fill={`url(#g-${cmpKey})`}
                dot={false}
                activeDot={{ r: 4, fill: cmpColor, stroke: "var(--panel)", strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── mini sparkline (for metric tiles in Overview) ───────────────────────────

interface SparkProps {
  data: number[];
  color: string;
  height?: number;
}

export function Spark({ data, color, height = 32 }: SparkProps) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── metric tile (replaces gauge in Overview) ─────────────────────────────────

interface MetricTileProps {
  label: string;
  value: number;
  unit: string;
  subtext?: string;
  max?: number;
  color: string;
  sparkData: number[];
}

export function MetricTile({ label, value, unit, subtext, max = 100, color, sparkData }: MetricTileProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{
      background: "var(--panel-2)", border: "1px solid var(--line)",
      borderRadius: 10, padding: "14px 16px", display: "flex",
      flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 550, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
            {value}<span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-3)", marginLeft: 3 }}>{unit}</span>
          </div>
          {subtext && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>
              {subtext}
            </div>
          )}
        </div>
        <div style={{ width: 72, height: 32 }}>
          <Spark data={sparkData} color={color} />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: "var(--ink-3)" }}>Usage</span>
          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color }}>{pct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 3, background: "var(--panel-3)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3, background: color,
            width: `${pct}%`, transition: "width .3s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── hook: produces all chart data memoized on range/bench ──────────────────

export function useTelemetryData(range: TimeRange, bench: TestBench, cmpBench?: TestBench | null) {
  return useMemo(
    () => makeTimeSeriesData(range, bench, cmpBench),
    [range, bench.id, cmpBench?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
}
