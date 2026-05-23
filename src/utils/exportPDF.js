// src/utils/exportPDF.js
// ─────────────────────────────────────────────────────────────────────────────
// Genera un PDF legible del reporte de ventas/gastos/pagos.
// Usa la impresión nativa del navegador (window.print) → "Guardar como PDF".
// Ventaja: NO requiere librerías externas, funciona en PC y celular.
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => `S/. ${(parseFloat(n) || 0).toFixed(2)}`;
const esc = (s) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

/**
 * Genera y abre el PDF de cuentas.
 * @param {object} opts
 *   - periodo: string (ej. "Mayo 2026" o "General (todo)")
 *   - sales, investments, pendingSales, pagosAccionista: arrays
 *   - totals: { ventas, gastos, ganancia }
 */
export function exportCuentasPDF({ periodo, sales = [], investments = [], pendingSales = [], pagosAccionista = [], totals = {} }) {
  const now = new Date();
  const fechaGen = now.toLocaleString('es-PE');

  const totalVentas  = totals.ventas   ?? sales.reduce((s, v) => s + (parseFloat(v.precioVenta || v.total || v.monto) || 0), 0);
  const totalGastos  = totals.gastos   ?? investments.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0);
  const ganancia     = totals.ganancia ?? (totalVentas - totalGastos);

  const filaVenta = (v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(v.fecha || v.date || '')}</td>
      <td>${esc(v.producto || v.title || v.productTitle || '—')}</td>
      <td>${esc(v.cliente || v.customer || '—')}</td>
      <td style="text-align:right">${fmt(v.precioVenta || v.total || v.monto)}</td>
    </tr>`;

  const filaGasto = (g, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(g.fecha || g.date || '')}</td>
      <td>${esc(g.concepto || g.descripcion || g.title || '—')}</td>
      <td>${esc(g.fuenteDinero || '—')}</td>
      <td style="text-align:right">${fmt(g.monto)}</td>
    </tr>`;

  const filaPendiente = (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(p.fechaEntrega || '')}</td>
      <td>${esc(p.producto || '—')}</td>
      <td>${esc(p.cliente || '—')}</td>
      <td style="text-align:right">${fmt(p.precioVenta || p.total || p.monto)}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Reporte de Cuentas - Benito Store</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#1a2744; padding:32px; }
  h1 { font-size:22px; color:#1a2744; margin-bottom:2px; }
  .sub { color:#868e96; font-size:12px; margin-bottom:20px; }
  .cards { display:flex; gap:12px; margin-bottom:24px; }
  .card { flex:1; padding:14px; border-radius:10px; text-align:center; }
  .card .lbl { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#868e96; }
  .card .val { font-size:20px; font-weight:700; margin-top:4px; }
  .c-green { background:#e6f7ed; } .c-green .val { color:#1a7c3e; }
  .c-red   { background:#fee6e6; } .c-red .val { color:#c92a2a; }
  .c-blue  { background:#e7f0ff; } .c-blue .val { color:#1971c2; }
  h2 { font-size:14px; margin:22px 0 8px; color:#1a2744; border-bottom:2px solid #f76707; padding-bottom:4px; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { background:#f1f3f5; padding:7px 8px; text-align:left; font-weight:600; }
  td { padding:6px 8px; border-bottom:1px solid #eee; }
  .tot { font-weight:700; background:#fafafa; }
  .empty { color:#adb5bd; font-style:italic; padding:10px 0; font-size:12px; }
  .foot { margin-top:30px; text-align:center; color:#adb5bd; font-size:10px; }
  @media print { body { padding:0; } @page { margin:1.5cm; } }
</style></head>
<body>
  <h1>Reporte de Cuentas — Benito Store</h1>
  <div class="sub">Periodo: ${esc(periodo || 'General')} · Generado: ${esc(fechaGen)}</div>

  <div class="cards">
    <div class="card c-green"><div class="lbl">Ventas</div><div class="val">${fmt(totalVentas)}</div></div>
    <div class="card c-red"><div class="lbl">Gastos</div><div class="val">${fmt(totalGastos)}</div></div>
    <div class="card c-blue"><div class="lbl">Ganancia</div><div class="val">${fmt(ganancia)}</div></div>
  </div>

  <h2>Ventas (${sales.length})</h2>
  ${sales.length ? `<table>
    <thead><tr><th>#</th><th>Fecha</th><th>Producto</th><th>Cliente</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>${sales.map(filaVenta).join('')}
      <tr class="tot"><td colspan="4">TOTAL VENTAS</td><td style="text-align:right">${fmt(totalVentas)}</td></tr>
    </tbody></table>` : '<div class="empty">Sin ventas registradas en este periodo.</div>'}

  <h2>Gastos / Inversiones (${investments.length})</h2>
  ${investments.length ? `<table>
    <thead><tr><th>#</th><th>Fecha</th><th>Concepto</th><th>Fuente</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>${investments.map(filaGasto).join('')}
      <tr class="tot"><td colspan="4">TOTAL GASTOS</td><td style="text-align:right">${fmt(totalGastos)}</td></tr>
    </tbody></table>` : '<div class="empty">Sin gastos registrados en este periodo.</div>'}

  ${pendingSales.length ? `<h2>Ventas Pendientes (${pendingSales.length})</h2>
  <table>
    <thead><tr><th>#</th><th>Entrega</th><th>Producto</th><th>Cliente</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>${pendingSales.map(filaPendiente).join('')}</tbody></table>` : ''}

  <div class="foot">Benito Store · Documento generado automáticamente · ${esc(fechaGen)}</div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body></html>`;

  // Abrir en ventana nueva → el navegador muestra "Guardar como PDF"
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite las ventanas emergentes para generar el PDF.');
    return false;
  }
  win.document.write(html);
  win.document.close();
  return true;
}