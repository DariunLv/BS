// src/App.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import { lazy, Suspense } from 'react';
// Rutas pesadas → se cargan solo cuando se necesitan
const CatalogPage           = lazy(() => import('./pages/CatalogPage'));
const CategoryPage          = lazy(() => import('./pages/CategoryPage'));
const SecondStorePage       = lazy(() => import('./pages/SecondStorePage'));
const SecondStoreCategoryPage = lazy(() => import('./pages/SecondStoreCategoryPage'));
const AdminPanel            = lazy(() => import('./pages/AdminPanel'));
// Componentes siempre presentes → carga normal
import AdminLogin from './components/AdminLogin';
import ClickSpark from './components/ClickSpark';
import FloatingHearts from './components/FloatingHearts';
import SparkleTrail from './components/SparkleTrail';
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';
import { loadStore, setCacheData, subscribeToStore } from './utils/store';
import { loadFromFirebase } from './utils/firebase';
import { flushSaveQueue } from './utils/saveQueue';
import SaveIndicator from './components/SaveIndicator';
import { CartProvider } from './utils/CartContext';
import CartDrawer from './components/CartDrawer';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  // Persistir sesion admin en sessionStorage para que sobreviva refresh
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return sessionStorage.getItem('benito_admin') === 'true'; } catch { return false; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const LOCAL_CACHE_KEY = 'benito_cache_v2';

  // Iniciar con caché local si existe → carga instantánea (UI preview)
  // IMPORTANTE: marcamos cacheData con _isLight=true para que store.js NO lo guarde
  // a Firebase mientras está light. Firebase es la fuente de verdad.
  const [storeData, setStoreData] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed._isLight = true;          // marca para bloquear save accidental
        setCacheData(parsed);
        return loadStore();
      }
    } catch {}
    return loadStore();
  });

  // isLoading solo es true si NO hay caché local (primera visita)
  const [isLoading, setIsLoading] = useState(() => {
    try { return !localStorage.getItem(LOCAL_CACHE_KEY); } catch { return true; }
  });
  const [currentStore, setCurrentStore] = useState('jewelry');
  const [navDirection, setNavDirection] = useState('fade');
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshData = useCallback(() => {
    const fresh = loadStore();
    setStoreData(fresh);
  }, []);

  // Suscripción automática: cualquier mutación del store actualiza la UI de inmediato
  useEffect(() => {
    const unsub = subscribeToStore((fresh) => setStoreData(fresh));
    return unsub;
  }, []);

  // Cargar Firebase al inicio. Firebase es la ÚNICA fuente de verdad.
  // El caché local solo sirve para mostrar UI rápido mientras Firebase carga.
  useEffect(() => {
    loadFromFirebase().then((firebaseData) => {
      if (firebaseData) {
        // Firebase tiene la verdad → ponerla en el cache de memoria
        setCacheData(firebaseData);
        setStoreData(loadStore());
        // Guardar versión LIGERA en localStorage (sin fotos pesadas).
        // Esto es solo para que la próxima visita muestre la UI rápido.
        try {
          import('./utils/store').then(({ buildLightCache }) => {
            if (buildLightCache) {
              localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(buildLightCache(firebaseData)));
            }
          });
        } catch {}
      } else {
        // Firebase no devolvió datos (proyecto nuevo o sin meta).
        // Limpiar _isLight para no bloquear guardados futuros.
        import('./utils/store').then(({ clearLightFlag }) => {
          if (clearLightFlag) clearLightFlag();
        });
      }
      setIsLoading(false);
    }).catch(() => {
      // Firebase FALLÓ al cargar (sin internet, error de red).
      // Limpiar _isLight igual: si no, el usuario quedaría bloqueado sin
      // poder guardar nada. Es preferible permitir guardar (los blindajes
      // de syncCollection evitan que se borren datos de Firebase).
      import('./utils/store').then(({ clearLightFlag }) => {
        if (clearLightFlag) clearLightFlag();
      });
      setIsLoading(false);
    });
  }, []);

  // Scroll arriba en cada cambio de ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Guardar estado admin en sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('benito_admin', isAdmin ? 'true' : 'false'); } catch {}
  }, [isAdmin]);

  // Si estamos en /admin pero no logueados y no hay sesion guardada, redirigir
  useEffect(() => {
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      navigate('/');
    }
  }, [location.pathname, isAdmin, navigate]);

  const handleLogoClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (isAdmin) {
        setIsAdmin(false);
        navigate('/');
      } else {
        setShowLogin(true);
      }
    } else {
      clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
    }
  }, [isAdmin, navigate]);

  const handleLoginSuccess = useCallback(() => {
    setIsAdmin(true);
    setShowLogin(false);
    navigate('/admin');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    // IMPORTANTE: forzar flush para no perder cambios pendientes al cerrar sesión
    flushSaveQueue(5000).finally(() => {
      setIsAdmin(false);
      refreshData();
      navigate('/');
    });
  }, [navigate, refreshData]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <CartProvider>
    <>
      {!isAdminRoute && (() => {
        // Reducir efectos en celulares de gama baja (< 4 núcleos o memoria < 4GB)
        const isLowEnd = (navigator.hardwareConcurrency || 4) < 4 ||
                         (navigator.deviceMemory || 4) < 4;
        return (
          <>
            <AnimatedBackground />
            {!isLowEnd && <FloatingHearts count={10} opacity={0.04} />}
            {!isLowEnd && <SparkleTrail color="#f76707" size={3.5} density={0.25} />}
          </>
        );
      })()}

      <ClickSpark sparkColor="#f76707" sparkSize={12} sparkRadius={22} sparkCount={10} duration={500}>
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {!isAdminRoute && (
            <Header onLogoClick={handleLogoClick} currentStore={currentStore} onStoreChange={setCurrentStore} onBack={() => setNavDirection('slideRight')} />
          )}

          <Suspense fallback={<div style={{minHeight:'60vh'}}/>}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <PageTransition direction={navDirection}>
                  <CatalogPage storeData={storeData} isLoading={isLoading}
                    onNavigateCategory={(catId) => { setNavDirection('slideLeft'); navigate(`/categoria/${catId}`); }}
                    onNavigateSecondStore={() => { setNavDirection('slideLeft'); navigate('/tienda-general'); }}
                  />
                </PageTransition>
              } />
              <Route path="/categoria/:categoryId" element={
                <PageTransition direction={navDirection}>
                  <CategoryPage storeData={storeData} isLoading={isLoading} />
                </PageTransition>
              } />
              <Route path="/tienda-general" element={
                <PageTransition direction={navDirection}>
                  <SecondStorePage storeData={storeData}
                    onNavigateCategory={(catId) => { setNavDirection('slideLeft'); navigate(`/tienda-general/categoria/${catId}`); }}
                    onBack={() => { setNavDirection('slideRight'); navigate('/'); }}
                  />
                </PageTransition>
              } />
              <Route path="/tienda-general/categoria/:categoryId" element={
                <PageTransition direction={navDirection}>
                  <SecondStoreCategoryPage storeData={storeData} onBack={() => { setNavDirection('slideRight'); navigate('/tienda-general'); }} />
                </PageTransition>
              } />
              <Route path="/admin/*"
                element={
                  isAdmin
                    ? <AdminPanel storeData={storeData} onRefresh={refreshData} onLogout={handleLogout} />
                    : <Navigate to="/" replace />
                }
              />
            </Routes>
          </AnimatePresence>
          </Suspense>

          {!isAdminRoute && (
            <BottomNav currentStore={currentStore}
              onStoreChange={(store) => {
                setNavDirection('fade');
                setCurrentStore(store);
                navigate(store === 'general' ? '/tienda-general' : '/');
              }}
            />
          )}

          <AdminLogin open={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
          {/* Indicador de guardado: visible para admin en /admin (no molesta a clientes) */}
          {isAdmin && isAdminRoute && <SaveIndicator visible={true} />}
          {/* Drawer del carrito: solo se renderiza en rutas de cliente */}
          {!isAdminRoute && <CartDrawer />}
        </div>
      </ClickSpark>
    </>
    </CartProvider>
  );
}