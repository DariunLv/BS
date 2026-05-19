// src/utils/cart.js
// ─────────────────────────────────────────────────────────────────────────────
// Helpers puros del carrito de compras.
// NO contiene estado — solo funciones de cálculo y formateo.
//
// El carrito es PER-CLIENTE. Vive en el navegador del cliente (localStorage),
// NUNCA en Firebase. Es técnicamente imposible que se mezcle con otros clientes.
// ─────────────────────────────────────────────────────────────────────────────

/** Calcula el subtotal de UN item del carrito. */
export function itemSubtotal(item) {
  const price = parseFloat(item?.productSnapshot?.price) || 0;
  const qty   = Math.max(1, parseInt(item?.quantity) || 1);
  return price * qty;
}

/** Total general del carrito. */
export function cartTotal(items) {
  return (items || []).reduce((sum, it) => sum + itemSubtotal(it), 0);
}

/** Conteo total de unidades en el carrito (suma de cantidades). */
export function cartUnitCount(items) {
  return (items || []).reduce((sum, it) => sum + (parseInt(it.quantity) || 1), 0);
}

/** Formatea un número como moneda peruana. */
export function formatSoles(n) {
  const v = parseFloat(n) || 0;
  return `S/. ${v.toFixed(2)}`;
}

/**
 * Construye un snapshot ligero del producto al momento de agregarlo.
 * No guardamos el producto completo para no inflar localStorage.
 */
export function buildProductSnapshot(product) {
  if (!product) return null;
  return {
    id: product.id,
    title: product.title || '',
    price: parseFloat(product.price) || 0,
    categoryId: product.categoryId || '',
    image: (product.images && product.images[0]) || '',
    material: product.material || '',
    platingType: product.platingType || '',
    plating: product.plating || '',
    tipoPiedra: product.tipoPiedra || '',
    colorPiedra: product.colorPiedra || '',
    acabado: product.acabado || '',
    isPack: product.categoryId?.includes('pack') || false,
    isAnillo: product.categoryId?.includes('anillo') || false,
  };
}

/** Detecta qué caja le toca a un anillo según precio. */
export function detectCajaForProduct(product, ringBoxes) {
  if (!product || !ringBoxes) return null;
  const isAnillo = product.categoryId?.includes('anillo');
  if (!isAnillo) return null;
  const price = parseFloat(product.price || 0);
  const isPremium = price >= 40;
  const box = isPremium ? ringBoxes.premium : ringBoxes.cheap;
  if (!box) return null;
  return {
    type: isPremium ? 'premium' : 'cheap',
    title: box.title || (isPremium ? 'Caja Premium' : 'Caja de anillo'),
    label: box.label || 'Incluida',
  };
}

/** Devuelve la lista de agregados gratis (snapshot ligero). */
export function getAgregadosForProduct(product, agregados) {
  if (!product) return [];
  const isAnillo = product.categoryId?.includes('anillo');
  if (!isAnillo) return [];
  return (agregados || []).map(ag => ({
    id: ag.id,
    title: ag.title || '',
    tag: ag.tag || '',
  }));
}

/** Clave de merge para detectar items idénticos en el carrito. */
export function getMergeKey(item) {
  return [
    item.productId,
    item.tallaVaron || '',
    item.tallaDama || '',
    item.tallaLegacy || '',
    item.note || '',
  ].join('|');
}

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJE DE WHATSAPP
// ─────────────────────────────────────────────────────────────────────────────

/** Formatea las líneas detalladas de un solo item. Reutilizado por ambas funciones. */
function formatItemLines(it, indexLabel = null) {
  const p = it.productSnapshot || {};
  const qty = parseInt(it.quantity) || 1;
  const price = parseFloat(p.price) || 0;
  const subtotal = price * qty;
  const lines = [];

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  if (indexLabel) {
    lines.push(`💎 *${indexLabel}: ${p.title || 'Producto'}*`);
  } else {
    lines.push(`💎 *${p.title || 'Producto'}*`);
  }
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');

  lines.push(`   📦 Cantidad: ${qty}`);

  // Talla
  if (it.tallaVaron) lines.push(`   📏 Talla Varón: ${it.tallaVaron}`);
  if (it.tallaDama)  lines.push(`   📏 Talla Dama: ${it.tallaDama}`);
  if (it.tallaLegacy) lines.push(`   📏 Talla: ${it.tallaLegacy}`);
  if (it.isAjustable) lines.push(`   📏 Talla: Ajustable`);

  // Material y especificaciones
  if (p.material)   lines.push(`   ⚙️ Material: ${p.material}`);
  if (p.platingType && p.plating) lines.push(`   ✨ ${p.platingType}: ${p.plating}`);
  if (p.tipoPiedra) {
    const piedra = p.colorPiedra ? `${p.tipoPiedra} ${p.colorPiedra}` : p.tipoPiedra;
    lines.push(`   💠 Piedra: ${piedra}`);
  }
  if (p.acabado)    lines.push(`   🌟 Acabado: ${p.acabado}`);

  // Caja
  if (it.caja && it.caja.title) {
    lines.push(`   🎁 Incluye: ${it.caja.title}`);
  }

  // Agregados gratis
  if (it.agregadosIncluidos && it.agregadosIncluidos.length > 0) {
    const titulos = it.agregadosIncluidos
      .map(a => a.title)
      .filter(Boolean)
      .join(', ');
    if (titulos) lines.push(`   🎀 Incluye gratis: ${titulos}`);
  }

  // Extras opcionales
  if (it.extrasIncluidos && it.extrasIncluidos.length > 0) {
    const titulos = it.extrasIncluidos
      .map(a => a.title)
      .filter(Boolean)
      .join(', ');
    if (titulos) lines.push(`   ➕ Extras: ${titulos}`);
  }

  // Pack info
  if (it.packInfo) {
    if (it.packInfo.ringTitle) {
      lines.push(`   💍 Anillo del pack: ${it.packInfo.ringTitle}`);
    }
    if (it.packInfo.tallaVaron) lines.push(`   📏 Talla del anillo (Varón): ${it.packInfo.tallaVaron}`);
    if (it.packInfo.tallaDama)  lines.push(`   📏 Talla del anillo (Dama): ${it.packInfo.tallaDama}`);
  }

  // Nota del cliente
  if (it.note && it.note.trim()) {
    lines.push(`   📝 Nota: "${it.note.trim()}"`);
  }

  // Precio y subtotal
  if (qty > 1) {
    lines.push(`   💰 Precio: ${formatSoles(price)} c/u`);
    lines.push(`   💵 Subtotal: ${formatSoles(subtotal)}`);
  } else {
    lines.push(`   💰 Precio: ${formatSoles(price)}`);
  }

  return lines;
}

/**
 * Construye el mensaje completo del carrito para WhatsApp.
 * Devuelve { number, text, encoded } listo para wa.me/NUMERO?text=ENCODED
 */
export function buildWhatsAppMessage({ items, customerName, whatsappNumber }) {
  const lines = [];
  const trimmedName = (customerName || '').trim();

  // Encabezado
  lines.push('🌟 *Pedido — Benito Virtual Store* 🌟');
  lines.push('');
  if (trimmedName) {
    lines.push(`👋 ¡Hola, buen día! Soy *${trimmedName}*.`);
  } else {
    lines.push('👋 ¡Hola, buen día!');
  }
  lines.push('Vi el catálogo y me interesa coordinar este pedido:');
  lines.push('');

  // Items
  (items || []).forEach((it, i) => {
    const itemLines = formatItemLines(it, `PRODUCTO ${i + 1}`);
    lines.push(...itemLines);
    lines.push('');
  });

  // Resumen
  const total = cartTotal(items);
  const units = cartUnitCount(items);
  const productCount = (items || []).length;

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('📊 *RESUMEN DEL PEDIDO*');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`   🛍️ Productos: ${productCount}`);
  if (units !== productCount) lines.push(`   📦 Unidades totales: ${units}`);
  lines.push(`   💵 *TOTAL: ${formatSoles(total)}*`);
  lines.push('');
  lines.push('📞 ¿Me podrías confirmar?');
  lines.push('   ✅ Disponibilidad');
  lines.push('   ✅ Formas de pago');
  lines.push('   ✅ Tiempo y costo de entrega');
  lines.push('');
  lines.push('¡Muchas gracias! 🙏✨');

  const text = lines.join('\n');
  return {
    number: whatsappNumber || '51970824366',
    text,
    encoded: encodeURIComponent(text),
  };
}

/**
 * Construye un mensaje de WhatsApp para CONSULTAR UN solo producto
 * con todas sus opciones configuradas (sin agregar al carrito).
 *
 * Se usa desde el botón "Consultar por WhatsApp" dentro del modal de anillos.
 */
export function buildSingleProductWhatsAppMessage({
  product, configuration, customerName, whatsappNumber,
}) {
  const lines = [];
  const trimmedName = (customerName || '').trim();

  lines.push('🌟 *Consulta — Benito Virtual Store* 🌟');
  lines.push('');
  if (trimmedName) {
    lines.push(`👋 ¡Hola! Soy *${trimmedName}*.`);
  } else {
    lines.push('👋 ¡Hola, buen día!');
  }
  lines.push('Estoy interesado/a en este producto con estas opciones:');
  lines.push('');

  // Construir item temporal con la misma estructura que el carrito
  const tempItem = {
    productSnapshot: buildProductSnapshot(product),
    quantity: configuration?.quantity || 1,
    tallaVaron: configuration?.tallaVaron || '',
    tallaDama:  configuration?.tallaDama  || '',
    tallaLegacy: configuration?.tallaLegacy || '',
    isAjustable: configuration?.isAjustable || false,
    caja: configuration?.caja || null,
    agregadosIncluidos: configuration?.agregadosIncluidos || [],
    extrasIncluidos: configuration?.extrasIncluidos || [],
    note: configuration?.note || '',
  };

  const itemLines = formatItemLines(tempItem);
  lines.push(...itemLines);
  lines.push('');
  lines.push('📞 ¿Me podrías confirmar disponibilidad y formas de pago?');
  lines.push('');
  lines.push('¡Gracias! 🙏✨');

  const text = lines.join('\n');
  return {
    number: whatsappNumber || '51970824366',
    text,
    encoded: encodeURIComponent(text),
  };
}