// src/components/AddToCartButton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Botón "Agregar al carrito" para insertar en ProductModal.
//
// Comportamiento:
//   - ANILLOS: abre AddToCartRingModal con opciones (caja, agregados, extras, packs).
//   - OTROS PRODUCTOS: agrega directo al carrito con animación de feedback.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconShoppingBagPlus, IconCheck, IconAlertTriangle,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { useCart } from '../utils/CartContext';
import {
  buildProductSnapshot, detectCajaForProduct, getAgregadosForProduct,
} from '../utils/cart';
import AddToCartRingModal from './AddToCartRingModal';

export default function AddToCartButton({
  product,
  storeData,
  selectedTalla,
  requireTalla = false,
  isRingType = false,    // si true → abre modal de configuración
  onOpenPack,            // callback para abrir el detalle del pack desde el modal
  fullWidth = false,
}) {
  const { addToCart, setCartOpen } = useCart();
  const [feedback, setFeedback] = useState(null); // 'added' | 'needSize' | null
  const [ringModalOpen, setRingModalOpen] = useState(false);

  const handleClick = () => {
    // Validar talla si aplica
    if (requireTalla && !selectedTalla) {
      setFeedback('needSize');
      setTimeout(() => setFeedback(null), 2200);
      return;
    }

    // ANILLOS → abrir modal de personalización (el modal mostrará aviso de soldOut)
    if (isRingType) {
      setRingModalOpen(true);
      return;
    }

    // Calcular aviso de stock si es necesario
    let stockWarning = '';
    if (product.soldOut) {
      stockWarning = 'Producto agotado · Tu pedido será pre-orden';
    }

    // OTROS PRODUCTOS → agregar directo
    addToCart({
      productId: product.id,
      productSnapshot: buildProductSnapshot(product),
      quantity: 1,
      caja: detectCajaForProduct(product, storeData?.ringBoxes || {}),
      agregadosIncluidos: getAgregadosForProduct(product, storeData?.agregados || []),
      note: '',
      stockWarning,
    });
    setFeedback('added');
    setTimeout(() => {
      setFeedback(null);
      setCartOpen(true);
    }, 700);
  };

  const isAdded = feedback === 'added';
  const needSize = feedback === 'needSize';

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        animate={needSize ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: needSize ? 0.45 : 0.18 }}
        style={{
          width: fullWidth ? '100%' : 'auto',
          padding: '13px 22px',
          height: 50,
          border: 'none',
          borderRadius: 14,
          background: isAdded
            ? 'linear-gradient(135deg, #20c997, #12b886)'
            : needSize
            ? 'linear-gradient(135deg, #f08c00, #e67700)'
            : `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
          color: '#fff',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 600, fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 6px 18px rgba(26,39,68,0.28)',
          letterSpacing: '0.3px',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isAdded ? (
            <motion.span key="added"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCheck size={18} stroke={2.5} />
              <span>Agregado al carrito</span>
            </motion.span>
          ) : needSize ? (
            <motion.span key="need"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconAlertTriangle size={18} stroke={2.2} />
              <span>Elige una talla primero</span>
            </motion.span>
          ) : (
            <motion.span key="default"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconShoppingBagPlus size={18} stroke={2} />
              <span>Agregar al carrito</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Modal de configuración (solo se monta para anillos) */}
      {isRingType && (
        <AddToCartRingModal
          open={ringModalOpen}
          onClose={() => setRingModalOpen(false)}
          product={product}
          storeData={storeData}
        />
      )}
    </>
  );
}