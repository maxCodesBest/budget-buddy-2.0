import { useEffect, useMemo, useState } from "react";
import { http } from "../lib/http";
import "./monthly-table.css";
import "./analytics.css";

type CategoryTotals = Record<string, number>;

export function Analytics() {
  const [totals, setTotals] = useState<CategoryTotals>({});
  const [categories, setCategories] = useState<
    Record<string, Record<string, number>>
  >({});
  // const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAllTime() {
      // setLoading(true);
      try {
        const res = await http.get(
          `http://localhost:3000/expenses/totals/by-category`
        );
        const byCategory: CategoryTotals = (res.data?.value?.totals ||
          {}) as CategoryTotals;
        if (cancelled) return;
        setTotals(byCategory);

        const cats = Object.keys(byCategory || {});
        const subResults = await Promise.all(
          cats.map((cat) =>
            http
              .get(
                `http://localhost:3000/expenses/totals/by-subcategories?category=${encodeURIComponent(
                  cat
                )}`
              )
              .then((r) => ({
                cat,
                totals: (r.data?.value?.totals || {}) as Record<string, number>,
              }))
              .catch(() => ({ cat, totals: {} as Record<string, number> }))
          )
        );
        if (cancelled) return;
        const next: Record<string, Record<string, number>> = {};
        subResults.forEach((r) => {
          next[r.cat] = r.totals || {};
        });
        setCategories(next);
      } finally {
        // if (!cancelled) setLoading(false);
      }
    }
    loadAllTime();
    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = useMemo(() => {
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    let currentAngle = 0; // in degrees
    const entries = Object.entries(totals);
    return entries.map(([label, value], idx) => {
      const pct = total > 0 ? value / total : 0;
      const angle = pct * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return { label, value, pct, start, end, idx };
    });
  }, [totals]);

  const colors = [
    "#22d3ee",
    "#818cf8",
    "#34d399",
    "#f87171",
    "#fbbf24",
    "#a78bfa",
  ];

  // const formatPct = (n: number) => (n * 100).toFixed(1) + "%";

  const perCategoryPie = useMemo(() => {
    const result: Record<
      string,
      Array<{
        label: string;
        value: number;
        pct: number;
        start: number;
        end: number;
        idx: number;
      }>
    > = {};
    Object.entries(categories || {}).forEach(([cat, entries]) => {
      const pairs = Object.entries(entries || {}).map(([sub, v]) => ({
        label: sub,
        value: Number(v || 0),
      }));
      const total = pairs.reduce((acc, p) => acc + p.value, 0);
      let currentAngle = 0;
      result[cat] = pairs.map((p, idx) => {
        const pct = total > 0 ? p.value / total : 0;
        const angle = pct * 360;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return { label: p.label, value: p.value, pct, start, end, idx };
      });
    });
    return result;
  }, [categories]);

  return (
    <div className="expense-page">
      <header className="page-header">
        <h2>Analytics</h2>
        <div className="controls">
          <div className="control" />
          <div className="control grow" />
        </div>
      </header>

      <div className="analytics-content">
        <section className="category-card analytics-overview">
          <h3 className="category-title">Spending by category</h3>
          <div className="analytics-card-inner">
            <PieChart data={pieData} colors={colors} size={300} />
            <Legend data={pieData} colors={colors} className="legend-list" />
          </div>
        </section>

        <section className="category-card analytics-overview">
          <MonthlyLine />
        </section>

        <div className="analytics-grid">
          {Object.entries(perCategoryPie).map(([cat, slices]) => (
            <section className="category-card" key={cat}>
              <h3 className="category-title">{cat}</h3>
              <div className="analytics-card-inner">
                <PieChart data={slices} colors={colors} size={280} />
                <Legend data={slices} colors={colors} className="legend-list" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
  return d;
}

function PieChart(props: {
  data: Array<{
    label: string;
    value: number;
    pct: number;
    start: number;
    end: number;
    idx: number;
  }>;
  colors: string[];
  size?: number;
}) {
  const { data, colors, size = 320 } = props;
  const r = Math.max(10, size / 2 - 20);
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ background: "transparent", borderRadius: 12 }}
    >
      {total === 0 ? (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="rgba(148, 163, 184, 0.15)" /* muted fill */
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth={1}
          />
        </>
      ) : (
        (() => {
          const nonZero = data.filter((d) => d.value > 0);
          if (nonZero.length === 1) {
            const idx = data.indexOf(nonZero[0]);
            return (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={colors[idx % colors.length]}
                opacity={0.9}
              />
            );
          }
          return data.map((d, i) => (
            <path
              key={i}
              d={describeArc(cx, cy, r, d.start, d.end)}
              fill={colors[i % colors.length]}
              opacity={0.9}
            />
          ));
        })()
      )}
    </svg>
  );
}

function MonthlyLine() {
  const [points, setPoints] = useState<
    Array<{ year: number; month: number; total: number }>
  >([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await http.get(
        `http://localhost:3000/expenses/totals/by-month`
      );
      if (cancelled) return;
      setPoints(
        (res.data?.value?.points || []) as Array<{
          year: number;
          month: number;
          total: number;
        }>
      );
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const size = { width: 1200, height: 360 };
  const margin = { top: 48, right: 40, bottom: 56, left: 92 };
  const inner = {
    width: size.width - margin.left - margin.right,
    height: size.height - margin.top - margin.bottom,
  };
  const maxY = Math.max(1, ...points.map((p) => p.total));
  const minY = 0;
  const toX = (i: number) =>
    margin.left +
    (points.length <= 1
      ? inner.width / 2
      : (i / (points.length - 1)) * inner.width);
  const toY = (v: number) =>
    margin.top + inner.height - ((v - minY) / (maxY - minY)) * inner.height;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.total)}`)
    .join(" ");

  const xLabels = points.map(
    (p) =>
      `${String(p.month).padStart(2, "0")}/${String(p.year % 100).padStart(
        2,
        "0"
      )}`
  );
  const yTicks = 4; // number of segments
  const yValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(((maxY - minY) * i) / yTicks + minY)
  );

  return (
    <div>
      <h3 className="category-title">Monthly total expenses</h3>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          width="100%"
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* axes */}
          <rect
            x={margin.left}
            y={margin.top}
            width={inner.width}
            height={inner.height}
            fill="none"
            stroke="rgba(148, 163, 184, 0.3)"
          />
          {/* Y-axis label */}
          <text
            x={20}
            y={size.height / 2}
            transform={`rotate(-90 20 ${size.height / 2})`}
            fill="#94a3b8"
            fontSize={12}
            textAnchor="middle"
          >
            Total expenses
          </text>
          {/* X-axis label */}
          <text
            x={size.width / 2}
            y={size.height - 6}
            fill="#94a3b8"
            fontSize={12}
            textAnchor="middle"
          >
            Date (MM/YY)
          </text>
          {/* Y-axis ticks and labels */}
          {yValues.map((v, i) => (
            <g key={`y-${i}`}>
              <line
                x1={margin.left - 4}
                x2={margin.left}
                y1={toY(v)}
                y2={toY(v)}
                stroke="rgba(148, 163, 184, 0.6)"
              />
              <text
                x={margin.left - 10}
                y={toY(v)}
                fill="#94a3b8"
                fontSize={11}
                textAnchor="end"
                dominantBaseline="central"
              >
                {v.toLocaleString()}
              </text>
            </g>
          ))}
          {/* X-axis ticks and labels */}
          {points.map((_, i) => (
            <g key={`x-${i}`}>
              <line
                x1={toX(i)}
                x2={toX(i)}
                y1={margin.top + inner.height}
                y2={margin.top + inner.height + 4}
                stroke="rgba(148, 163, 184, 0.6)"
              />
              <text
                x={toX(i)}
                y={margin.top + inner.height + 16}
                fill="#94a3b8"
                fontSize={11}
                textAnchor="middle"
              >
                {xLabels[i]}
              </text>
            </g>
          ))}
          {/* line */}
          {points.length > 0 ? (
            <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth={2} />
          ) : (
            <text
              x={size.width / 2}
              y={size.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#94a3b8"
            >
              No data
            </text>
          )}
          {/* markers */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(p.total)}
              r={3}
              fill="#22d3ee"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function Legend(props: {
  data: Array<{
    label: string;
    value: number;
    pct: number;
    start: number;
    end: number;
    idx: number;
  }>;
  colors: string[];
  className?: string;
}) {
  const { data, colors, className } = props;
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div
      className={className}
      style={{ display: "grid", gap: 8, alignContent: "start" }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          className="summary-row"
          style={{ display: "flex", gap: 12 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              background: colors[i % colors.length],
              borderRadius: 2,
            }}
          />
          <span style={{ flex: 1 }}>{d.label}</span>
          <strong>{(d.value || 0).toLocaleString()}</strong>
          <span style={{ color: "#94a3b8", width: 64, textAlign: "right" }}>
            {total > 0 ? (d.pct * 100).toFixed(1) + "%" : "0.0%"}
          </span>
        </div>
      ))}
    </div>
  );
}
