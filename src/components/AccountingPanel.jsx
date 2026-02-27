// src/components/AccountingPanel.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Button, TextInput, Select, Modal, ActionIcon, Badge, Card, Text,
  Textarea, SegmentedControl, Tooltip, Divider, Alert, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconEdit, IconPhoto, IconX,
  IconCash, IconReportMoney, IconReceipt, IconCalendar, IconUser,
  IconTruckDelivery, IconPackage, IconBox, IconChartBar,
  IconUsers, IconClock, IconCheck, IconAlertTriangle,
  IconBell, IconBellRinging, IconArrowRight, IconCategory,
  IconDiamond, IconWallet, IconPigMoney, IconHandGrab,
  IconCircleCheck, IconFileInvoice, IconCoins, IconScale,
  IconUserCircle, IconBriefcase, IconPercentage, IconArrowsSplit,
  IconMoneybag, IconInfoCircle, IconListDetails, IconChartDots,
  IconBuildingFactory, IconTool, IconAddressBook, IconPhone,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addSale, updateSale, deleteSale, getSales,
  addInvestment, updateInvestment, deleteInvestment, getInvestments,
  getShareholders,
  addPendingSale, updatePendingSale, deletePendingSale, getPendingSales, completePendingSale,
  addCapital, deleteCapital, getCapital,
  addFrecuentClient, deleteFrecuentClient, getFrecuentClients,
  getPagosAccionista, addPagoAccionista, deletePagoAccionista,
  generateId, imageToBase64, loadStore,
} from '../utils/store';
import { COLORS } from '../utils/theme';
import StatsPanel from './StatsPanel';

const SOCIOS_OPTIONS = [
  { value: 'Yefer', label: 'Yefer' },
  { value: 'Frank', label: 'Frank' },
  { value: 'Ambos', label: 'Ambos socios' },
];
const MEDIOS_ENTREGA = ['Contra entrega', 'Shalom', 'Envio delivery', 'Recojo en tienda'];
const CATEGORIAS_INVERSION = [
  'Insumos', 'Cajas', 'Reabastecer stock', 'Empaques',
  'Publicidad', 'Herramientas', 'Envios', 'Otros',
];
const FUENTE_DINERO_OPTIONS = [
  { value: 'Yefer', label: 'Yefer' },
  { value: 'Frank', label: 'Frank' },
  { value: 'Ambos', label: 'Ambos socios' },
  { value: 'Accionista', label: 'Dinero de accionista' },
];

/* ====== ESTILOS del SegmentedControl (fix texto negro) ====== */
const SEGMENT_STYLES = {
  root: { background: COLORS.borderLight, border: 'none' },
  indicator: { background: COLORS.navy, borderRadius: 20 },
  label: {
    fontFamily: '"Outfit", sans-serif',
    fontSize: '0.68rem',
    fontWeight: 500,
    color: COLORS.navy,
    padding: '6px 4px',
  },
  innerLabel: { color: 'inherit' },
};

/* ====== UTILIDADES ====== */
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}
function getUrgencyColor(days) {
  if (days === null) return 'gray';
  if (days < 0) return 'red';
  if (days === 0) return 'orange';
  if (days <= 2) return 'yellow';
  return 'blue';
}
function getUrgencyText(days) {
  if (days === null) return 'Sin fecha';
  if (days < 0) return `Vencida hace ${Math.abs(days)} dia(s)`;
  if (days === 0) return 'HOY';
  if (days === 1) return 'Manana';
  return `En ${days} dias`;
}

/* ====== Calcular la parte real que le toca a un socio en una venta ====== */
function getSocioAmount(item, socioName) {
  const total = parseFloat(item.precio || item.monto) || 0;
  if (item.socio === socioName) return total;
  if (item.socio === 'Ambos') {
    if (socioName === 'Yefer') return parseFloat(item.splitYefer) || 0;
    if (socioName === 'Frank') return parseFloat(item.splitFrank) || 0;
  }
  return 0;
}

/* ====== Notificaciones del navegador (gratuito) ====== */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png', tag: 'benito-reminder' });
  }
}

/* ================================================================
   COMPONENTE PRINCIPAL
   ================================================================ */
export default function AccountingPanel({ storeData, onRefresh }) {
  const [subTab, setSubTab] = useState('ventas');
  const [saleModal, setSaleModal] = useState({ open: false, sale: null });
  const [investModal, setInvestModal] = useState({ open: false, investment: null });
  const [pendingModal, setPendingModal] = useState({ open: false, pending: null });
  const [filterSocio, setFilterSocio] = useState('todos');

  // Mes actual como default
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [filterMonth, setFilterMonth] = useState('general');

  const sales = useMemo(() => getSales(), [storeData]);
  const investments = useMemo(() => getInvestments(), [storeData]);
  const shareholders = useMemo(() => getShareholders(), [storeData]);
  const pendingSales = useMemo(() => getPendingSales(), [storeData]);
  const capital = useMemo(() => getCapital(), [storeData]);
  const frecuentClients = useMemo(() => getFrecuentClients(), [storeData]);
  const pagosAccionista = useMemo(() => getPagosAccionista(), [storeData]);
  const allCategories = useMemo(() => (storeData?.categories || []).sort((a, b) => a.order - b.order), [storeData]);
  const allProducts = useMemo(() => storeData?.products || [], [storeData]);

  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    const active = pendingSales.filter(p => !p.completed);
    const dueToday = active.filter(p => getDaysUntil(p.fechaEntrega) === 0);
    const overdue = active.filter(p => getDaysUntil(p.fechaEntrega) < 0);
    if (dueToday.length > 0) sendBrowserNotification('Ventas para HOY', `Tienes ${dueToday.length} venta(s) pendiente(s) para hoy`);
    if (overdue.length > 0) sendBrowserNotification('Ventas VENCIDAS', `Tienes ${overdue.length} venta(s) vencida(s) sin completar`);
  }, [pendingSales]);

  // Helper: filtrar por mes
  const filterByMonth = (items, dateField = 'fecha') => {
    if (filterMonth === 'general') return items;
    return items.filter(item => {
      if (!item[dateField]) return false;
      const d = new Date(item[dateField]);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
    });
  };

  // Ventas filtradas (por mes + socio)
  const filteredSales = useMemo(() => {
    let filtered = filterByMonth(sales);
    if (filterSocio !== 'todos') {
      filtered = filtered.filter(s => s.socio === filterSocio || s.socio === 'Ambos');
    }
    return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [sales, filterSocio, filterMonth]);

  // Inversiones filtradas por mes
  const filteredInvestments = useMemo(() => filterByMonth(investments), [investments, filterMonth]);

  // Totales del mes (o general)
  const totalVentas = filteredSales.reduce((sum, s) => sum + (parseFloat(s.precio) || 0), 0);
  const totalInversiones = filteredInvestments.reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
  const totalCostosVentas = filteredSales.reduce((sum, s) => sum + (parseFloat(s.costosAgregados) || 0), 0);
  const ganancia = totalVentas - totalInversiones - totalCostosVentas;

  // Totales por socio (con splits) - del mes
  const ventasPorSocio = useMemo(() => {
    const map = {};
    ['Yefer', 'Frank'].forEach(s => { map[s] = { totalVentas: 0, countVentas: 0, totalInversion: 0, countInversion: 0 }; });
    filteredSales.forEach(s => {
      ['Yefer', 'Frank'].forEach(socio => {
        const amt = getSocioAmount(s, socio);
        if (amt > 0) { map[socio].totalVentas += amt; map[socio].countVentas += 1; }
      });
    });
    filteredInvestments.forEach(inv => {
      ['Yefer', 'Frank'].forEach(socio => {
        const amt = getSocioAmount({ ...inv, precio: inv.monto, socio: inv.fuenteDinero || inv.socio }, socio);
        if (amt > 0) { map[socio].totalInversion += amt; map[socio].countInversion += 1; }
      });
    });
    return map;
  }, [filteredSales, filteredInvestments]);

  // Meses disponibles (de ventas + inversiones)
  const availableMonths = useMemo(() => {
    const months = new Set();
    sales.forEach(s => { if (s.fecha) { const d = new Date(s.fecha); months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); } });
    investments.forEach(i => { if (i.fecha) { const d = new Date(i.fecha); months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); } });
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Array.from(months).sort().reverse().map(m => {
      const [y, mo] = m.split('-');
      return { value: m, label: `${names[parseInt(mo) - 1]} ${y}` };
    });
  }, [sales, investments]);

  // Mes actual label
  const currentMonthLabel = useMemo(() => {
    if (filterMonth === 'general') return 'General (todo)';
    const found = availableMonths.find(m => m.value === filterMonth);
    return found ? found.label : filterMonth;
  }, [filterMonth, availableMonths]);

  const activePending = pendingSales.filter(p => !p.completed);
  const overduePending = activePending.filter(p => getDaysUntil(p.fechaEntrega) < 0);
  const todayPending = activePending.filter(p => getDaysUntil(p.fechaEntrega) === 0);

  // Fondo accionista: total aportado - usado (inversiones + costos de ventas pagados con dinero del accionista)
  const totalAccionistas = shareholders.reduce((sum, sh) => sum + (parseFloat(sh.monto) || 0), 0);
  const invFromAccionista = investments.filter(i => i.fuenteDinero === 'Accionista').reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
  const costosFromAccionista = sales.filter(s => s.fuenteCostos === 'Accionista').reduce((sum, s) => sum + (parseFloat(s.costosAgregados) || 0), 0);
  const totalUsadoAccionista = invFromAccionista + costosFromAccionista;
  const fondoDisponible = totalAccionistas - totalUsadoAccionista;

  return (
    <div>
      {/* ALERTAS */}
      {overduePending.length > 0 && (
        <Alert icon={<IconAlertTriangle size={18} />} color="red" variant="light" radius="md" mb={8}
          title={`${overduePending.length} venta(s) VENCIDA(S)`}
          styles={{ title: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 } }}>
          <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem' }}>
            {overduePending.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                <span>{p.cliente} - {p.producto}</span>
                <Badge size="xs" color="red" variant="filled" radius="xl">{getUrgencyText(getDaysUntil(p.fechaEntrega))}</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}
      {todayPending.length > 0 && (
        <Alert icon={<IconBellRinging size={18} />} color="orange" variant="light" radius="md" mb={8}
          title={`${todayPending.length} venta(s) para HOY`}
          styles={{ title: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 } }}>
          <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem' }}>
            {todayPending.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                <span>{p.cliente} - {p.producto}</span>
                <Badge size="xs" color="orange" variant="filled" radius="xl">HOY</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* SELECTOR DE MES */}
      <Card padding="xs" radius="md" mb={8} style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconCalendar size={16} color={COLORS.navy} />
          <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy, flex: 1 }}>
            Periodo: {currentMonthLabel}
          </Text>
          <Select size="xs" value={filterMonth} placeholder="Mes"
            onChange={(v) => setFilterMonth(v || 'general')}
            data={[
              { value: 'general', label: 'General (todo)' },
              ...availableMonths,
            ]}
            radius="md" style={{ width: 140 }}
            styles={{ input: { fontSize: '0.7rem' } }} />
        </div>
      </Card>

      {/* RESUMEN FINANCIERO DEL MES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
        <SummaryCard icon={IconCash} label="Ventas" value={totalVentas} color="#2d8a2d" bg="#e6f9e6" border="#b8e6b8" />
        <SummaryCard icon={IconReportMoney} label="Gastos" value={totalInversiones + totalCostosVentas} color="#c92a2a" bg="#fee6e6" border="#e6b8b8" />
        <SummaryCard icon={IconScale} label="Ganancia" value={ganancia}
          color={ganancia >= 0 ? '#2c4a80' : '#e8590c'}
          bg={ganancia >= 0 ? '#e6f0ff' : '#fff0e6'}
          border={ganancia >= 0 ? '#b8d4e6' : '#e6c8b8'} />
      </div>

      {/* Fondo accionista */}
      {totalAccionistas > 0 && (
        <Card padding="xs" radius="md" mb={8} style={{ background: '#f0f4ff', border: '1px solid #dde4f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconPigMoney size={16} color="#2c4a80" />
              <Text size="xs" style={{ fontFamily: '"Outfit", sans-serif', color: '#2c4a80' }}>
                Fondo accionista: <strong>S/.{totalAccionistas.toFixed(2)}</strong>
              </Text>
            </div>
            <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem' }}>
              Usado: S/.{totalUsadoAccionista.toFixed(2)} | Disponible: <strong style={{ color: fondoDisponible >= 0 ? '#2d8a2d' : '#c92a2a' }}>S/.{fondoDisponible.toFixed(2)}</strong>
            </Text>
          </div>
        </Card>
      )}

      {/* SUB-TABS - CORREGIDO: texto blanco en seleccionado */}
      <div style={{ marginBottom: 14 }}>
        <SegmentedControl value={subTab} onChange={setSubTab} fullWidth size="xs" radius="xl"
          data={[
            { value: 'ventas', label: 'Ventas' },
            { value: 'inversiones', label: 'Gastos' },
            { value: 'pendientes', label: 'Pendientes' },
            { value: 'socios', label: 'Socios' },
            { value: 'accionistas', label: 'Accionistas' },
            { value: 'stats', label: 'Estadisticas' },
          ]}
          styles={{
            root: { background: COLORS.borderLight, border: 'none' },
            indicator: { background: COLORS.navy, borderRadius: 20, boxShadow: '0 2px 8px rgba(26,39,68,0.25)' },
            label: {
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.62rem',
              fontWeight: 600,
              padding: '7px 4px',
              color: COLORS.navy,
              transition: 'color 0.2s ease',
            },
          }}
        />
      </div>

      {subTab === 'ventas' && (
        <VentasSection sales={filteredSales}
          filterSocio={filterSocio} setFilterSocio={setFilterSocio}
          onAdd={() => setSaleModal({ open: true, sale: null })}
          onEdit={(sale) => setSaleModal({ open: true, sale })}
          onDelete={(id) => { deleteSale(id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Venta eliminada', color: 'red' }); }}
        />
      )}
      {subTab === 'inversiones' && (
        <InversionesSection investments={filteredInvestments}
          onAdd={() => setInvestModal({ open: true, investment: null })}
          onEdit={(inv) => setInvestModal({ open: true, investment: inv })}
          onDelete={(id) => { deleteInvestment(id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Gasto eliminado', color: 'red' }); }}
        />
      )}
      {subTab === 'pendientes' && (
        <PendientesSection pendingSales={pendingSales}
          frecuentClients={frecuentClients} onRefresh={onRefresh}
          onAdd={() => setPendingModal({ open: true, pending: null })}
          onEdit={(p) => setPendingModal({ open: true, pending: p })}
          onDelete={(id) => { deletePendingSale(id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Pendiente eliminado', color: 'red' }); }}
          onComplete={(id) => { completePendingSale(id); onRefresh(); notifications.show({ title: 'Completada', message: 'Venta completada', color: 'green' }); }}
        />
      )}
      {subTab === 'socios' && <SociosSection ventasPorSocio={ventasPorSocio} sales={filteredSales} investments={filteredInvestments} />}
      {subTab === 'accionistas' && (
        <AccionistasSection sales={sales} investments={investments} capital={capital}
          pagosAccionista={pagosAccionista} onRefresh={onRefresh} />
      )}
      {subTab === 'stats' && <StatsPanel sales={sales} investments={investments} />}

      {/* MODALES */}
      <SaleFormModal open={saleModal.open} sale={saleModal.sale} categories={allCategories} products={allProducts}
        onClose={() => setSaleModal({ open: false, sale: null })}
        onSave={() => { onRefresh(); setSaleModal({ open: false, sale: null }); }} />
      <InvestmentFormModal open={investModal.open} investment={investModal.investment}
        totalAccionistas={totalAccionistas} totalUsadoAccionista={totalUsadoAccionista}
        onClose={() => setInvestModal({ open: false, investment: null })}
        onSave={() => { onRefresh(); setInvestModal({ open: false, investment: null }); }} />
      <PendingSaleFormModal open={pendingModal.open} pending={pendingModal.pending}
        categories={allCategories} products={allProducts}
        onClose={() => setPendingModal({ open: false, pending: null })}
        onSave={() => { onRefresh(); setPendingModal({ open: false, pending: null }); }} />
    </div>
  );
}

/* ====== SUMMARY CARD ====== */
function SummaryCard({ icon: Icon, label, value, color, bg, border }) {
  return (
    <Card padding="xs" radius="md" style={{ background: bg, border: `1px solid ${border}`, textAlign: 'center' }}>
      <Icon size={18} color={color} style={{ margin: '0 auto 2px' }} />
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem' }}>{label}</Text>
      <Text size="sm" fw={700} style={{ color, fontFamily: '"Outfit", sans-serif' }}>S/. {value.toFixed(2)}</Text>
    </Card>
  );
}

/* ====== SPLIT DISPLAY (muestra reparto entre socios) ====== */
function SplitBadges({ item }) {
  if (item.socio !== 'Ambos') return null;
  const sy = parseFloat(item.splitYefer) || 0;
  const sf = parseFloat(item.splitFrank) || 0;
  if (sy === 0 && sf === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
      <Badge size="xs" variant="light" color="blue" radius="xl" style={{ fontSize: '0.55rem', textTransform: 'none' }}>
        Y: S/.{sy.toFixed(0)}
      </Badge>
      <Badge size="xs" variant="light" color="orange" radius="xl" style={{ fontSize: '0.55rem', textTransform: 'none' }}>
        F: S/.{sf.toFixed(0)}
      </Badge>
    </div>
  );
}

/* ====== EMPTY STATE ====== */
function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <Icon size={32} color={COLORS.borderLight} style={{ margin: '0 auto 8px' }} />
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif' }}>{text}</Text>
    </div>
  );
}

/* ================================================================
   VENTAS SECTION
   ================================================================ */
function VentasSection({ sales, filterSocio, setFilterSocio, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Select size="xs" radius="xl" value={filterSocio}
          onChange={(v) => setFilterSocio(v || 'todos')}
          data={[{ value: 'todos', label: 'Todos' }, ...SOCIOS_OPTIONS]}
          style={{ flex: 1 }} clearable={false} leftSection={<IconUser size={14} />} />
      </div>
      <Button leftSection={<IconPlus size={14} />} onClick={onAdd}
        radius="xl" size="xs" style={{ background: COLORS.orange, marginBottom: 10, fontFamily: '"Outfit", sans-serif' }}>
        Registrar Venta
      </Button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {sales.map((sale) => (
            <SaleListItem key={sale.id} sale={sale} onEdit={() => onEdit(sale)} onDelete={() => onDelete(sale.id)} />
          ))}
        </AnimatePresence>
        {sales.length === 0 && <EmptyState icon={IconReceipt} text="No hay ventas registradas" />}
      </div>
    </div>
  );
}

function SaleListItem({ sale, onEdit, onDelete }) {
  const fechaStr = sale.fecha ? new Date(sale.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const socioColor = sale.socio === 'Yefer' ? 'blue' : sale.socio === 'Frank' ? 'orange' : sale.socio === 'Ambos' ? 'grape' : 'gray';
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }}>
      <Card padding="xs" radius="md" style={{ border: `1px solid ${COLORS.borderLight}`, background: COLORS.white }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sale.foto ? (
            <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              <img src={sale.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 42, height: 42, borderRadius: 8, background: COLORS.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconReceipt size={16} color={COLORS.borderLight} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>{sale.producto || 'Sin nombre'}</Text>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text size="xs" c="dimmed" style={{ fontSize: '0.62rem' }}>{fechaStr}</Text>
              {sale.socio && <Badge size="xs" variant="light" color={socioColor} radius="xl" style={{ fontSize: '0.56rem' }}>{sale.socio}</Badge>}
              {sale.medioEntrega && <Badge size="xs" variant="outline" color="gray" radius="xl" style={{ fontSize: '0.56rem' }}>{sale.medioEntrega}</Badge>}
            </div>
            <SplitBadges item={sale} />
            {(sale.costosAgregados || sale.rebaja === 'si') && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                {sale.costosAgregados && parseFloat(sale.costosAgregados) > 0 && (
                  <Badge size="xs" variant="light" color="red" radius="xl" style={{ fontSize: '0.52rem', textTransform: 'none' }}>
                    Costo: -S/.{sale.costosAgregados}{sale.fuenteCostos ? ` (${sale.fuenteCostos})` : ''}{sale.detalleCostos ? ` - ${sale.detalleCostos}` : ''}
                  </Badge>
                )}
                {sale.rebaja === 'si' && sale.montoRebaja && (
                  <Badge size="xs" variant="light" color="teal" radius="xl" style={{ fontSize: '0.52rem', textTransform: 'none' }}>
                    Rebaja: -S/.{sale.montoRebaja}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Text size="xs" fw={700} style={{ color: '#2d8a2d', fontFamily: '"Outfit", sans-serif', flexShrink: 0 }}>S/.{sale.precio || '0'}</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ActionIcon variant="light" color="blue" radius="xl" size="xs" onClick={onEdit}><IconEdit size={11} /></ActionIcon>
            <ActionIcon variant="light" color="red" radius="xl" size="xs" onClick={onDelete}><IconTrash size={11} /></ActionIcon>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ================================================================
   INVERSIONES / GASTOS SECTION
   ================================================================ */
function InversionesSection({ investments, onAdd, onEdit, onDelete }) {
  const totalPorCategoria = useMemo(() => {
    const map = {};
    investments.forEach(inv => { const c = inv.categoria || 'Otros'; map[c] = (map[c] || 0) + (parseFloat(inv.monto) || 0); });
    return map;
  }, [investments]);
  const sorted = [...investments].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      {Object.keys(totalPorCategoria).length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.entries(totalPorCategoria).map(([cat, total]) => (
            <Badge key={cat} size="sm" radius="xl" variant="light" color="red" style={{ fontFamily: '"Outfit", sans-serif', textTransform: 'none', fontSize: '0.6rem' }}>
              {cat}: S/.{total.toFixed(2)}
            </Badge>
          ))}
        </div>
      )}
      <Button leftSection={<IconPlus size={14} />} onClick={onAdd}
        radius="xl" size="xs" style={{ background: '#c92a2a', marginBottom: 10, fontFamily: '"Outfit", sans-serif' }}>
        Registrar Gasto
      </Button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {sorted.map((inv) => (
            <InvestmentListItem key={inv.id} investment={inv} onEdit={() => onEdit(inv)} onDelete={() => onDelete(inv.id)} />
          ))}
        </AnimatePresence>
        {investments.length === 0 && <EmptyState icon={IconPackage} text="No hay gastos registrados" />}
      </div>
    </div>
  );
}

function InvestmentListItem({ investment, onEdit, onDelete }) {
  const fechaStr = investment.fecha ? new Date(investment.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const iconMap = { 'Insumos': IconPackage, 'Cajas': IconBox, 'Reabastecer stock': IconPackage, 'Empaques': IconBox, 'Publicidad': IconChartBar, 'Envios': IconTruckDelivery };
  const Ic = iconMap[investment.categoria] || IconReportMoney;
  const fuente = investment.fuenteDinero || investment.socio || '';
  const fuenteColor = fuente === 'Yefer' ? 'blue' : fuente === 'Frank' ? 'orange' : fuente === 'Ambos' ? 'grape' : fuente === 'Accionista' ? 'cyan' : 'gray';

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }}>
      <Card padding="xs" radius="md" style={{ border: `1px solid ${COLORS.borderLight}`, background: COLORS.white }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#fee6e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic size={16} color="#c92a2a" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>{investment.descripcion || 'Sin descripcion'}</Text>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text size="xs" c="dimmed" style={{ fontSize: '0.62rem' }}>{fechaStr}</Text>
              {investment.categoria && <Badge size="xs" variant="light" color="red" radius="xl" style={{ fontSize: '0.55rem' }}>{investment.categoria}</Badge>}
              {fuente && <Badge size="xs" variant="dot" color={fuenteColor} radius="xl" style={{ fontSize: '0.55rem', textTransform: 'none' }}>{fuente === 'Accionista' ? 'Fondo accionista' : fuente}</Badge>}
            </div>
            {investment.fuenteDinero === 'Ambos' && (
              <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                {parseFloat(investment.splitYefer) > 0 && <Badge size="xs" variant="light" color="blue" radius="xl" style={{ fontSize: '0.53rem', textTransform: 'none' }}>Y: S/.{parseFloat(investment.splitYefer).toFixed(0)}</Badge>}
                {parseFloat(investment.splitFrank) > 0 && <Badge size="xs" variant="light" color="orange" radius="xl" style={{ fontSize: '0.53rem', textTransform: 'none' }}>F: S/.{parseFloat(investment.splitFrank).toFixed(0)}</Badge>}
              </div>
            )}
          </div>
          <Text size="xs" fw={700} style={{ color: '#c92a2a', fontFamily: '"Outfit", sans-serif', flexShrink: 0 }}>-S/.{investment.monto || '0'}</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ActionIcon variant="light" color="blue" radius="xl" size="xs" onClick={onEdit}><IconEdit size={11} /></ActionIcon>
            <ActionIcon variant="light" color="red" radius="xl" size="xs" onClick={onDelete}><IconTrash size={11} /></ActionIcon>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ================================================================
   VENTAS PENDIENTES
   ================================================================ */
function PendientesSection({ pendingSales, frecuentClients, onRefresh, onAdd, onEdit, onDelete, onComplete }) {
  const active = pendingSales.filter(p => !p.completed).sort((a, b) => {
    const da = getDaysUntil(a.fechaEntrega); const db = getDaysUntil(b.fechaEntrega);
    if (da === null) return 1; if (db === null) return -1; return da - db;
  });
  const completed = pendingSales.filter(p => p.completed).sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <IconClock size={18} color={COLORS.navy} />
        <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>Ventas Pendientes</Text>
        {active.length > 0 && <Badge size="sm" color="orange" variant="filled" radius="xl">{active.length}</Badge>}
      </div>
      <Text size="xs" c="dimmed" mb={8} style={{ fontFamily: '"Outfit", sans-serif' }}>
        Registra ventas programadas. Las alertas aparecen cuando se vencen o son para hoy.
      </Text>

      {'Notification' in window && Notification.permission !== 'granted' && (
        <Alert icon={<IconBell size={16} />} color="blue" variant="light" radius="md" mb={8}
          styles={{ message: { fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem' } }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Activa notificaciones para recordatorios</span>
            <Button size="xs" radius="xl" variant="light" color="blue" onClick={requestNotificationPermission}
              style={{ fontFamily: '"Outfit", sans-serif' }}>Activar</Button>
          </div>
        </Alert>
      )}

      <Button leftSection={<IconPlus size={14} />} onClick={onAdd}
        radius="xl" size="xs" style={{ background: COLORS.navy, marginBottom: 10, fontFamily: '"Outfit", sans-serif' }}>
        Nueva Venta Pendiente
      </Button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        <AnimatePresence>
          {active.map((p) => {
            const days = getDaysUntil(p.fechaEntrega);
            const urgency = getUrgencyColor(days);
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }}>
                <Card padding="xs" radius="md" style={{
                  border: `1.5px solid ${days !== null && days <= 0 ? (days < 0 ? '#ff6b6b' : '#ffa94d') : COLORS.borderLight}`,
                  background: days !== null && days < 0 ? '#fff5f5' : days === 0 ? '#fff9f0' : COLORS.white,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.foto ? (
                      <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: days !== null && days <= 0 ? '#fee6e6' : '#e6f0ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {days !== null && days <= 0 ? <IconAlertTriangle size={16} color="#c92a2a" /> : <IconClock size={16} color="#2c4a80" />}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={600} lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>{p.cliente}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1} style={{ fontSize: '0.62rem' }}>{p.producto} - S/.{p.precio || '0'}</Text>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                        <Badge size="xs" color={urgency} variant="filled" radius="xl" style={{ fontSize: '0.56rem' }}>{getUrgencyText(days)}</Badge>
                        {p.fechaEntrega && <Text size="xs" c="dimmed" style={{ fontSize: '0.58rem' }}>{new Date(p.fechaEntrega).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</Text>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Tooltip label="Completar"><ActionIcon variant="light" color="green" radius="xl" size="xs" onClick={() => onComplete(p.id)}><IconCheck size={11} /></ActionIcon></Tooltip>
                      <ActionIcon variant="light" color="blue" radius="xl" size="xs" onClick={() => onEdit(p)}><IconEdit size={11} /></ActionIcon>
                      <ActionIcon variant="light" color="red" radius="xl" size="xs" onClick={() => onDelete(p.id)}><IconTrash size={11} /></ActionIcon>
                    </div>
                  </div>
                  {p.nota && <Text size="xs" c="dimmed" mt={3} style={{ fontSize: '0.62rem', fontStyle: 'italic' }}>{p.nota}</Text>}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {active.length === 0 && <EmptyState icon={IconCircleCheck} text="Sin ventas pendientes" />}
      </div>

      {completed.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <IconCircleCheck size={16} color="#2d8a2d" />
            <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#2d8a2d' }}>Completadas ({completed.length})</Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {completed.slice(0, 10).map(p => (
              <Card key={p.id} padding="xs" radius="md" style={{ border: `1px solid ${COLORS.borderLight}`, background: '#f8fff8', opacity: 0.7 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <IconCircleCheck size={14} color="#2d8a2d" />
                  <Text size="xs" fw={500} style={{ fontFamily: '"Outfit", sans-serif', textDecoration: 'line-through', flex: 1 }}>{p.cliente} - {p.producto}</Text>
                  <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>S/.{p.precio}</Text>
                  <ActionIcon variant="light" color="red" radius="xl" size="xs" onClick={() => onDelete(p.id)}><IconTrash size={10} /></ActionIcon>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* CLIENTES FRECUENTES */}
      <Divider my={14} />
      <ClientesFrecuentesSection clients={frecuentClients} onRefresh={onRefresh} />
    </div>
  );
}

/* ================================================================
   CLIENTES FRECUENTES
   ================================================================ */
function ClientesFrecuentesSection({ clients, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFoto, setFormFoto] = useState('');

  const handleAddClient = () => {
    if (!formName.trim()) { notifications.show({ title: 'Error', message: 'El nombre es obligatorio', color: 'red' }); return; }
    addFrecuentClient({ id: generateId(), nombre: formName.trim(), telefono: formPhone.trim(), foto: formFoto, fecha: new Date().toISOString().split('T')[0] });
    setFormName(''); setFormPhone(''); setFormFoto(''); setShowForm(false);
    onRefresh();
    notifications.show({ title: 'Agregado', message: 'Cliente frecuente registrado', color: 'green' });
  };

  const handleFotoAdd = async (file) => {
    if (!file) return;
    try { const b64 = await imageToBase64(file); setFormFoto(b64); }
    catch { notifications.show({ title: 'Error', message: 'Error al cargar foto', color: 'red' }); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconAddressBook size={16} color={COLORS.navy} />
          <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>Clientes Frecuentes</Text>
        </div>
        <Button leftSection={<IconPlus size={12} />} onClick={() => setShowForm(!showForm)}
          radius="xl" size="xs" variant={showForm ? 'outline' : 'filled'}
          style={{ background: showForm ? 'transparent' : COLORS.orange, fontFamily: '"Outfit", sans-serif',
            color: showForm ? COLORS.orange : 'white', borderColor: COLORS.orange }} compact="true">
          {showForm ? 'Cancelar' : 'Agregar'}
        </Button>
      </div>

      {showForm && (
        <Card padding="sm" radius="md" mb={10} style={{ border: `1px solid ${COLORS.borderLight}`, background: COLORS.offWhite }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TextInput size="xs" label="Nombre" placeholder="Nombre del cliente" value={formName}
              onChange={(e) => setFormName(e.currentTarget.value)} radius="md" required
              leftSection={<IconUser size={14} />} />
            <TextInput size="xs" label="Telefono (opcional)" placeholder="999 999 999" value={formPhone}
              onChange={(e) => setFormPhone(e.currentTarget.value)} radius="md"
              leftSection={<IconPhone size={14} />} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {formFoto ? (
                <div style={{ position: 'relative' }}>
                  <img src={formFoto} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  <ActionIcon size="xs" variant="filled" color="red" radius="xl"
                    style={{ position: 'absolute', top: -4, right: -4 }}
                    onClick={() => setFormFoto('')}><IconX size={8} /></ActionIcon>
                </div>
              ) : (
                <label style={{
                  width: 48, height: 48, borderRadius: 8, background: COLORS.borderLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  border: '1.5px dashed rgba(0,0,0,0.15)',
                }}>
                  <IconPhoto size={16} color={COLORS.textMuted} />
                  <input type="file" accept="image/*" hidden onChange={(e) => handleFotoAdd(e.target.files[0])} />
                </label>
              )}
              <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>Foto (opcional)</Text>
            </div>
            <Button size="xs" radius="xl" style={{ background: COLORS.orange }} onClick={handleAddClient}>
              Guardar Cliente
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(clients || []).map(c => (
          <Card key={c.id} padding="xs" radius="md" style={{ border: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {c.foto ? (
                <img src={c.foto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconUser size={16} color="#2c4a80" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>{c.nombre}</Text>
                {c.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IconPhone size={10} color={COLORS.textMuted} />
                    <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>{c.telefono}</Text>
                  </div>
                )}
              </div>
              <ActionIcon variant="light" color="red" radius="xl" size="xs"
                onClick={() => { deleteFrecuentClient(c.id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Cliente eliminado', color: 'red' }); }}>
                <IconTrash size={10} />
              </ActionIcon>
            </div>
          </Card>
        ))}
        {(!clients || clients.length === 0) && <EmptyState icon={IconAddressBook} text="No hay clientes frecuentes" />}
      </div>
    </div>
  );
}

/* ================================================================
   SOCIOS (Yefer & Frank) - con splits correctos
   ================================================================ */
function SociosSection({ ventasPorSocio, sales, investments }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconUsers size={18} color={COLORS.navy} />
        <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>Ganancias por Socio</Text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {['Yefer', 'Frank'].map(socio => {
          const data = ventasPorSocio[socio] || { totalVentas: 0, countVentas: 0, totalInversion: 0, countInversion: 0 };
          const gananciaInd = data.totalVentas - data.totalInversion;
          const color = socio === 'Yefer' ? '#2c4a80' : COLORS.orange;
          const bg = socio === 'Yefer' ? '#e6f0ff' : '#fff4e6';

          // Ventas de este socio (directas + su parte de "Ambos")
          const socioSales = sales.filter(s => s.socio === socio || s.socio === 'Ambos').map(s => ({
            ...s,
            montoReal: getSocioAmount(s, socio),
          })).filter(s => s.montoReal > 0);

          return (
            <Card key={socio} padding="md" radius="md" style={{ border: `2px solid ${color}20`, background: bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${color}30`,
                }}>
                  <IconUserCircle size={22} color={color} />
                </div>
                <div>
                  <Text size="md" fw={700} style={{ fontFamily: '"Playfair Display", serif', color }}>{socio}</Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif' }}>Socio</Text>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <MiniStat icon={IconCash} color="#2d8a2d" label={`Ventas (${data.countVentas})`} value={data.totalVentas} />
                <MiniStat icon={IconReportMoney} color="#c92a2a" label={`Inversion (${data.countInversion})`} value={data.totalInversion} />
                <MiniStat icon={IconWallet} color={gananciaInd >= 0 ? '#2c4a80' : '#e8590c'} label="Ganancia" value={gananciaInd} />
              </div>

              <div style={{ marginTop: 10 }}>
                <Text size="xs" fw={500} c="dimmed" mb={4} style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem' }}>Ultimas ventas</Text>
                {socioSales.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>{s.producto}</Text>
                      {s.socio === 'Ambos' && <Badge size="xs" variant="light" color="grape" radius="xl" style={{ fontSize: '0.48rem', textTransform: 'none', padding: '0 4px' }}>compartida</Badge>}
                    </div>
                    <Text size="xs" fw={500} style={{ fontSize: '0.6rem', color: '#2d8a2d' }}>S/.{s.montoReal.toFixed(2)}</Text>
                  </div>
                ))}
                {socioSales.length === 0 && <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>Sin ventas</Text>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, color, label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '6px 2px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
      <Icon size={14} color={color} style={{ margin: '0 auto 2px' }} />
      <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem' }}>{label}</Text>
      <Text size="sm" fw={700} style={{ color, fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem' }}>S/.{value.toFixed(2)}</Text>
    </div>
  );
}

/* ================================================================
   ACCIONISTAS - Giovany S/.2400, 15% ganancias
   ================================================================ */
function AccionistasSection({ sales, investments, capital, pagosAccionista, onRefresh }) {
  const ACCIONISTA = { nombre: 'Giovany', monto: 2400, porcentaje: 15 };
  const [newCapital, setNewCapital] = useState('');
  const [newCapitalVal, setNewCapitalVal] = useState('');

  // Fondo: total invertido - usado en gastos/costos del accionista
  const invUsado = investments.filter(i => i.fuenteDinero === 'Accionista').reduce((s, i) => s + (parseFloat(i.monto) || 0), 0);
  const costosUsado = sales.filter(s => s.fuenteCostos === 'Accionista').reduce((s, s2) => s + (parseFloat(s2.costosAgregados) || 0), 0);
  const fondoDisponible = ACCIONISTA.monto - invUsado - costosUsado;

  // Ganancias mensuales
  const monthlyProfits = useMemo(() => {
    const map = {};
    (sales || []).forEach(s => {
      if (!s.fecha) return;
      const d = new Date(s.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { ventas: 0, gastos: 0, costos: 0 };
      map[key].ventas += parseFloat(s.precio) || 0;
      map[key].costos += parseFloat(s.costosAgregados) || 0;
    });
    (investments || []).forEach(i => {
      if (!i.fecha) return;
      const d = new Date(i.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { ventas: 0, gastos: 0, costos: 0 };
      map[key].gastos += parseFloat(i.monto) || 0;
    });
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([key, val]) => {
      const [y, m] = key.split('-');
      const ganancia = val.ventas - val.gastos - val.costos;
      const parteGiovany = ganancia > 0 ? ganancia * (ACCIONISTA.porcentaje / 100) : 0;
      const mitadCada = parteGiovany / 2;
      const pagado = (pagosAccionista || []).find(p => p.mes === key);
      return { key, label: `${names[parseInt(m) - 1]} ${y}`, ...val, ganancia, parteGiovany, mitadCada, pagado };
    });
  }, [sales, investments, pagosAccionista]);

  const totalAcumulado = monthlyProfits.reduce((s, m) => s + m.parteGiovany, 0);
  const totalPagado = (pagosAccionista || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const totalPendiente = totalAcumulado - totalPagado;

  const handlePagar = (m) => {
    addPagoAccionista({
      id: generateId(),
      mes: m.key,
      mesLabel: m.label,
      monto: m.parteGiovany,
      mitadYefer: m.mitadCada,
      mitadFrank: m.mitadCada,
      fecha: new Date().toISOString().split('T')[0],
    });
    onRefresh();
    notifications.show({ title: 'Pagado', message: `${ACCIONISTA.nombre} - ${m.label}: S/.${m.parteGiovany.toFixed(2)}`, color: 'green' });
  };

  const handleEliminarPago = (pagoId) => {
    deletePagoAccionista(pagoId);
    onRefresh();
    notifications.show({ title: 'Eliminado', message: 'Pago eliminado', color: 'red' });
  };

  const handleAddCapital = () => {
    if (!newCapital.trim()) return;
    addCapital({ id: generateId(), nombre: newCapital.trim(), valor: newCapitalVal || '0', fecha: new Date().toISOString().split('T')[0] });
    setNewCapital(''); setNewCapitalVal('');
    onRefresh();
    notifications.show({ title: 'Agregado', message: 'Capital registrado', color: 'green' });
  };

  return (
    <div>
      {/* INFO GIOVANY */}
      <Card padding="sm" radius="md" mb={10} style={{ background: 'linear-gradient(135deg, #e6f0ff, #f0f4ff)', border: '1px solid #dde4f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2c4a80', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #c8daf0' }}>
            <IconUser size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <Text size="md" fw={700} style={{ fontFamily: '"Playfair Display", serif', color: '#2c4a80' }}>{ACCIONISTA.nombre}</Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif' }}>Accionista / Inversionista</Text>
          </div>
          <Badge size="lg" variant="filled" color="orange" radius="xl" style={{ fontSize: '0.7rem' }}>{ACCIONISTA.porcentaje}%</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <div style={{ textAlign: 'center', padding: 8, background: 'white', borderRadius: 8 }}>
            <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem' }}>Invirtio</Text>
            <Text size="sm" fw={700} style={{ color: '#2c4a80' }}>S/.{ACCIONISTA.monto}</Text>
          </div>
          <div style={{ textAlign: 'center', padding: 8, background: 'white', borderRadius: 8 }}>
            <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem' }}>Fondo usado</Text>
            <Text size="sm" fw={700} style={{ color: '#c92a2a' }}>S/.{(invUsado + costosUsado).toFixed(2)}</Text>
          </div>
          <div style={{ textAlign: 'center', padding: 8, background: 'white', borderRadius: 8 }}>
            <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem' }}>Fondo disponible</Text>
            <Text size="sm" fw={700} style={{ color: fondoDisponible >= 0 ? '#2d8a2d' : '#c92a2a' }}>S/.{fondoDisponible.toFixed(2)}</Text>
          </div>
        </div>
      </Card>

      {/* RESUMEN DE PAGOS */}
      <Card padding="xs" radius="md" mb={10} style={{ background: '#f8fff8', border: '1px solid #d0e8d0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>Total ganado</Text>
            <Text size="sm" fw={700} style={{ color: '#2d8a2d' }}>S/.{totalAcumulado.toFixed(2)}</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>Pagado</Text>
            <Text size="sm" fw={700} style={{ color: '#2c4a80' }}>S/.{totalPagado.toFixed(2)}</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>Pendiente</Text>
            <Text size="sm" fw={700} style={{ color: totalPendiente > 0 ? '#e8590c' : '#2d8a2d' }}>S/.{totalPendiente.toFixed(2)}</Text>
          </div>
        </div>
      </Card>

      {/* GANANCIAS MENSUALES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <IconPercentage size={16} color={COLORS.navy} />
        <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>
          Ganancias mensuales ({ACCIONISTA.porcentaje}%)
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {monthlyProfits.map(m => (
          <Card key={m.key} padding="sm" radius="md" style={{
            border: `1px solid ${m.pagado ? '#b8e6b8' : m.ganancia > 0 ? '#e6d8b8' : '#e0e0e0'}`,
            background: m.pagado ? '#f0fff0' : 'white',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text size="sm" fw={700} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>{m.label}</Text>
              {m.pagado ? (
                <Badge size="xs" variant="filled" color="green" radius="xl">PAGADO</Badge>
              ) : m.ganancia > 0 ? (
                <Badge size="xs" variant="filled" color="orange" radius="xl">PENDIENTE</Badge>
              ) : (
                <Badge size="xs" variant="light" color="gray" radius="xl">Sin ganancia</Badge>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 6 }}>
              <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>Ventas: <strong>S/.{m.ventas.toFixed(0)}</strong></Text>
              <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>Gastos: <strong>S/.{m.gastos.toFixed(0)}</strong></Text>
              <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>Costos: <strong>S/.{m.costos.toFixed(0)}</strong></Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#f8f9fa', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>Ganancia neta</Text>
                <Text size="xs" fw={700} style={{ color: m.ganancia > 0 ? '#2d8a2d' : '#c92a2a' }}>S/.{m.ganancia.toFixed(2)}</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>{ACCIONISTA.porcentaje}% → {ACCIONISTA.nombre}</Text>
                <Text size="sm" fw={700} style={{ color: m.parteGiovany > 0 ? '#e8590c' : '#999' }}>S/.{m.parteGiovany.toFixed(2)}</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text size="xs" c="dimmed" style={{ fontSize: '0.55rem' }}>Cada socio paga</Text>
                <Text size="xs" fw={600} style={{ color: '#2c4a80' }}>S/.{m.mitadCada.toFixed(2)}</Text>
              </div>
            </div>

            {/* Botones de accion */}
            {m.parteGiovany > 0 && !m.pagado && (
              <Button fullWidth size="xs" radius="xl" leftSection={<IconCash size={14} />}
                style={{ background: '#2d8a2d', fontFamily: '"Outfit", sans-serif' }}
                onClick={() => handlePagar(m)}>
                Pagar {ACCIONISTA.porcentaje}% → S/.{m.parteGiovany.toFixed(2)} (Yefer: S/.{m.mitadCada.toFixed(2)} + Frank: S/.{m.mitadCada.toFixed(2)})
              </Button>
            )}
            {m.pagado && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="xs" c="dimmed" style={{ fontSize: '0.58rem', fontStyle: 'italic' }}>
                  Pagado el {m.pagado.fecha} — Yefer: -S/.{m.pagado.mitadYefer?.toFixed(2)} / Frank: -S/.{m.pagado.mitadFrank?.toFixed(2)}
                </Text>
                <ActionIcon variant="light" color="red" radius="xl" size="xs"
                  onClick={() => handleEliminarPago(m.pagado.id)}>
                  <IconTrash size={11} />
                </ActionIcon>
              </div>
            )}
          </Card>
        ))}
        {monthlyProfits.length === 0 && <EmptyState icon={IconPercentage} text="No hay datos de meses aun" />}
      </div>

      {/* CAPITAL / ACTIVOS */}
      <Divider my={14} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <IconTool size={16} color={COLORS.navy} />
        <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>Capital (Herramientas y Maquinas)</Text>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <TextInput size="xs" placeholder="Ej: Grabadora laser" value={newCapital}
          onChange={(e) => setNewCapital(e.currentTarget.value)} radius="md" style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddCapital(); }} />
        <TextInput size="xs" placeholder="Valor S/." value={newCapitalVal}
          onChange={(e) => setNewCapitalVal(e.currentTarget.value)} radius="md" style={{ width: 90 }} />
        <Button size="xs" radius="md" style={{ background: COLORS.navy }} onClick={handleAddCapital}>+</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(capital || []).map(c => (
          <Card key={c.id} padding="xs" radius="md" style={{ border: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconBuildingFactory size={14} color="#7c3aed" />
              </div>
              <div style={{ flex: 1 }}>
                <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>{c.nombre}</Text>
                <Text size="xs" c="dimmed" style={{ fontSize: '0.58rem' }}>{c.fecha}</Text>
              </div>
              {c.valor && c.valor !== '0' && <Text size="xs" fw={600} style={{ color: '#7c3aed' }}>S/.{c.valor}</Text>}
              <ActionIcon variant="light" color="red" radius="xl" size="xs"
                onClick={() => { deleteCapital(c.id); onRefresh(); }}><IconTrash size={10} /></ActionIcon>
            </div>
          </Card>
        ))}
        {(!capital || capital.length === 0) && <EmptyState icon={IconTool} text="No hay capital registrado" />}
      </div>
    </div>
  );
}

/* ================================================================
   MODAL: REGISTRAR VENTA
   - Selector Categoria → Producto (auto-llena foto y precio)
   - Socio: Yefer / Frank / Ambos (con split)
   ================================================================ */
function SaleFormModal({ open, sale, categories, products, onClose, onSave }) {
  const [form, setForm] = useState({
    producto: '', fecha: '', precio: '', foto: '', socio: '', medioEntrega: 'Contra entrega',
    categoryId: '', productId: '', splitYefer: '', splitFrank: '',
  });

  React.useEffect(() => {
    if (sale) {
      setForm({
        producto: sale.producto || '', fecha: sale.fecha || '', precio: sale.precio || '',
        foto: sale.foto || '', socio: sale.socio || '', medioEntrega: sale.medioEntrega || 'Contra entrega',
        categoryId: sale.categoryId || '', productId: sale.productId || '',
        splitYefer: sale.splitYefer || '', splitFrank: sale.splitFrank || '',
        costosAgregados: sale.costosAgregados || '', detalleCostos: sale.detalleCostos || '',
        fuenteCostos: sale.fuenteCostos || '',
        rebaja: sale.rebaja || '', montoRebaja: sale.montoRebaja || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm({ producto: '', fecha: today, precio: '', foto: '', socio: '', medioEntrega: 'Contra entrega', categoryId: '', productId: '', splitYefer: '', splitFrank: '', costosAgregados: '', detalleCostos: '', fuenteCostos: '', rebaja: '', montoRebaja: '' });
    }
  }, [sale, open]);

  const filteredProducts = useMemo(() => {
    if (!form.categoryId) return [];
    return products.filter(p => p.categoryId === form.categoryId);
  }, [form.categoryId, products]);

  const handleProductSelect = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setForm(p => ({ ...p, productId, producto: prod.title || '', precio: prod.price || '', foto: prod.images?.[0] || '' }));
    } else {
      setForm(p => ({ ...p, productId: '', producto: '', precio: '', foto: '' }));
    }
  };

  // Auto-dividir mitad cuando seleccionan "Ambos"
  const handleSocioChange = (v) => {
    setForm(p => {
      const newForm = { ...p, socio: v || '' };
      if (v === 'Ambos' && p.precio) {
        const half = (parseFloat(p.precio) / 2).toFixed(2);
        newForm.splitYefer = half;
        newForm.splitFrank = half;
      } else {
        newForm.splitYefer = '';
        newForm.splitFrank = '';
      }
      return newForm;
    });
  };

  const handleSubmit = () => {
    if (!form.producto.trim()) { notifications.show({ title: 'Error', message: 'Selecciona un producto', color: 'red' }); return; }
    if (!form.precio) { notifications.show({ title: 'Error', message: 'El precio es obligatorio', color: 'red' }); return; }
    if (form.socio === 'Ambos') {
      const sy = parseFloat(form.splitYefer) || 0;
      const sf = parseFloat(form.splitFrank) || 0;
      const total = parseFloat(form.precio) || 0;
      if (Math.abs((sy + sf) - total) > 0.5) {
        notifications.show({ title: 'Error', message: `La suma de partes (S/.${(sy + sf).toFixed(2)}) no coincide con el total (S/.${total.toFixed(2)})`, color: 'red' });
        return;
      }
    }
    if (sale) {
      updateSale(sale.id, form);
      notifications.show({ title: 'Actualizado', message: 'Venta actualizada', color: 'green' });
    } else {
      addSale({ id: generateId(), ...form });
      notifications.show({ title: 'Registrado', message: 'Venta registrada', color: 'green' });
    }
    onSave();
  };

  return (
    <Modal opened={open} onClose={onClose} title={sale ? 'Editar Venta' : 'Registrar Venta'}
      centered size="md" radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        <Select label="1. Categoria" placeholder="Seleccionar..."
          value={form.categoryId}
          onChange={(v) => setForm(p => ({ ...p, categoryId: v || '', productId: '', producto: '', precio: '', foto: '' }))}
          data={categories.map(c => ({ value: c.id, label: c.name }))}
          radius="md" clearable searchable leftSection={<IconCategory size={16} />} />

        {form.categoryId && (
          <Select label="2. Producto" placeholder={filteredProducts.length === 0 ? 'Sin productos' : 'Seleccionar...'}
            value={form.productId} onChange={handleProductSelect}
            data={filteredProducts.map(p => ({ value: p.id, label: `${p.title} - S/.${p.price || '0'}` }))}
            radius="md" clearable searchable leftSection={<IconDiamond size={16} />}
            disabled={filteredProducts.length === 0} />
        )}

        {/* Preview producto */}
        {form.producto && (
          <Card padding="sm" radius="md" style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {form.foto ? (
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={form.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: COLORS.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconPhoto size={18} color={COLORS.textMuted} />
                </div>
              )}
              <div>
                <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>{form.producto}</Text>
                <Text size="sm" fw={700} style={{ color: COLORS.orange }}>S/. {form.precio}</Text>
              </div>
            </div>
          </Card>
        )}

        <TextInput label="Precio de venta (S/.)" placeholder="0.00" value={form.precio}
          onChange={(e) => {
            const newPrice = e.currentTarget.value;
            setForm(p => {
              const updated = { ...p, precio: newPrice };
              if (p.socio === 'Ambos' && newPrice) {
                const half = (parseFloat(newPrice) / 2).toFixed(2);
                updated.splitYefer = half;
                updated.splitFrank = half;
              }
              return updated;
            });
          }}
          radius="md" leftSection={<IconCash size={16} />} />

        <TextInput label="Fecha" type="date" value={form.fecha}
          onChange={(e) => setForm(p => ({ ...p, fecha: e.currentTarget.value }))} radius="md" leftSection={<IconCalendar size={16} />} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Select label="Socio / Vendedor" placeholder="Seleccionar" value={form.socio}
            onChange={handleSocioChange}
            data={SOCIOS_OPTIONS} radius="md" clearable leftSection={<IconUser size={16} />} />
          <Select label="Medio de Entrega" value={form.medioEntrega}
            onChange={(v) => setForm(p => ({ ...p, medioEntrega: v || '' }))}
            data={MEDIOS_ENTREGA.map(m => ({ value: m, label: m }))}
            radius="md" clearable leftSection={<IconTruckDelivery size={16} />} />
        </div>

        {/* SPLIT entre socios */}
        {form.socio === 'Ambos' && (
          <Card padding="sm" radius="md" style={{ background: '#f8f0ff', border: '1px solid #e8d8f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IconArrowsSplit size={16} color="#7c3aed" />
              <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#7c3aed' }}>Reparto de ganancia</Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <TextInput size="xs" label="Parte de Yefer (S/.)" placeholder="0.00"
                value={form.splitYefer}
                onChange={(e) => setForm(p => ({ ...p, splitYefer: e.currentTarget.value }))}
                radius="md" leftSection={<IconUser size={14} />}
                styles={{ label: { fontSize: '0.7rem', color: '#2c4a80' } }} />
              <TextInput size="xs" label="Parte de Frank (S/.)" placeholder="0.00"
                value={form.splitFrank}
                onChange={(e) => setForm(p => ({ ...p, splitFrank: e.currentTarget.value }))}
                radius="md" leftSection={<IconUser size={14} />}
                styles={{ label: { fontSize: '0.7rem', color: COLORS.orange } }} />
            </div>
            {form.precio && (
              <Text size="xs" c="dimmed" mt={4} ta="center" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem' }}>
                Total: S/.{form.precio} | Suma: S/.{((parseFloat(form.splitYefer) || 0) + (parseFloat(form.splitFrank) || 0)).toFixed(2)}
              </Text>
            )}
          </Card>
        )}

        {/* COSTOS AGREGADOS */}
        <Card padding="sm" radius="md" style={{ background: '#fff8f0', border: '1px solid #f0e0cc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <IconCoins size={16} color="#e8590c" />
            <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#e8590c' }}>Costos agregados (opcional)</Text>
          </div>
          <Text size="xs" c="dimmed" mb={6} style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem' }}>
            Pasajes, empaque, caja, etc. Se resta de la ganancia.
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <TextInput size="xs" label="Monto (S/.)" placeholder="0.00"
              value={form.costosAgregados}
              onChange={(e) => setForm(p => ({ ...p, costosAgregados: e.currentTarget.value }))}
              radius="md" leftSection={<IconCoins size={14} />}
              styles={{ label: { fontSize: '0.7rem' } }} />
            <TextInput size="xs" label="Detalle" placeholder="Ej: Pasaje + caja"
              value={form.detalleCostos}
              onChange={(e) => setForm(p => ({ ...p, detalleCostos: e.currentTarget.value }))}
              radius="md"
              styles={{ label: { fontSize: '0.7rem' } }} />
          </div>
          {form.costosAgregados && parseFloat(form.costosAgregados) > 0 && (
            <Select size="xs" label="Quien paga este costo?" placeholder="Seleccionar..."
              value={form.fuenteCostos}
              onChange={(v) => setForm(p => ({ ...p, fuenteCostos: v || '' }))}
              data={[
                { value: 'Yefer', label: 'Yefer' },
                { value: 'Frank', label: 'Frank' },
                { value: 'Accionista', label: 'Dinero del accionista' },
              ]}
              radius="md" clearable leftSection={<IconWallet size={14} />}
              styles={{ label: { fontSize: '0.7rem' } }} />
          )}
        </Card>

        {/* REBAJA */}
        <Card padding="sm" radius="md" style={{ background: '#f0fff4', border: '1px solid #c8e6d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <IconPercentage size={16} color="#2d8a2d" />
            <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#2d8a2d' }}>Rebaja aplicada (opcional)</Text>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select size="xs" label="Hubo rebaja?" value={form.rebaja}
              onChange={(v) => setForm(p => ({ ...p, rebaja: v || '', montoRebaja: v === 'no' ? '' : p.montoRebaja }))}
              data={[{ value: 'si', label: 'Si' }, { value: 'no', label: 'No' }]}
              radius="md" clearable
              styles={{ label: { fontSize: '0.7rem' } }} />
            {form.rebaja === 'si' && (
              <TextInput size="xs" label="Monto rebajado (S/.)" placeholder="0.00"
                value={form.montoRebaja}
                onChange={(e) => setForm(p => ({ ...p, montoRebaja: e.currentTarget.value }))}
                radius="md" leftSection={<IconPercentage size={14} />}
                styles={{ label: { fontSize: '0.7rem' } }} />
            )}
          </div>
          {form.rebaja === 'si' && form.montoRebaja && form.precio && (
            <Text size="xs" c="dimmed" mt={4} style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem' }}>
              Precio original era S/.{(parseFloat(form.precio) + parseFloat(form.montoRebaja || 0)).toFixed(2)}, se rebajo S/.{form.montoRebaja}
            </Text>
          )}
        </Card>

        <Button onClick={handleSubmit} radius="xl" mt="xs"
          style={{ background: COLORS.navy, fontFamily: '"Outfit", sans-serif' }}>
          {sale ? 'Guardar Cambios' : 'Registrar Venta'}
        </Button>
      </div>
    </Modal>
  );
}

/* ================================================================
   MODAL: REGISTRAR GASTO / INVERSION
   - Fuente del dinero: Yefer / Frank / Ambos (con split) / Accionista
   ================================================================ */
function InvestmentFormModal({ open, investment, totalAccionistas, totalUsadoAccionista, onClose, onSave }) {
  const [form, setForm] = useState({
    descripcion: '', fecha: '', monto: '', categoria: '', nota: '',
    fuenteDinero: '', splitYefer: '', splitFrank: '',
  });

  React.useEffect(() => {
    if (investment) {
      setForm({
        descripcion: investment.descripcion || '', fecha: investment.fecha || '',
        monto: investment.monto || '', categoria: investment.categoria || '',
        nota: investment.nota || '', fuenteDinero: investment.fuenteDinero || investment.socio || '',
        splitYefer: investment.splitYefer || '', splitFrank: investment.splitFrank || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm({ descripcion: '', fecha: today, monto: '', categoria: '', nota: '', fuenteDinero: '', splitYefer: '', splitFrank: '' });
    }
  }, [investment, open]);

  const handleFuenteChange = (v) => {
    setForm(p => {
      const updated = { ...p, fuenteDinero: v || '' };
      if (v === 'Ambos' && p.monto) {
        const half = (parseFloat(p.monto) / 2).toFixed(2);
        updated.splitYefer = half;
        updated.splitFrank = half;
      } else {
        updated.splitYefer = '';
        updated.splitFrank = '';
      }
      return updated;
    });
  };

  const fondoDisponible = totalAccionistas - totalUsadoAccionista;

  const handleSubmit = () => {
    if (!form.descripcion.trim()) { notifications.show({ title: 'Error', message: 'La descripcion es obligatoria', color: 'red' }); return; }
    if (!form.monto) { notifications.show({ title: 'Error', message: 'El monto es obligatorio', color: 'red' }); return; }
    if (form.fuenteDinero === 'Ambos') {
      const sy = parseFloat(form.splitYefer) || 0;
      const sf = parseFloat(form.splitFrank) || 0;
      const total = parseFloat(form.monto) || 0;
      if (Math.abs((sy + sf) - total) > 0.5) {
        notifications.show({ title: 'Error', message: `La suma de partes (S/.${(sy + sf).toFixed(2)}) no coincide con el total (S/.${total.toFixed(2)})`, color: 'red' });
        return;
      }
    }
    if (form.fuenteDinero === 'Accionista' && fondoDisponible < parseFloat(form.monto || 0)) {
      notifications.show({ title: 'Aviso', message: `Fondo accionista disponible: S/.${fondoDisponible.toFixed(2)}. Estas usando mas de lo disponible.`, color: 'yellow' });
    }
    // Guardar con socio = fuenteDinero para compatibilidad
    const saveData = { ...form, socio: form.fuenteDinero };
    if (investment) {
      updateInvestment(investment.id, saveData);
      notifications.show({ title: 'Actualizado', message: 'Gasto actualizado', color: 'green' });
    } else {
      addInvestment({ id: generateId(), ...saveData });
      notifications.show({ title: 'Registrado', message: 'Gasto registrado', color: 'green' });
    }
    onSave();
  };

  return (
    <Modal opened={open} onClose={onClose} title={investment ? 'Editar Gasto' : 'Registrar Gasto'}
      centered size="md" radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TextInput label="Descripcion" placeholder="Ej: Compra de 50 cajas" value={form.descripcion}
          onChange={(e) => setForm(p => ({ ...p, descripcion: e.currentTarget.value }))} required radius="md"
          leftSection={<IconPackage size={16} />} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <TextInput label="Fecha" type="date" value={form.fecha}
            onChange={(e) => setForm(p => ({ ...p, fecha: e.currentTarget.value }))} radius="md" leftSection={<IconCalendar size={16} />} />
          <TextInput label="Monto (S/.)" placeholder="0.00" value={form.monto}
            onChange={(e) => {
              const newMonto = e.currentTarget.value;
              setForm(p => {
                const updated = { ...p, monto: newMonto };
                if (p.fuenteDinero === 'Ambos' && newMonto) {
                  const half = (parseFloat(newMonto) / 2).toFixed(2);
                  updated.splitYefer = half;
                  updated.splitFrank = half;
                }
                return updated;
              });
            }}
            required radius="md" leftSection={<IconCash size={16} />} />
        </div>

        <Select label="Categoria de gasto" placeholder="Seleccionar" value={form.categoria}
          onChange={(v) => setForm(p => ({ ...p, categoria: v || '' }))}
          data={CATEGORIAS_INVERSION.map(c => ({ value: c, label: c }))}
          radius="md" clearable leftSection={<IconBox size={16} />} />

        {/* FUENTE DEL DINERO */}
        <Select label="De donde sale el dinero" placeholder="Quien paga" value={form.fuenteDinero}
          onChange={handleFuenteChange}
          data={FUENTE_DINERO_OPTIONS}
          radius="md" clearable leftSection={<IconMoneybag size={16} />}
          description={form.fuenteDinero === 'Accionista' ? `Fondo disponible: S/.${fondoDisponible.toFixed(2)}` : ''} />

        {/* SPLIT entre socios para gastos */}
        {form.fuenteDinero === 'Ambos' && (
          <Card padding="sm" radius="md" style={{ background: '#f8f0ff', border: '1px solid #e8d8f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IconArrowsSplit size={16} color="#7c3aed" />
              <Text size="xs" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: '#7c3aed' }}>Cuanto pone cada socio</Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <TextInput size="xs" label="Yefer pone (S/.)" placeholder="0.00"
                value={form.splitYefer}
                onChange={(e) => setForm(p => ({ ...p, splitYefer: e.currentTarget.value }))}
                radius="md" leftSection={<IconUser size={14} />}
                styles={{ label: { fontSize: '0.7rem', color: '#2c4a80' } }} />
              <TextInput size="xs" label="Frank pone (S/.)" placeholder="0.00"
                value={form.splitFrank}
                onChange={(e) => setForm(p => ({ ...p, splitFrank: e.currentTarget.value }))}
                radius="md" leftSection={<IconUser size={14} />}
                styles={{ label: { fontSize: '0.7rem', color: COLORS.orange } }} />
            </div>
            {form.monto && (
              <Text size="xs" c="dimmed" mt={4} ta="center" style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem' }}>
                Total: S/.{form.monto} | Suma: S/.{((parseFloat(form.splitYefer) || 0) + (parseFloat(form.splitFrank) || 0)).toFixed(2)}
              </Text>
            )}
          </Card>
        )}

        <Textarea label="Nota (opcional)" placeholder="Detalles extra..." value={form.nota}
          onChange={(e) => setForm(p => ({ ...p, nota: e.currentTarget.value }))} radius="md" rows={2} />
        <Button onClick={handleSubmit} radius="xl" mt="xs"
          style={{ background: '#c92a2a', fontFamily: '"Outfit", sans-serif' }}>
          {investment ? 'Guardar Cambios' : 'Registrar Gasto'}
        </Button>
      </div>
    </Modal>
  );
}

/* ================================================================
   MODAL: ACCIONISTA
   ================================================================ */
/* ================================================================
   MODAL: VENTA PENDIENTE
   ================================================================ */
function PendingSaleFormModal({ open, pending, categories, products, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente: '', producto: '', precio: '', fechaEntrega: '', nota: '',
    categoryId: '', productId: '', foto: '',
  });

  React.useEffect(() => {
    if (pending) {
      setForm({
        cliente: pending.cliente || '', producto: pending.producto || '',
        precio: pending.precio || '', fechaEntrega: pending.fechaEntrega || '',
        nota: pending.nota || '', categoryId: pending.categoryId || '',
        productId: pending.productId || '', foto: pending.foto || '',
      });
    } else {
      setForm({ cliente: '', producto: '', precio: '', fechaEntrega: '', nota: '', categoryId: '', productId: '', foto: '' });
    }
  }, [pending, open]);

  const filteredProducts = useMemo(() => {
    if (!form.categoryId) return [];
    return products.filter(p => p.categoryId === form.categoryId);
  }, [form.categoryId, products]);

  const handleProductSelect = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setForm(p => ({ ...p, productId, producto: prod.title || '', precio: prod.price || '', foto: prod.images?.[0] || '' }));
    } else {
      setForm(p => ({ ...p, productId: '', producto: '', precio: '', foto: '' }));
    }
  };

  const handleSubmit = () => {
    if (!form.cliente.trim()) { notifications.show({ title: 'Error', message: 'Nombre del cliente obligatorio', color: 'red' }); return; }
    if (!form.producto.trim()) { notifications.show({ title: 'Error', message: 'Selecciona un producto', color: 'red' }); return; }
    if (pending) {
      updatePendingSale(pending.id, form);
      notifications.show({ title: 'Actualizado', message: 'Pendiente actualizado', color: 'green' });
    } else {
      addPendingSale({ id: generateId(), ...form, completed: false });
      notifications.show({ title: 'Registrado', message: 'Venta pendiente registrada', color: 'green' });
    }
    onSave();
  };

  return (
    <Modal opened={open} onClose={onClose} title={pending ? 'Editar Pendiente' : 'Nueva Venta Pendiente'}
      centered size="md" radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TextInput label="Nombre del cliente" placeholder="Ej: Juan Perez" value={form.cliente}
          onChange={(e) => setForm(p => ({ ...p, cliente: e.currentTarget.value }))} required radius="md" leftSection={<IconUser size={16} />} />

        <Select label="Categoria" placeholder="Seleccionar"
          value={form.categoryId}
          onChange={(v) => setForm(p => ({ ...p, categoryId: v || '', productId: '', producto: '', precio: '', foto: '' }))}
          data={categories.map(c => ({ value: c.id, label: c.name }))}
          radius="md" clearable searchable leftSection={<IconCategory size={16} />} />

        {form.categoryId && (
          <Select label="Producto" placeholder={filteredProducts.length === 0 ? 'Sin productos' : 'Seleccionar...'}
            value={form.productId} onChange={handleProductSelect}
            data={filteredProducts.map(p => ({ value: p.id, label: `${p.title} - S/.${p.price || '0'}` }))}
            radius="md" clearable searchable leftSection={<IconDiamond size={16} />}
            disabled={filteredProducts.length === 0} />
        )}

        {form.producto && form.foto && (
          <Card padding="xs" radius="md" style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src={form.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <Text size="xs" fw={600}>{form.producto}</Text>
                <Text size="xs" fw={600} style={{ color: COLORS.orange }}>S/. {form.precio}</Text>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <TextInput label="Precio (S/.)" placeholder="0.00" value={form.precio}
            onChange={(e) => setForm(p => ({ ...p, precio: e.currentTarget.value }))} radius="md" leftSection={<IconCash size={16} />} />
          <TextInput label="Fecha de entrega" type="date" value={form.fechaEntrega}
            onChange={(e) => setForm(p => ({ ...p, fechaEntrega: e.currentTarget.value }))} radius="md" leftSection={<IconCalendar size={16} />} />
        </div>

        <Textarea label="Nota (opcional)" placeholder="Detalles, direccion, etc." value={form.nota}
          onChange={(e) => setForm(p => ({ ...p, nota: e.currentTarget.value }))} radius="md" rows={2} />

        <Button onClick={handleSubmit} radius="xl" mt="xs"
          style={{ background: COLORS.navy, fontFamily: '"Outfit", sans-serif' }}>
          {pending ? 'Guardar Cambios' : 'Registrar Pendiente'}
        </Button>
      </div>
    </Modal>
  );
}