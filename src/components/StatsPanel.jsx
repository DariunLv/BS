import React, { useMemo, useRef, useEffect } from 'react';
import { Card, Text, Badge, Select } from '@mantine/core';
import {
  IconChartBar, IconChartLine, IconChartPie, IconTrendingUp,
  IconTrendingDown, IconReceipt, IconCash, IconScale,
  IconPercentage, IconUsers, IconTruckDelivery, IconTarget,
  IconChartDots, IconArrowUpRight, IconArrowDownRight,
  IconEqual, IconMathFunction,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import * as echarts from 'echarts';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/* ====== UTILIDADES ESTADISTICAS ====== */

// Regresion lineal simple: y = a + bx
function linearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, predict: () => 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  data.forEach((d, i) => {
    sumX += i;
    sumY += d;
    sumXY += i * d;
    sumX2 += i * i;
    sumY2 += d * d;
  });
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  // Coeficiente de determinacion R^2
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  data.forEach((d, i) => {
    ssTot += (d - yMean) ** 2;
    ssRes += (d - (intercept + slope * i)) ** 2;
  });
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return {
    slope, intercept, r2,
    predict: (x) => intercept + slope * x,
  };
}

// Media, desviacion estandar, CV
function calcStats(arr) {
  if (arr.length === 0) return { mean: 0, std: 0, cv: 0, median: 0, min: 0, max: 0 };
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : (std / mean) * 100;
  const sorted = [...arr].sort((a, b) => a - b);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  return { mean, std, cv, median, min: sorted[0], max: sorted[n - 1] };
}

// Tasa de crecimiento mensual compuesta (CMGR)
function compoundGrowthRate(first, last, periods) {
  if (first <= 0 || periods <= 0) return 0;
  return (Math.pow(last / first, 1 / periods) - 1) * 100;
}

/* ====== CHART WRAPPER (renderiza echarts directo) ====== */
function EChart({ option, height = 280 }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    }
    instanceRef.current.setOption(option, true);

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/* ====== COMPONENTE PRINCIPAL ====== */
export default function StatsPanel({ sales, investments }) {
  // ---- Agrupar datos por mes ----
  const monthlyData = useMemo(() => {
    const map = {};
    const addToMonth = (date, key, amount) => {
      if (!date) return;
      const d = new Date(date);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[mKey]) map[mKey] = { ventas: 0, gastos: 0, countVentas: 0, countGastos: 0 };
      map[mKey][key] += amount;
      if (key === 'ventas') map[mKey].countVentas += 1;
      else map[mKey].countGastos += 1;
    };
    sales.forEach(s => addToMonth(s.fecha, 'ventas', parseFloat(s.precio) || 0));
    investments.forEach(i => addToMonth(i.fecha, 'gastos', parseFloat(i.monto) || 0));
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => ({
      month: key,
      label: `${MONTH_NAMES[parseInt(key.split('-')[1]) - 1]} ${key.split('-')[0]}`,
      shortLabel: MONTH_NAMES[parseInt(key.split('-')[1]) - 1],
      ...val,
      ganancia: val.ventas - val.gastos,
    }));
  }, [sales, investments]);

  // ---- Totales generales ----
  const totalVentas = sales.reduce((s, v) => s + (parseFloat(v.precio) || 0), 0);
  const totalGastos = investments.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0);
  const totalGanancia = totalVentas - totalGastos;
  const margenGanancia = totalVentas > 0 ? (totalGanancia / totalVentas) * 100 : 0;
  const roi = totalGastos > 0 ? (totalGanancia / totalGastos) * 100 : 0;
  const ticketPromedio = sales.length > 0 ? totalVentas / sales.length : 0;

  // ---- Stats de ventas mensuales ----
  const ventasMensuales = monthlyData.map(m => m.ventas);
  const gananciasMensuales = monthlyData.map(m => m.ganancia);
  const statsVentas = calcStats(ventasMensuales);
  const statsGanancias = calcStats(gananciasMensuales);

  // ---- Regresion lineal sobre ventas mensuales ----
  const regVentas = useMemo(() => linearRegression(ventasMensuales), [ventasMensuales]);
  const proyeccionSiguienteMes = regVentas.predict(ventasMensuales.length);

  // ---- Crecimiento ----
  const crecimiento = ventasMensuales.length >= 2
    ? compoundGrowthRate(ventasMensuales[0] || 1, ventasMensuales[ventasMensuales.length - 1] || 1, ventasMensuales.length - 1)
    : 0;

  // ---- Gastos por categoria ----
  const gastosPorCategoria = useMemo(() => {
    const map = {};
    investments.forEach(i => {
      const cat = i.categoria || 'Otros';
      map[cat] = (map[cat] || 0) + (parseFloat(i.monto) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [investments]);

  // ---- Ventas por socio ----
  const ventasPorSocio = useMemo(() => {
    const map = { Yefer: 0, Frank: 0, Ambos: 0, 'Sin asignar': 0 };
    sales.forEach(s => {
      const socio = s.socio || 'Sin asignar';
      map[socio] = (map[socio] || 0) + (parseFloat(s.precio) || 0);
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [sales]);

  // ---- Ventas por medio de entrega ----
  const ventasPorMedio = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      const medio = s.medioEntrega || 'No especificado';
      map[medio] = (map[medio] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [sales]);

  // ---- Ventas por socio por mes (para stacked bar) ----
  const ventasSocioPorMes = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      if (!s.fecha) return;
      const d = new Date(s.fecha);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[mKey]) map[mKey] = { Yefer: 0, Frank: 0, Ambos: 0 };
      const socio = s.socio || 'Ambos';
      map[mKey][socio] = (map[mKey][socio] || 0) + (parseFloat(s.precio) || 0);
    });
    return monthlyData.map(m => ({
      month: m.shortLabel,
      Yefer: map[m.month]?.Yefer || 0,
      Frank: map[m.month]?.Frank || 0,
      Ambos: map[m.month]?.Ambos || 0,
    }));
  }, [sales, monthlyData]);

  // ---- Acumulado ----
  const acumulado = useMemo(() => {
    let cumVentas = 0, cumGastos = 0;
    return monthlyData.map(m => {
      cumVentas += m.ventas;
      cumGastos += m.gastos;
      return { label: m.shortLabel, cumVentas, cumGastos, cumGanancia: cumVentas - cumGastos };
    });
  }, [monthlyData]);

  // ---- Top productos mas vendidos ----
  const topProductos = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      const prod = s.producto || 'Sin nombre';
      if (!map[prod]) map[prod] = { count: 0, total: 0 };
      map[prod].count += 1;
      map[prod].total += parseFloat(s.precio) || 0;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [sales]);

  /* ============================================================
     OPCIONES DE CHARTS (ECharts)
     ============================================================ */

  const baseTextStyle = { fontFamily: '"Outfit", sans-serif', fontSize: 11 };
  const baseTitleStyle = { fontFamily: '"Playfair Display", serif', fontSize: 14, fontWeight: 600, color: COLORS.navy, left: 'center' };
  const gridBase = { left: 48, right: 16, top: 50, bottom: 30 };

  // 1) Ventas vs Gastos vs Ganancia mensual
  const chartVentasGastos = {
    title: { text: 'Ventas vs Gastos Mensual', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle },
    legend: { top: 28, textStyle: { ...baseTextStyle, fontSize: 10 } },
    grid: gridBase,
    xAxis: { type: 'category', data: monthlyData.map(m => m.shortLabel), axisLabel: baseTextStyle },
    yAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    series: [
      {
        name: 'Ventas', type: 'bar', data: monthlyData.map(m => m.ventas),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#34d399' }, { offset: 1, color: '#059669' }
        ]), borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Gastos', type: 'bar', data: monthlyData.map(m => m.gastos),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#fb7185' }, { offset: 1, color: '#e11d48' }
        ]), borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Ganancia', type: 'line', data: monthlyData.map(m => m.ganancia),
        lineStyle: { color: '#2c4a80', width: 2.5 },
        itemStyle: { color: '#2c4a80' },
        symbol: 'circle', symbolSize: 6,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(44,74,128,0.15)' }, { offset: 1, color: 'rgba(44,74,128,0)' }
        ]) },
      },
    ],
  };

  // 2) Ganancia neta mensual (barras verde/rojo)
  const chartGananciaMensual = {
    title: { text: 'Ganancia Neta por Mes', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle, formatter: (p) => {
      const v = p[0]; return `${v.name}<br/>Ganancia: <b>S/.${v.value.toFixed(2)}</b>`;
    }},
    grid: gridBase,
    xAxis: { type: 'category', data: monthlyData.map(m => m.shortLabel), axisLabel: baseTextStyle },
    yAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    series: [{
      type: 'bar', data: monthlyData.map(m => ({
        value: m.ganancia,
        itemStyle: {
          color: m.ganancia >= 0
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#059669' }])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#fb7185' }, { offset: 1, color: '#e11d48' }]),
          borderRadius: m.ganancia >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
        },
      })),
      label: { show: monthlyData.length <= 8, position: 'top', formatter: (p) => `S/.${p.value.toFixed(0)}`, ...baseTextStyle, fontSize: 9, color: '#666' },
    }],
  };

  // 3) Distribucion de gastos (donut)
  const chartGastosPie = {
    title: { text: 'Distribucion de Gastos', ...baseTitleStyle },
    tooltip: { trigger: 'item', textStyle: baseTextStyle, formatter: '{b}: S/.{c} ({d}%)' },
    legend: { bottom: 0, textStyle: { ...baseTextStyle, fontSize: 9 } },
    grid: { top: 40 },
    color: ['#f76707', '#e11d48', '#2c4a80', '#059669', '#7c3aed', '#0891b2', '#d97706', '#64748b'],
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      center: ['50%', '48%'],
      data: gastosPorCategoria,
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 'bold', fontSize: 12, fontFamily: '"Outfit", sans-serif' } },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    }],
  };

  // 4) Ventas por socio (donut)
  const chartSocioPie = {
    title: { text: 'Ventas por Socio', ...baseTitleStyle },
    tooltip: { trigger: 'item', textStyle: baseTextStyle, formatter: '{b}: S/.{c} ({d}%)' },
    color: ['#2c4a80', '#f76707', '#7c3aed', '#94a3b8'],
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      center: ['50%', '55%'],
      data: ventasPorSocio,
      label: { formatter: '{b}\n{d}%', ...baseTextStyle, fontSize: 10 },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    }],
  };

  // 5) Ventas por socio por mes (stacked bar)
  const chartSocioMes = {
    title: { text: 'Ventas por Socio / Mes', ...baseTitleStyle },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: baseTextStyle },
    legend: { top: 28, textStyle: { ...baseTextStyle, fontSize: 10 } },
    grid: gridBase,
    xAxis: { type: 'category', data: ventasSocioPorMes.map(m => m.month), axisLabel: baseTextStyle },
    yAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    series: [
      { name: 'Yefer', type: 'bar', stack: 'total', data: ventasSocioPorMes.map(m => m.Yefer), itemStyle: { color: '#2c4a80', borderRadius: [0, 0, 0, 0] } },
      { name: 'Frank', type: 'bar', stack: 'total', data: ventasSocioPorMes.map(m => m.Frank), itemStyle: { color: '#f76707' } },
      { name: 'Ambos', type: 'bar', stack: 'total', data: ventasSocioPorMes.map(m => m.Ambos), itemStyle: { color: '#7c3aed', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  // 6) Medio de entrega (bar horizontal)
  const chartMedioEntrega = {
    title: { text: 'Medio de Entrega', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle },
    grid: { left: 120, right: 24, top: 40, bottom: 16 },
    xAxis: { type: 'value', axisLabel: baseTextStyle },
    yAxis: { type: 'category', data: ventasPorMedio.map(m => m.name), axisLabel: { ...baseTextStyle, fontSize: 10 } },
    series: [{
      type: 'bar', data: ventasPorMedio.map(m => m.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#f76707' }, { offset: 1, color: '#ff922b' }
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: 'right', formatter: '{c}', ...baseTextStyle },
    }],
  };

  // 7) Tendencia acumulada
  const chartAcumulado = {
    title: { text: 'Tendencia Acumulada', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle },
    legend: { top: 28, textStyle: { ...baseTextStyle, fontSize: 10 } },
    grid: gridBase,
    xAxis: { type: 'category', data: acumulado.map(a => a.label), axisLabel: baseTextStyle },
    yAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    series: [
      {
        name: 'Ventas acum.', type: 'line', data: acumulado.map(a => a.cumVentas),
        lineStyle: { color: '#059669', width: 2 }, itemStyle: { color: '#059669' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(5,150,105,0.2)' }, { offset: 1, color: 'rgba(5,150,105,0)' }
        ]) }, smooth: true,
      },
      {
        name: 'Gastos acum.', type: 'line', data: acumulado.map(a => a.cumGastos),
        lineStyle: { color: '#e11d48', width: 2 }, itemStyle: { color: '#e11d48' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(225,29,72,0.12)' }, { offset: 1, color: 'rgba(225,29,72,0)' }
        ]) }, smooth: true,
      },
      {
        name: 'Ganancia acum.', type: 'line', data: acumulado.map(a => a.cumGanancia),
        lineStyle: { color: '#2c4a80', width: 2.5, type: 'dashed' }, itemStyle: { color: '#2c4a80' },
        smooth: true,
      },
    ],
  };

  // 8) Regresion / Proyeccion
  const regLineData = ventasMensuales.map((_, i) => parseFloat(regVentas.predict(i).toFixed(2)));
  const projLabels = [...monthlyData.map(m => m.shortLabel)];
  const projVentas = [...ventasMensuales];
  const projReg = [...regLineData];
  // Agregar 2 meses de proyeccion
  if (monthlyData.length > 0) {
    const lastMonth = monthlyData[monthlyData.length - 1].month;
    for (let i = 1; i <= 2; i++) {
      const [y, mo] = lastMonth.split('-').map(Number);
      const nm = mo + i > 12 ? mo + i - 12 : mo + i;
      projLabels.push(MONTH_NAMES[nm - 1] + '?');
      projVentas.push(null);
      projReg.push(parseFloat(regVentas.predict(ventasMensuales.length - 1 + i).toFixed(2)));
    }
  }

  const chartProyeccion = {
    title: { text: 'Tendencia y Proyeccion (Reg. Lineal)', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle },
    legend: { top: 28, textStyle: { ...baseTextStyle, fontSize: 10 } },
    grid: gridBase,
    xAxis: { type: 'category', data: projLabels, axisLabel: baseTextStyle },
    yAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    series: [
      {
        name: 'Ventas reales', type: 'bar', data: projVentas,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#34d399' }, { offset: 1, color: '#059669' }
        ]), borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Regresion lineal', type: 'line', data: projReg,
        lineStyle: { color: '#f76707', width: 2, type: 'dashed' },
        itemStyle: { color: '#f76707' }, symbol: 'diamond', symbolSize: 6,
      },
    ],
  };

  // 9) Top productos
  const chartTopProductos = {
    title: { text: 'Top Productos (por ingreso)', ...baseTitleStyle },
    tooltip: { trigger: 'axis', textStyle: baseTextStyle },
    grid: { left: 110, right: 24, top: 40, bottom: 16 },
    xAxis: { type: 'value', axisLabel: { ...baseTextStyle, formatter: 'S/.{value}' } },
    yAxis: {
      type: 'category',
      data: topProductos.map(p => p.name.length > 16 ? p.name.slice(0, 16) + '...' : p.name).reverse(),
      axisLabel: { ...baseTextStyle, fontSize: 9 },
    },
    series: [{
      type: 'bar',
      data: topProductos.map(p => p.total).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#2c4a80' }, { offset: 1, color: '#4a7abf' }
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true, position: 'right',
        formatter: (p) => `S/.${p.value.toFixed(0)} (${topProductos[topProductos.length - 1 - p.dataIndex]?.count || 0})`,
        ...baseTextStyle, fontSize: 9, color: '#666',
      },
    }],
  };

  /* ============================================================
     RENDER
     ============================================================ */
  const noData = sales.length === 0 && investments.length === 0;

  if (noData) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <IconChartBar size={48} color={COLORS.borderLight} style={{ margin: '0 auto 12px' }} />
        <Text size="sm" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif' }}>
          Aun no hay datos para mostrar estadisticas. Registra ventas y gastos para ver los graficos.
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconChartDots size={20} color={COLORS.navy} />
        <Text size="md" fw={600} style={{ fontFamily: '"Playfair Display", serif', color: COLORS.navy }}>
          Panel de Estadisticas
        </Text>
      </div>

      {/* KPIs PRINCIPALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        <KpiCard icon={IconReceipt} label="Ticket Promedio" value={`S/.${ticketPromedio.toFixed(2)}`} sub={`${sales.length} ventas`} color="#2c4a80" bg="#e6f0ff" />
        <KpiCard icon={IconPercentage} label="Margen Ganancia" value={`${margenGanancia.toFixed(1)}%`} sub={margenGanancia >= 0 ? 'Positivo' : 'Negativo'} color={margenGanancia >= 0 ? '#059669' : '#e11d48'} bg={margenGanancia >= 0 ? '#e6f9e6' : '#fee6e6'} />
        <KpiCard icon={IconTrendingUp} label="ROI" value={`${roi.toFixed(1)}%`} sub="Retorno s/ inversion" color={roi >= 0 ? '#059669' : '#e11d48'} bg={roi >= 0 ? '#e6f9e6' : '#fee6e6'} />
        <KpiCard icon={crecimiento >= 0 ? IconArrowUpRight : IconArrowDownRight} label="Crecimiento" value={`${crecimiento.toFixed(1)}%`} sub="CMGR mensual" color={crecimiento >= 0 ? '#059669' : '#e11d48'} bg={crecimiento >= 0 ? '#e6f9e6' : '#fee6e6'} />
      </div>

      {/* STATS DESCRIPTIVAS */}
      <Card padding="sm" radius="md" mb={14} style={{ border: `1px solid ${COLORS.borderLight}`, background: '#fafbff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <IconMathFunction size={16} color="#7c3aed" />
          <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#7c3aed' }}>Estadistica Descriptiva - Ventas Mensuales</Text>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <MiniStat label="Media" value={`S/.${statsVentas.mean.toFixed(0)}`} />
          <MiniStat label="Mediana" value={`S/.${statsVentas.median.toFixed(0)}`} />
          <MiniStat label="Desv. Est." value={`S/.${statsVentas.std.toFixed(0)}`} />
          <MiniStat label="CV" value={`${statsVentas.cv.toFixed(1)}%`} />
          <MiniStat label="Min" value={`S/.${statsVentas.min.toFixed(0)}`} />
          <MiniStat label="Max" value={`S/.${statsVentas.max.toFixed(0)}`} />
        </div>
        {ventasMensuales.length >= 3 && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0eeff', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconTarget size={14} color="#7c3aed" />
              <Text size="xs" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem' }}>
                <strong>Reg. Lineal:</strong> y = {regVentas.intercept.toFixed(1)} + {regVentas.slope.toFixed(1)}x | 
                R² = {regVentas.r2.toFixed(3)} | 
                Proyeccion sig. mes: <strong style={{ color: '#f76707' }}>S/.{Math.max(0, proyeccionSiguienteMes).toFixed(0)}</strong>
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* CHARTS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Ventas vs Gastos */}
        <ChartCard>
          <EChart option={chartVentasGastos} height={280} />
        </ChartCard>

        {/* Ganancia neta mensual */}
        <ChartCard>
          <EChart option={chartGananciaMensual} height={250} />
        </ChartCard>

        {/* Dos columnas: Gastos pie + Socio pie */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartCard>
            <EChart option={chartGastosPie} height={280} />
          </ChartCard>
          <ChartCard>
            <EChart option={chartSocioPie} height={280} />
          </ChartCard>
        </div>

        {/* Ventas por socio por mes */}
        <ChartCard>
          <EChart option={chartSocioMes} height={260} />
        </ChartCard>

        {/* Dos columnas: Medio entrega + Top productos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartCard>
            <EChart option={chartMedioEntrega} height={220} />
          </ChartCard>
          <ChartCard>
            <EChart option={chartTopProductos} height={280} />
          </ChartCard>
        </div>

        {/* Acumulado */}
        <ChartCard>
          <EChart option={chartAcumulado} height={280} />
        </ChartCard>

        {/* Proyeccion */}
        {ventasMensuales.length >= 2 && (
          <ChartCard>
            <EChart option={chartProyeccion} height={280} />
          </ChartCard>
        )}
      </div>

      {/* PIE DE PAGINA ESTADISTICO */}
      <Card padding="sm" radius="md" mt={14} style={{ background: '#f8f9fa', border: `1px solid ${COLORS.borderLight}` }}>
        <Text size="xs" c="dimmed" ta="center" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem' }}>
          Datos basados en {sales.length} ventas y {investments.length} gastos registrados
          {monthlyData.length > 0 && ` | Periodo: ${monthlyData[0]?.label} - ${monthlyData[monthlyData.length - 1]?.label}`}
          {ventasMensuales.length >= 3 && ` | R² = ${regVentas.r2.toFixed(3)} (${regVentas.r2 > 0.7 ? 'buen ajuste' : regVentas.r2 > 0.4 ? 'ajuste moderado' : 'ajuste bajo'})`}
        </Text>
      </Card>
    </div>
  );
}

/* ====== MINI COMPONENTES ====== */

function KpiCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <Card padding="sm" radius="md" style={{ background: bg, border: `1px solid ${color}20`, textAlign: 'center' }}>
      <Icon size={18} color={color} style={{ margin: '0 auto 4px' }} />
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem' }}>{label}</Text>
      <Text size="md" fw={700} style={{ color, fontFamily: '"Outfit", sans-serif' }}>{value}</Text>
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem' }}>{sub}</Text>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 2px', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem' }}>{label}</Text>
      <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: COLORS.navy }}>{value}</Text>
    </div>
  );
}

function ChartCard({ children }) {
  return (
    <Card padding="sm" radius="md" style={{ border: `1px solid ${COLORS.borderLight}`, background: '#fff', overflow: 'hidden' }}>
      {children}
    </Card>
  );
}