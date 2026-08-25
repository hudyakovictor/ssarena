import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import { C } from "../lib/data";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingChart({
  data,
  height = 300,
  resistanceLevel,
  showFOMOWarning = false,
}: {
  data: CandleData[];
  height?: number;
  resistanceLevel?: number;
  showFOMOWarning?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#05070f" },
        textColor: "#5e6d85",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        textColor: "#94a3b8",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // v4 API
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: C.long,
      downColor: C.short,
      borderDownColor: C.short,
      borderUpColor: C.long,
      wickDownColor: C.short,
      wickUpColor: C.long,
    });

    candleSeries.setData(data);

    // Resistance line
    if (resistanceLevel) {
      try {
        candleSeries.createPriceLine({
          price: resistanceLevel,
          color: C.gold,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "RESISTANCE",
        });
      } catch { /* API may vary */ }
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, [data, height, resistanceLevel, showFOMOWarning]);

  return (
    <div ref={containerRef} className="rounded-xl border border-[var(--edge)] overflow-hidden" style={{ height }} />
  );
}

// Generate mock candles for demo
export function generateMockCandles(count: number, trend: "up" | "down" | "range" = "up"): CandleData[] {
  const candles: CandleData[] = [];
  let price = 3200;
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < count; i++) {
    const time = Math.floor(Date.UTC(2026, 6, 3, 0, 0, 0) / 1000) + i * 3600;

    const trendBias = trend === "up" ? 0.004 : trend === "down" ? -0.004 : 0;
    const volatility = 0.015;
    const move = (rand() - 0.48 + trendBias) * price * volatility;

    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + rand() * price * volatility * 0.5;
    const low = Math.min(open, close) - rand() * price * volatility * 0.5;

    candles.push({ time, open, high, low, close });
    price = close;
  }

  return candles;
}
