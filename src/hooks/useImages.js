// src/hooks/useImages.js
// Hook para obtener imágenes de un producto desde el caché.
// El estado de React solo guarda un número de revisión (1 entero),
// NO los megabytes de base64 — eso queda en imageCache.js.
import { useState, useEffect } from 'react';
import { getImages, subscribeToImages, preloadImages } from '../utils/imageCache';

/**
 * Devuelve las imágenes de un producto.
 * Si aún no están en caché, dispara la carga y devuelve [] hasta que llegan.
 * null = "aún cargando" (para mostrar shimmer)
 * []   = confirmado sin fotos
 * [...] = imágenes disponibles
 */
export default function useImages(productId) {
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!productId) return;
    // Disparar carga si no está en caché
    preloadImages([productId]);
    // Suscribirse para forzar re-render cuando lleguen las fotos
    const unsub = subscribeToImages(() => setRev(r => r + 1));
    return unsub;
  }, [productId]);

  // El número `rev` hace que React re-evalúe esta línea cuando el caché cambia
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return getImages(productId); // null | [] | string[]
}