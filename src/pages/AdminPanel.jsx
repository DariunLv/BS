// src/pages/AdminPanel.jsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Button, TextInput, Textarea, Select, Switch, Tabs, Modal, FileInput,
  ActionIcon, Badge, Card, Text, Group, NumberInput, SegmentedControl,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconEdit, IconEye, IconEyeOff, IconHistory, IconPhoto, IconLogout, IconCategory,
  IconDiamond, IconShoppingBag, IconCheck, IconX, IconSettings,
  IconLock, IconUpload, IconMapPin, IconTruck, IconLink, IconReportMoney,
  IconBrandWhatsapp, IconArrowUp, IconArrowDown, IconArrowsSort,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addProduct, updateProduct, deleteProduct, toggleSoldOut, toggleHidden,
  addCategory, updateCategory, deleteCategory,
  addDeliveryLocation, updateDeliveryLocation, deleteDeliveryLocation,
  updateShalomImage, updateWhatsappNumber, getWhatsappNumber,
  generateId, uploadImage, changePassword, loadStore, saveStore,
  reorderProducts, reorderCategories,
  getProductViews, getPriceHistory,
} from '../utils/store';
import { COLORS } from '../utils/theme';
import AccountingPanel from '../components/AccountingPanel';

const LOTTIE_PRESETS = [
  { value: 'https://lottie.host/06a5cb66-9cf7-405e-a96c-6b0c20036d5b/cBH3wxPQH3.lottie', label: 'Colibrí' },
  { value: 'https://lottie.host/454dfe96-d4d9-4938-96f4-db32c761f5d0/SLbWwfzsQh.lottie', label: 'Colibrís Pareja' },
  { value: 'https://lottie.host/843dc3e9-342c-4e58-94f5-ebdeabe52e61/TZVqV3VA2v.lottie', label: 'Computadora' },
  { value: 'https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie', label: 'Oferta' },
  { value: 'https://lottie.host/60f16af4-8158-4643-8208-d87861d241a9/73zzcGNGgg.lottie', label: 'Anillo' },
  { value: 'https://lottie.host/127d2e9a-3ac9-457f-a3b5-447168c1b4a0/T2ntdUWyuk.lottie', label: 'Collar' },
  { value: 'https://lottie.host/12dd8dcf-4152-449c-b7d0-bb9448664e7a/Tz7RkTie6i.lottie', label: 'Pulsera' },
  { value: 'https://lottie.host/5af05446-f723-40d6-a8cf-85262739629a/BJ4AfBpEnq.lottie', label: 'Tienda' },
  { value: '', label: 'Ninguno' },
];

export default function AdminPanel({ storeData, onRefresh, onLogout }) {
  const [activeTab, setActiveTab] = useState('products');
  const [storeType, setStoreType] = useState('jewelry');
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [passwordModal, setPasswordModal] = useState(false);
  const [locationModal, setLocationModal] = useState({ open: false, location: null });

  const categories = useMemo(() =>
    (storeData?.categories || []).filter(c => c.storeType === storeType).sort((a, b) => a.order - b.order),
    [storeData, storeType]
  );

  const products = useMemo(() => {
    const catIds = categories.map(c => c.id);
    return (storeData?.products || []).filter(p => catIds.includes(p.categoryId));
  }, [storeData, categories]);

  const deliveryLocations = storeData?.deliveryLocations || [];
  const shalomImage = storeData?.shalomImage || '';
  const [whatsappInput, setWhatsappInput] = useState(() => getWhatsappNumber());

  const handleSaveWhatsapp = () => {
    const clean = whatsappInput.replace(/\D/g, '');
    if (clean.length < 8) { notifications.show({ title: 'Error', message: 'Número inválido', color: 'red' }); return; }
    updateWhatsappNumber(clean);
    onRefresh();
    notifications.show({ title: 'Guardado', message: 'Número de WhatsApp actualizado', color: 'green' });
  };

  const handleShalomImageUpload = async (file) => {
    if (!file) return;
    try {
      const base64 = await uploadImage(file);
      updateShalomImage(base64);
      onRefresh();
      notifications.show({ title: 'Listo', message: 'Imagen de Shalom actualizada', color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'Error al cargar imagen', color: 'red' });
    }
  };

  const handleRemoveShalomImage = () => {
    updateShalomImage('');
    onRefresh();
    notifications.show({ title: 'Eliminada', message: 'Imagen de Shalom eliminada', color: 'orange' });
  };

  return (
    <div className="admin-panel" style={{ minHeight: '100vh' }}>
      <div style={{
        background: COLORS.navy, padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconSettings size={20} color={COLORS.orange} />
          <Text style={{ fontFamily: '"Playfair Display", serif', color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>
            Panel Administrador
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionIcon variant="subtle" color="white" onClick={() => setPasswordModal(true)}><IconLock size={18} /></ActionIcon>
          <ActionIcon variant="subtle" color="white" onClick={onLogout}><IconLogout size={18} /></ActionIcon>
        </div>
      </div>

      {activeTab !== 'accounting' && (
        <div style={{ padding: '16px 16px 0' }}>
          <SegmentedControl value={storeType} onChange={setStoreType} fullWidth
            data={[{ value: 'jewelry', label: 'Joyería' }, { value: 'general', label: 'Tienda General' }]}
            styles={{ root: { background: COLORS.borderLight }, indicator: { background: COLORS.orange },
              label: { fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', fontWeight: 500 } }}
            radius="xl"
          />
        </div>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} style={{ padding: '12px 16px' }}>
        <Tabs.List grow>
          <Tabs.Tab value="products" leftSection={<IconDiamond size={14} />} style={{ fontSize: '0.75rem' }}>Productos</Tabs.Tab>
          <Tabs.Tab value="categories" leftSection={<IconCategory size={14} />} style={{ fontSize: '0.75rem' }}>Categorías</Tabs.Tab>
          <Tabs.Tab value="delivery" leftSection={<IconMapPin size={14} />} style={{ fontSize: '0.75rem' }}>Entregas</Tabs.Tab>
          <Tabs.Tab value="accounting" leftSection={<IconReportMoney size={14} />} style={{ fontSize: '0.75rem' }}>Cuentas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="products" pt="md">
          <Button leftSection={<IconPlus size={16} />}
            onClick={() => setProductModal({ open: true, product: null })}
            radius="xl" style={{ background: COLORS.orange, marginBottom: 16, fontFamily: '"Outfit", sans-serif' }}>
            Agregar Producto
          </Button>

          {/* Productos agrupados por categoría con reordenamiento */}
          {categories.map(cat => {
            const catProducts = products
              .filter(p => p.categoryId === cat.id)
              .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
            if (catProducts.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                {/* Header de categoría */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', marginBottom: 8,
                  background: `linear-gradient(90deg, rgba(247,103,7,0.08), transparent)`,
                  borderLeft: `3px solid ${COLORS.orange}`,
                  borderRadius: '0 8px 8px 0',
                }}>
                  <IconArrowsSort size={13} color={COLORS.orange} />
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', fontWeight: 700, color: COLORS.navy }}>
                    {cat.name}
                  </span>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: COLORS.textMuted }}>
                    ({catProducts.length} producto{catProducts.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <AnimatePresence>
                  {catProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
                    >
                      {/* Botones de orden */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          disabled={idx === 0}
                          onClick={() => { reorderProducts(cat.id, idx, idx - 1); onRefresh(); }}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                            background: idx === 0 ? COLORS.borderLight : COLORS.offWhite,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: idx === 0 ? COLORS.borderLight : COLORS.navy, padding: 0,
                          }}
                        >
                          <IconArrowUp size={13} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          disabled={idx === catProducts.length - 1}
                          onClick={() => { reorderProducts(cat.id, idx, idx + 1); onRefresh(); }}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: 'none', cursor: idx === catProducts.length - 1 ? 'default' : 'pointer',
                            background: idx === catProducts.length - 1 ? COLORS.borderLight : COLORS.offWhite,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: idx === catProducts.length - 1 ? COLORS.borderLight : COLORS.navy, padding: 0,
                          }}
                        >
                          <IconArrowDown size={13} />
                        </motion.button>
                      </div>

                      {/* Número de posición */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', fontFamily: '"Outfit", sans-serif' }}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Card del producto */}
                      <div style={{ flex: 1 }}>
                        <ProductListItem product={product} categories={categories}
                          onEdit={() => setProductModal({ open: true, product })}
                          onDelete={() => { deleteProduct(product.id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Producto eliminado', color: 'red' }); }}
                          onToggleSoldOut={() => { toggleSoldOut(product.id); onRefresh(); }}
                          onToggleHidden={() => { toggleHidden(product.id); onRefresh(); }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}

          {products.length === 0 && (
            <Text ta="center" c="dimmed" py="xl" style={{ fontFamily: '"Outfit", sans-serif' }}>
              No hay productos. Agrega el primero.
            </Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="categories" pt="md">
          <Button leftSection={<IconPlus size={16} />}
            onClick={() => setCategoryModal({ open: true, category: null })}
            radius="xl" style={{ background: COLORS.orange, marginBottom: 16, fontFamily: '"Outfit", sans-serif' }}>
            Agregar Categoría
          </Button>

          {[
            { type: 'jewelry', label: 'Joyería' },
            { type: 'general', label: 'Tienda General' },
          ].map(({ type, label }) => {
            const typeCats = categories
              .filter(c => c.storeType === type)
              .sort((a, b) => a.order - b.order);
            if (typeCats.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 20 }}>
                {/* Header de grupo */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', marginBottom: 8,
                  background: `linear-gradient(90deg, rgba(26,39,68,0.07), transparent)`,
                  borderLeft: `3px solid ${COLORS.navy}`,
                  borderRadius: '0 8px 8px 0',
                }}>
                  <IconArrowsSort size={13} color={COLORS.navy} />
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', fontWeight: 700, color: COLORS.navy }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: COLORS.textMuted }}>
                    ({typeCats.length} categoría{typeCats.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <AnimatePresence>
                  {typeCats.map((cat, idx) => (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
                    >
                      {/* Botones ↑↓ */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          disabled={idx === 0}
                          onClick={() => { reorderCategories(type, idx, idx - 1); onRefresh(); }}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: 'none',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            background: idx === 0 ? COLORS.borderLight : COLORS.offWhite,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: idx === 0 ? COLORS.borderLight : COLORS.navy, padding: 0,
                          }}
                        >
                          <IconArrowUp size={13} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          disabled={idx === typeCats.length - 1}
                          onClick={() => { reorderCategories(type, idx, idx + 1); onRefresh(); }}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: 'none',
                            cursor: idx === typeCats.length - 1 ? 'default' : 'pointer',
                            background: idx === typeCats.length - 1 ? COLORS.borderLight : COLORS.offWhite,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: idx === typeCats.length - 1 ? COLORS.borderLight : COLORS.navy, padding: 0,
                          }}
                        >
                          <IconArrowDown size={13} />
                        </motion.button>
                      </div>

                      {/* Número de posición */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: COLORS.navy, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', fontFamily: '"Outfit", sans-serif' }}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Card de categoría */}
                      <div style={{ flex: 1 }}>
                        <CategoryListItem category={cat}
                          productCount={(storeData?.products || []).filter(p => p.categoryId === cat.id).length}
                          onEdit={() => setCategoryModal({ open: true, category: cat })}
                          onDelete={() => { deleteCategory(cat.id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Categoría eliminada', color: 'red' }); }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </Tabs.Panel>

        <Tabs.Panel value="delivery" pt="md">
          <Text size="lg" fw={600} mb={4} style={{ fontFamily: '"Playfair Display", serif', color: COLORS.navy }}>
            Puntos de Entrega
          </Text>
          <Text size="sm" c="dimmed" mb={16} style={{ fontFamily: '"Outfit", sans-serif' }}>
            Administra los puntos de entrega en el mapa
          </Text>

          <Button leftSection={<IconPlus size={16} />}
            onClick={() => setLocationModal({ open: true, location: null })}
            radius="xl" style={{ background: COLORS.orange, marginBottom: 16, fontFamily: '"Outfit", sans-serif' }}>
            Agregar Punto de Entrega
          </Button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {deliveryLocations.map((loc) => (
              <Card key={loc.id} padding="sm" radius="md" style={{ border: `1px solid ${COLORS.borderLight}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconMapPin size={18} color={COLORS.orange} />
                    <div>
                      <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>{loc.name}</Text>
                      <Text size="xs" c="dimmed">Lat: {loc.lat?.toFixed(4)} | Lng: {loc.lng?.toFixed(4)}</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ActionIcon variant="light" color="blue" radius="xl" size="sm"
                      onClick={() => setLocationModal({ open: true, location: loc })}><IconEdit size={14} /></ActionIcon>
                    <ActionIcon variant="light" color="red" radius="xl" size="sm"
                      onClick={() => { deleteDeliveryLocation(loc.id); onRefresh(); notifications.show({ title: 'Eliminado', message: 'Punto eliminado', color: 'red' }); }}
                    ><IconTrash size={14} /></ActionIcon>
                  </div>
                </div>
              </Card>
            ))}
            {deliveryLocations.length === 0 && <Text ta="center" c="dimmed" py="xl">No hay puntos de entrega</Text>}
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <IconTruck size={20} color={COLORS.orange} />
              <Text size="lg" fw={600} style={{ fontFamily: '"Playfair Display", serif', color: COLORS.navy }}>Imagen de Shalom</Text>
            </div>
            <Text size="sm" c="dimmed" mb={16} style={{ fontFamily: '"Outfit", sans-serif' }}>
              Sube una imagen de Shalom para la sección de envíos
            </Text>
            {shalomImage && (
              <div style={{ position: 'relative', width: 200, marginBottom: 12 }}>
                <img src={shalomImage} alt="Shalom" style={{ width: '100%', borderRadius: 12 }} />
                <ActionIcon size="sm" variant="filled" color="red" radius="xl"
                  style={{ position: 'absolute', top: -6, right: -6 }} onClick={handleRemoveShalomImage}><IconX size={12} /></ActionIcon>
              </div>
            )}
            <FileInput accept="image/*" placeholder="Subir imagen de Shalom" leftSection={<IconUpload size={16} />}
              onChange={handleShalomImageUpload} radius="md" clearable />
          </div>

          {/* ====== WHATSAPP CONFIG ====== */}
          <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: 24, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <IconBrandWhatsapp size={20} color="#25D366" />
              <Text size="lg" fw={600} style={{ fontFamily: '"Playfair Display", serif', color: COLORS.navy }}>
                Número de WhatsApp
              </Text>
            </div>
            <Text size="sm" c="dimmed" mb={12} style={{ fontFamily: '"Outfit", sans-serif' }}>
              Este número se usa en el botón "Consultar por WhatsApp" de los productos
            </Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextInput
                placeholder="Ej: 51970824366"
                value={whatsappInput}
                onChange={(e) => { const v = e.currentTarget.value; setWhatsappInput(v); }}
                radius="md"
                style={{ flex: 1 }}
                leftSection={<IconBrandWhatsapp size={16} color="#25D366" />}
                description="Incluye el código de país (Perú = 51)"
              />
              <Button
                onClick={handleSaveWhatsapp}
                radius="md"
                style={{ background: '#25D366', alignSelf: 'flex-start', marginTop: 1 }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="accounting" pt="md">
          <AccountingPanel storeData={storeData} onRefresh={onRefresh} />
        </Tabs.Panel>
      </Tabs>

      <ProductFormModal open={productModal.open} product={productModal.product}
        categories={categories} storeType={storeType}
        allProducts={storeData?.products || []}
        onClose={() => setProductModal({ open: false, product: null })}
        onSave={() => { onRefresh(); setProductModal({ open: false, product: null }); }} />
      <CategoryFormModal open={categoryModal.open} category={categoryModal.category}
        storeType={storeType}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSave={() => { onRefresh(); setCategoryModal({ open: false, category: null }); }} />
      <LocationFormModal open={locationModal.open} location={locationModal.location}
        onClose={() => setLocationModal({ open: false, location: null })}
        onSave={() => { onRefresh(); setLocationModal({ open: false, location: null }); }} />
      <PasswordModal open={passwordModal} onClose={() => setPasswordModal(false)} />
    </div>
  );
}

/* ========= SUB-COMPONENTS ========= */

function ProductListItem({ product, categories, onEdit, onDelete, onToggleSoldOut, onToggleHidden }) {
  const cat = categories.find(c => c.id === product.categoryId);
  const [showHistory, setShowHistory] = useState(false);
  const views = getProductViews()[product.id] || 0;
  const priceHistory = getPriceHistory(product.id);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
      <Card padding="sm" radius="md" style={{ border: `1px solid ${product.hidden ? '#d0d4da' : COLORS.borderLight}`, background: product.hidden ? '#f8f9fa' : COLORS.white, opacity: product.hidden ? 0.72 : 1 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: COLORS.offWhite, flexShrink: 0, aspectRatio: '1/1' }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPhoto size={20} color={COLORS.borderLight} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text size="sm" fw={600} lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>{product.title || 'Sin título'}</Text>
              {product.soldOut && <Badge size="xs" color="red" variant="filled">Agotado</Badge>}
              {product.hidden && <Badge size="xs" color="gray" variant="filled">Oculto</Badge>}
            </div>
            <Text size="xs" c="dimmed" lineClamp={1}>{cat?.name || 'Sin categoría'}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text size="sm" fw={600} style={{ color: COLORS.orange }}>S/. {product.price || '0.00'}</Text>
              {views > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3,
                  background: '#e6f0ff', padding: '2px 7px', borderRadius: 10 }}>
                  <IconEye size={10} color="#2c4a80" />
                  <span style={{ fontSize: '0.58rem', color: '#2c4a80', fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>{views}</span>
                </div>
              )}
              {priceHistory.length > 0 && (
                <div onClick={() => setShowHistory(!showHistory)}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer',
                  background: '#fff4e6', padding: '2px 7px', borderRadius: 10 }}>
                  <IconHistory size={10} color={COLORS.orange} />
                  <span style={{ fontSize: '0.58rem', color: COLORS.orange, fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
                    {priceHistory.length} cambio{priceHistory.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {(product.tallasVaron?.length > 0 || product.tallasDama?.length > 0) && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {product.tallasVaron?.length > 0 && (
                    <Badge size="xs" radius="xl" style={{ background: '#2c4a80', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
                      V: {product.tallasVaron.length}
                    </Badge>
                  )}
                  {product.tallasDama?.length > 0 && (
                    <Badge size="xs" radius="xl" style={{ background: '#c2255c', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
                      D: {product.tallasDama.length}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ActionIcon variant="light" color="blue" radius="xl" size="sm" onClick={onEdit}><IconEdit size={14} /></ActionIcon>
            <ActionIcon variant="light" color="red" radius="xl" size="sm" onClick={onDelete}><IconTrash size={14} /></ActionIcon>
            <ActionIcon variant={product.soldOut ? 'filled' : 'light'} color="orange" radius="xl" size="sm" onClick={onToggleSoldOut}><IconCheck size={14} /></ActionIcon>
            <ActionIcon
              variant={product.hidden ? 'filled' : 'light'}
              color="gray" radius="xl" size="sm"
              onClick={onToggleHidden}
              title={product.hidden ? 'Mostrar producto' : 'Ocultar producto'}
            >
              {product.hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />}
            </ActionIcon>
          </div>
        </div>
        {/* Historial de precios expandible */}
        <AnimatePresence>
          {showHistory && priceHistory.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.borderLight}` }}>
                <Text size="xs" fw={600} mb={4} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.textMuted, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Historial de precios
                </Text>
                {priceHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '3px 0', borderBottom: i < priceHistory.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none' }}>
                    <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem' }}>{h.date}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Text size="xs" style={{ fontSize: '0.65rem', color: '#c92a2a', textDecoration: 'line-through' }}>S/.{parseFloat(h.from).toFixed(2)}</Text>
                      <span style={{ fontSize: '0.6rem', color: COLORS.textMuted }}>→</span>
                      <Text size="xs" fw={600} style={{ fontSize: '0.65rem', color: '#2d8a2d' }}>S/.{parseFloat(h.to).toFixed(2)}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function CategoryListItem({ category, productCount, onEdit, onDelete }) {
  return (
    <Card padding="sm" radius="md" style={{ border: `1px solid ${COLORS.borderLight}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {category.image ? (
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', aspectRatio: '1/1' }}>
              <img src={category.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCategory size={18} color={COLORS.borderLight} />
            </div>
          )}
          <div>
            <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>{category.name}</Text>
            <Text size="xs" c="dimmed">{productCount} productos</Text>
          </div>
          {category.lottieUrl && (
            <dotlottie-wc src={category.lottieUrl} style={{ width: '28px', height: '28px' }} autoplay loop />
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionIcon variant="light" color="blue" radius="xl" size="sm" onClick={onEdit}><IconEdit size={14} /></ActionIcon>
          <ActionIcon variant="light" color="red" radius="xl" size="sm" onClick={onDelete}><IconTrash size={14} /></ActionIcon>
        </div>
      </div>
    </Card>
  );
}

function ProductFormModal({ open, product, categories, storeType, allProducts, onClose, onSave }) {
  const EMPTY_FORM = {
    title: '', description: '', material: '', plating: '', platingType: '', tipoPiedra: '', colorPiedra: '',
    price: '', categoryId: '', images: [], soldOut: false,
    tallasVaron: [], tallasDama: [],
    contenidos: [], modelosPrecio: [],
    showWhatsapp: false,
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1); // 1=elegir categoría, 2=rellenar datos
  const [newTallaVaron, setNewTallaVaron] = useState('');
  const [newTallaDama, setNewTallaDama] = useState('');
  const [newContenidoNombre, setNewContenidoNombre] = useState('');
  const [uploadingContenidoImg, setUploadingContenidoImg] = useState(null);
  const [newModeloAnilloId, setNewModeloAnilloId] = useState('');
  const [newModeloPrecio, setNewModeloPrecio] = useState('');

  React.useEffect(() => {
    if (product) {
      const legacyTallas = product.tallas || [];
      const hasSplit = (product.tallasVaron?.length > 0) || (product.tallasDama?.length > 0);
      setForm({
        title: product.title || '', description: product.description || '',
        material: product.material || '', plating: product.plating || '',
        platingType: product.platingType || '',
        tipoPiedra: product.tipoPiedra || '',
        colorPiedra: product.colorPiedra || '',
        price: product.price || '', categoryId: product.categoryId || '',
        images: product.images || [], soldOut: product.soldOut || false,
        tallasVaron: hasSplit ? (product.tallasVaron || []) : legacyTallas,
        tallasDama: product.tallasDama || [],
        contenidos: product.contenidos || [],
        modelosPrecio: product.modelosPrecio || [],
        showWhatsapp: product.showWhatsapp || false,
      });
      setStep(2); // editando: ir directo al formulario
    } else {
      setForm(EMPTY_FORM);
      setStep(1); // nuevo: elegir categoría primero
    }
    setNewTallaVaron(''); setNewTallaDama('');
    setNewContenidoNombre(''); setNewModeloAnilloId(''); setNewModeloPrecio('');
  }, [product, open]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const handleImageAdd = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const base64 = await uploadImage(file);
      setForm(p => ({ ...p, images: [...p.images, base64] }));
    } catch { notifications.show({ title: 'Error', message: 'Error al cargar imagen', color: 'red' }); }
    finally { setUploadingImage(false); }
  };
  const removeImage = (idx) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // Tallas
  const addTallaVaron = () => { if (newTallaVaron.trim()) { setForm(p => ({ ...p, tallasVaron: [...p.tallasVaron, newTallaVaron.trim()] })); setNewTallaVaron(''); }};
  const removeTallaVaron = (idx) => setForm(p => ({ ...p, tallasVaron: p.tallasVaron.filter((_, i) => i !== idx) }));
  const addTallaDama = () => { if (newTallaDama.trim()) { setForm(p => ({ ...p, tallasDama: [...p.tallasDama, newTallaDama.trim()] })); setNewTallaDama(''); }};
  const removeTallaDama = (idx) => setForm(p => ({ ...p, tallasDama: p.tallasDama.filter((_, i) => i !== idx) }));

  // Contenidos
  const addContenido = () => { if (!newContenidoNombre.trim()) return; setForm(p => ({ ...p, contenidos: [...p.contenidos, { nombre: newContenidoNombre.trim(), imagen: null }] })); setNewContenidoNombre(''); };
  const removeContenido = (idx) => setForm(p => ({ ...p, contenidos: p.contenidos.filter((_, i) => i !== idx) }));
  const updateContenidoImagen = (idx, imagen) => setForm(p => ({ ...p, contenidos: p.contenidos.map((c, i) => i === idx ? { ...c, imagen } : c) }));

  // Modelos de precio
  const ringProducts = (allProducts || []).filter(p => p.categoryId?.includes('anillo'));
  const addModeloPrecio = () => {
    if (!newModeloAnilloId || !newModeloPrecio) return;
    const anillo = ringProducts.find(p => p.id === newModeloAnilloId);
    if (!anillo) return;
    setForm(p => ({ ...p, modelosPrecio: [...p.modelosPrecio, { anilloId: anillo.id, anilloNombre: anillo.title, precioCombo: newModeloPrecio }] }));
    setNewModeloAnilloId(''); setNewModeloPrecio('');
  };
  const removeModeloPrecio = (idx) => setForm(p => ({ ...p, modelosPrecio: p.modelosPrecio.filter((_, i) => i !== idx) }));

  const isPack = form.categoryId?.includes('pack');
  const isAnillos = form.categoryId?.includes('anillo');

  const handleSubmit = () => {
    if (!form.title.trim()) { notifications.show({ title: 'Error', message: 'El título es obligatorio', color: 'red' }); return; }
    if (!form.categoryId) { notifications.show({ title: 'Error', message: 'Selecciona una categoría', color: 'red' }); return; }
    if (product) { updateProduct(product.id, form); notifications.show({ title: 'Actualizado', message: 'Producto actualizado', color: 'green' }); }
    else { addProduct({ id: generateId(), ...form }); notifications.show({ title: 'Agregado', message: 'Producto agregado', color: 'green' }); }
    onSave();
  };

  const selectedCat = categories.find(c => c.id === form.categoryId);

  return (
    <Modal opened={open} onClose={onClose}
      title={product ? 'Editar Producto' : (step === 1 ? '¿Para qué categoría?' : `Nuevo: ${selectedCat?.name || ''}`)}
      centered size="lg" radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>

      {/* ===== PASO 1: Elegir categoría ===== */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', marginBottom: 4 }}>
            Selecciona la categoría del producto para ver solo los campos necesarios
          </Text>
          {categories.map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.97 }}
              onClick={() => { setForm(p => ({ ...p, categoryId: cat.id })); setStep(2); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${COLORS.borderLight}`,
                background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}>
              {/* Imagen real de la categoría */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0, aspectRatio: '1/1',
                background: `linear-gradient(135deg, ${COLORS.navyLight}, ${COLORS.navy})`,
                overflow: 'hidden', border: `1px solid ${COLORS.borderLight}`,
              }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: cat.id.includes('pack') ? 'linear-gradient(135deg, #fff4e6, #ffe0c2)' : 'linear-gradient(135deg, #f0f4ff, #e6edff)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', fontWeight: 600, color: COLORS.navy }}>{cat.name}</div>
                <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: COLORS.textMuted, marginTop: 1 }}>
                  {cat.id.includes('pack') ? 'Pack de presentación con contenidos y precios por modelo' :
                   cat.id.includes('anillo') ? 'Material, acabado y tallas por género' :
                   'Material, acabado y descripción'}
                </div>
              </div>
              <span style={{ color: COLORS.borderLight, fontSize: '1rem', fontWeight: 300 }}>›</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* ===== PASO 2: Formulario ===== */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!product && (
            <button onClick={() => setStep(1)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', color: COLORS.textMuted, fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', padding: 0,
            }}>
              ‹ Cambiar categoría
            </button>
          )}

          {/* Categoría seleccionada — solo lectura */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderRadius: 10, background: isPack ? '#fff8f0' : '#f0f4ff',
            border: `1px solid ${isPack ? 'rgba(247,103,7,0.2)' : 'rgba(44,74,128,0.12)'}`,
          }}>
            {selectedCat?.image ? (
              <img src={selectedCat.image} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 24, height: 24, borderRadius: 5, background: isPack ? '#ffe0c2' : '#e6edff', flexShrink: 0 }} />
            )}
            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', fontWeight: 600, color: isPack ? COLORS.orange : COLORS.navy }}>
              {selectedCat?.name}
            </span>
          </div>

          <TextInput label="Título" placeholder="Nombre del producto" value={form.title}
            onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, title: v })); }} required radius="md" />
          <Textarea label="Descripción" placeholder="Descripción" value={form.description}
            onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, description: v })); }} radius="md" rows={2} />

          {/* ===== CAMPOS JOYERÍA (no pack) ===== */}
          {!isPack && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextInput label="Material" placeholder="Ej: Acero Inoxidable" value={form.material}
                  onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, material: v })); }} radius="md" />
                <TextInput label="Precio (S/.)" placeholder="0.00" value={form.price}
                  onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, price: v })); }} radius="md" />
              </div>
              {storeType === 'jewelry' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Select label="Tipo de acabado" placeholder="Ninguno" value={form.platingType || ''}
                    onChange={(val) => setForm(p => ({ ...p, platingType: val || '' }))}
                    data={[{ value: 'Enchapado', label: 'Enchapado' }, { value: 'Laminado', label: 'Laminado' }, { value: 'Bañado', label: 'Bañado' }]}
                    radius="md" clearable />
                  {form.platingType && (
                    <TextInput label={`${form.platingType} en`} placeholder="Ej: Oro 18k" value={form.plating}
                      onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, plating: v })); }} radius="md" />
                  )}
                </div>
              )}
              {/* Tipo de piedra — solo para anillos */}
              {isAnillos && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TextInput
                    label="Tipo de piedra"
                    placeholder="Ej: Zirconia, Cristal, Rubí..."
                    value={form.tipoPiedra || ''}
                    onChange={(e) => setForm(p => ({ ...p, tipoPiedra: e.currentTarget.value }))}
                    radius="md"
                    leftSection={<IconDiamond size={15} color="#7c3aed" />}
                  />
                  <TextInput
                    label="Color de la piedra"
                    placeholder="Ej: Azul, Rosa, Transparente..."
                    value={form.colorPiedra || ''}
                    onChange={(e) => setForm(p => ({ ...p, colorPiedra: e.currentTarget.value }))}
                    radius="md"
                    leftSection={<IconDiamond size={15} color="#7c3aed" />}
                  />
                </div>
              )}

              {/* Tallas solo para anillos */}
              {isAnillos && (
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f8f9fa', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy }}>Tallas Disponibles</Text>
                  </div>
                  {/* Varón */}
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${COLORS.borderLight}`, background: '#f0f4ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2c4a80' }} />
                      <Text size="xs" fw={700} style={{ fontFamily: '"Outfit", sans-serif', color: '#2c4a80', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Varón</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <TextInput placeholder="Ej: 6, 7, 8..." value={newTallaVaron}
                        onChange={(e) => { const v = e.currentTarget.value; setNewTallaVaron(v); }} radius="md" size="xs" style={{ flex: 1 }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTallaVaron(); }}} />
                      <Button size="xs" radius="md" style={{ background: '#2c4a80', minWidth: 36 }} onClick={addTallaVaron}>+</Button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {form.tallasVaron.length === 0 ? <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Sin tallas</Text> :
                        form.tallasVaron.map((t, i) => (
                          <Badge key={i} size="md" radius="xl" style={{ background: '#2c4a80', color: 'white' }}
                            rightSection={<ActionIcon size="xs" variant="transparent" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => removeTallaVaron(i)}><IconX size={9} /></ActionIcon>}>{t}</Badge>
                        ))}
                    </div>
                  </div>
                  {/* Dama */}
                  <div style={{ padding: '12px 14px', background: '#fff0f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c2255c' }} />
                      <Text size="xs" fw={700} style={{ fontFamily: '"Outfit", sans-serif', color: '#c2255c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Dama</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <TextInput placeholder="Ej: 5, 6, 7..." value={newTallaDama}
                        onChange={(e) => { const v = e.currentTarget.value; setNewTallaDama(v); }} radius="md" size="xs" style={{ flex: 1 }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTallaDama(); }}} />
                      <Button size="xs" radius="md" style={{ background: '#c2255c', minWidth: 36 }} onClick={addTallaDama}>+</Button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {form.tallasDama.length === 0 ? <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Sin tallas</Text> :
                        form.tallasDama.map((t, i) => (
                          <Badge key={i} size="md" radius="xl" style={{ background: '#c2255c', color: 'white' }}
                            rightSection={<ActionIcon size="xs" variant="transparent" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => removeTallaDama(i)}><IconX size={9} /></ActionIcon>}>{t}</Badge>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== CAMPOS PACK ===== */}
          {isPack && (
            <>
              <TextInput label="Precio del pack solo (S/.)" placeholder="0.00" value={form.price}
                onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, price: v })); }} radius="md"
                description="Precio base del pack sin anillo" />

              {/* Contenidos */}
              <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #fff8f0, #fff)', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <Text size="sm" fw={600} style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.orange }}>Contenido del pack</Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', marginTop: 2 }}>Agrega cada item. La foto es opcional.</Text>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <TextInput placeholder="Ej: Caja de terciopelo, Acta de promesa..." value={newContenidoNombre}
                      onChange={(e) => { const v = e.currentTarget.value; setNewContenidoNombre(v); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addContenido(); }}}
                      radius="md" size="xs" style={{ flex: 1 }} />
                    <Button size="xs" radius="md" style={{ background: COLORS.orange, minWidth: 36 }} onClick={addContenido}>+</Button>
                  </div>
                  {form.contenidos.length === 0 ? <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Sin contenidos aún</Text> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {form.contenidos.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: '#fafafa', border: `1px solid ${COLORS.borderLight}` }}>
                          <div style={{ flexShrink: 0 }}>
                            {item.imagen ? (
                              <div style={{ position: 'relative' }}>
                                <img src={item.imagen} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                <button onClick={() => updateContenidoImagen(idx, null)}
                                  style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#e53e3e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                  <IconX size={9} color="white" />
                                </button>
                              </div>
                            ) : (
                              <label style={{ cursor: 'pointer' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px dashed ${COLORS.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', flexDirection: 'column', gap: 2 }}>
                                  {uploadingContenidoImg === idx ? <Text size="xs" c="dimmed">...</Text> : <><IconPhoto size={13} color={COLORS.textMuted} /><Text size="xs" c="dimmed" style={{ fontSize: '0.45rem' }}>foto</Text></>}
                                </div>
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                  onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingContenidoImg(idx); const img64 = await uploadImage(file); updateContenidoImagen(idx, img64); setUploadingContenidoImg(null); }} />
                              </label>
                            )}
                          </div>
                          <span style={{ flex: 1, fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: COLORS.navy, fontWeight: 500 }}>{item.nombre}</span>
                          <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeContenido(idx)}><IconTrash size={13} /></ActionIcon>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modelos automáticos — info */}
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0f4ff', border: '1px solid rgba(44,74,128,0.1)' }}>
                <Text size="xs" style={{ fontFamily: '"Outfit", sans-serif', color: COLORS.navy, fontWeight: 600 }}>Precios con anillos — automático</Text>
                <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', marginTop: 4, lineHeight: 1.5 }}>
                  Al cliente le aparecerá automáticamente cada anillo registrado con el precio total (precio anillo + precio pack). Solo necesitas definir el precio del pack arriba.
                </Text>
              </div>
            </>
          )}

          <Switch label="Agotado" checked={form.soldOut}
            onChange={(e) => setForm(p => ({ ...p, soldOut: e.currentTarget.checked }))} color="orange" />
          <Switch label="Mostrar botón de WhatsApp" checked={form.showWhatsapp}
            onChange={(e) => setForm(p => ({ ...p, showWhatsapp: e.currentTarget.checked }))} color="green" />

          {/* Imágenes */}
          <div>
            <Text size="sm" fw={500} mb={6}>Imágenes</Text>
            {form.images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, aspectRatio: '1/1' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    <ActionIcon size="xs" variant="filled" color="red" radius="xl"
                      style={{ position: 'absolute', top: -6, right: -6 }} onClick={() => removeImage(i)}><IconX size={10} /></ActionIcon>
                  </div>
                ))}
              </div>
            )}
            <FileInput accept="image/*" placeholder={uploadingImage ? 'Subiendo...' : 'Agregar imagen'}
              leftSection={<IconUpload size={16} />} onChange={handleImageAdd} radius="md" clearable disabled={uploadingImage} />
          </div>

          <Button onClick={handleSubmit} radius="xl" size="md" mt="sm"
            style={{ background: COLORS.navy, fontFamily: '"Outfit", sans-serif' }}>
            {product ? 'Guardar Cambios' : 'Agregar Producto'}
          </Button>
        </div>
      )}
    </Modal>
  );
}


function CategoryFormModal({ open, category, storeType, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', lottieUrl: '', image: '' });
  const [lottieMode, setLottieMode] = useState('preset');

  React.useEffect(() => {
    if (category) {
      setForm({ name: category.name || '', lottieUrl: category.lottieUrl || '', image: category.image || '' });
      const isPreset = LOTTIE_PRESETS.some(p => p.value === (category.lottieUrl || ''));
      setLottieMode(isPreset ? 'preset' : 'link');
    } else {
      setForm({ name: '', lottieUrl: '', image: '' });
      setLottieMode('preset');
    }
  }, [category, open]);

  const handleImageAdd = async (file) => {
    if (!file) return;
    try {
      const base64 = await uploadImage(file);
      setForm(p => ({ ...p, image: base64 }));
    } catch {
      notifications.show({ title: 'Error', message: 'Error al cargar imagen', color: 'red' });
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { notifications.show({ title: 'Error', message: 'El nombre es obligatorio', color: 'red' }); return; }
    if (category) {
      updateCategory(category.id, form);
      notifications.show({ title: 'Actualizado', message: 'Categoría actualizada', color: 'green' });
    } else {
      const data = loadStore();
      const maxOrder = Math.max(0, ...data.categories.filter(c => c.storeType === storeType).map(c => c.order));
      addCategory({ id: generateId(), ...form, storeType, order: maxOrder + 1 });
      notifications.show({ title: 'Agregada', message: 'Categoría agregada', color: 'green' });
    }
    onSave();
  };

  return (
    <Modal opened={open} onClose={onClose} title={category ? 'Editar Categoría' : 'Nueva Categoría'}
      centered radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput label="Nombre de la categoría" placeholder="Ej: Aretes" value={form.name}
          onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, name: v })); }} required radius="md" />
        <div>
          <Text size="sm" fw={500} mb={6}>Sticker Lottie (animación)</Text>
          <SegmentedControl value={lottieMode}
            onChange={(val) => { setLottieMode(val); if (val === 'preset') setForm(p => ({ ...p, lottieUrl: '' })); }}
            fullWidth size="xs" radius="xl" mb={10}
            data={[{ value: 'preset', label: 'Elegir de lista' }, { value: 'link', label: 'Pegar link' }]}
            styles={{ root: { background: COLORS.borderLight }, indicator: { background: COLORS.orange },
              label: { fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem' } }} />
          {lottieMode === 'preset' ? (
            <Select placeholder="Seleccionar animación" value={form.lottieUrl}
              onChange={(val) => setForm(p => ({ ...p, lottieUrl: val || '' }))}
              data={LOTTIE_PRESETS} clearable radius="md" />
          ) : (
            <TextInput placeholder="https://lottie.host/xxxxx/xxxxx.lottie" value={form.lottieUrl}
              onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, lottieUrl: v })); }}
              leftSection={<IconLink size={16} />} radius="md" description="Pega el link de LottieFiles aquí" />
          )}
          {form.lottieUrl && (
            <div style={{ textAlign: 'center', marginTop: 12, padding: 16, background: COLORS.offWhite, borderRadius: 12, border: `1px solid ${COLORS.borderLight}` }}>
              <dotlottie-wc src={form.lottieUrl} style={{ width: '70px', height: '70px', margin: '0 auto' }} autoplay loop />
              <Text size="xs" c="dimmed" mt={6} style={{ fontFamily: '"Outfit", sans-serif' }}>Vista previa del sticker</Text>
            </div>
          )}
        </div>
        <div>
          <Text size="sm" fw={500} mb={6}>Imagen de categoría</Text>
          {form.image && (
            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 8, aspectRatio: '1/1' }}>
              <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
              <ActionIcon size="xs" variant="filled" color="red" radius="xl"
                style={{ position: 'absolute', top: -6, right: -6 }}
                onClick={() => setForm(p => ({ ...p, image: '' }))}><IconX size={10} /></ActionIcon>
            </div>
          )}
          <FileInput accept="image/*" placeholder="Seleccionar imagen" leftSection={<IconUpload size={16} />}
            onChange={handleImageAdd} radius="md" clearable />
        </div>
        <Button onClick={handleSubmit} radius="xl" mt="md"
          style={{ background: COLORS.navy, fontFamily: '"Outfit", sans-serif' }}>
          {category ? 'Guardar Cambios' : 'Agregar Categoría'}
        </Button>
      </div>
    </Modal>
  );
}

function LocationFormModal({ open, location, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', lat: '', lng: '' });

  React.useEffect(() => {
    if (location) {
      setForm({ name: location.name || '', lat: location.lat || '', lng: location.lng || '' });
    } else {
      setForm({ name: '', lat: -15.4980, lng: -70.1290 });
    }
  }, [location, open]);

  const handleSubmit = () => {
    if (!form.name.trim()) { notifications.show({ title: 'Error', message: 'El nombre es obligatorio', color: 'red' }); return; }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) { notifications.show({ title: 'Error', message: 'Coordenadas inválidas', color: 'red' }); return; }
    if (location) {
      updateDeliveryLocation(location.id, { name: form.name, lat, lng });
      notifications.show({ title: 'Actualizado', message: 'Punto de entrega actualizado', color: 'green' });
    } else {
      addDeliveryLocation({ id: generateId(), name: form.name, lat, lng });
      notifications.show({ title: 'Agregado', message: 'Punto de entrega agregado', color: 'green' });
    }
    onSave();
  };

  return (
    <Modal opened={open} onClose={onClose} title={location ? 'Editar Punto de Entrega' : 'Nuevo Punto de Entrega'}
      centered radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput label="Nombre del Lugar" placeholder="Ej: Real Plaza" value={form.name}
          onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, name: v })); }} required radius="md" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextInput label="Latitud" placeholder="-15.4980" value={form.lat}
            onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, lat: v })); }} radius="md" />
          <TextInput label="Longitud" placeholder="-70.1290" value={form.lng}
            onChange={(e) => { const v = e.currentTarget.value; setForm(p => ({ ...p, lng: v })); }} radius="md" />
        </div>
        <Card padding="sm" radius="md" style={{ background: '#f0f4ff', border: '1px solid #dde4f0' }}>
          <Text size="xs" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif', lineHeight: 1.5 }}>
            <strong>Cómo obtener coordenadas:</strong><br />
            1. Abre Google Maps<br />
            2. Click derecho en el lugar<br />
            3. Copia los números (ej: -15.4980, -70.1290)<br />
            4. Primer número = Latitud, segundo = Longitud
          </Text>
        </Card>
        <Button onClick={handleSubmit} radius="xl" mt="md"
          style={{ background: COLORS.navy, fontFamily: '"Outfit", sans-serif' }}>
          {location ? 'Guardar Cambios' : 'Agregar Punto'}
        </Button>
      </div>
    </Modal>
  );
}

function PasswordModal({ open, onClose }) {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const handleSave = () => {
    if (newPw.length < 4) { notifications.show({ title: 'Error', message: 'Mínimo 4 caracteres', color: 'red' }); return; }
    if (newPw !== confirm) { notifications.show({ title: 'Error', message: 'No coinciden', color: 'red' }); return; }
    changePassword(newPw);
    notifications.show({ title: 'Listo', message: 'Contraseña cambiada', color: 'green' });
    setNewPw(''); setConfirm(''); onClose();
  };
  return (
    <Modal opened={open} onClose={onClose} title="Cambiar Contraseña" centered radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600 } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput type="password" label="Nueva Contraseña" value={newPw}
          onChange={(e) => { const v = e.currentTarget.value; setNewPw(v); }} radius="md" />
        <TextInput type="password" label="Confirmar" value={confirm}
          onChange={(e) => { const v = e.currentTarget.value; setConfirm(v); }} radius="md" />
        <Button onClick={handleSave} radius="xl" style={{ background: COLORS.navy }}>Guardar</Button>
      </div>
    </Modal>
  );
}