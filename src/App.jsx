// src/App.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import CatalogPage from './pages/CatalogPage';
import CategoryPage from './pages/CategoryPage';
import SecondStorePage from './pages/SecondStorePage';
import SecondStoreCategoryPage from './pages/SecondStoreCategoryPage';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './components/AdminLogin';
import ClickSpark from './components/ClickSpark';
import FloatingHearts from './components/FloatingHearts';
import SparkleTrail from './components/SparkleTrail';
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';
import { loadStore, setCacheData } from './utils/store';
import { loadFromFirebase } from './utils/firebase';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  // Persistir sesion admin en sessionStorage para que sobreviva refresh
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return sessionStorage.getItem('benito_admin') === 'true'; } catch { return false; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const LOCAL_CACHE_KEY = 'benito_cache_v2';

  // Iniciar con caché local si existe → carga instantánea
  const [storeData, setStoreData] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
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

  // Cargar Firebase en background — si hay caché, el usuario ya ve contenido
  useEffect(() => {
    loadFromFirebase().then((firebaseData) => {
      if (firebaseData) {
        setCacheData(firebaseData);
        setStoreData(loadStore());
        // Guardar en localStorage para la próxima visita
        try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(firebaseData)); } catch {}
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
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
    setIsAdmin(false);
    refreshData();
    navigate('/');
  }, [navigate, refreshData]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && (
        <>
          {/* Fondo animado con orbes de luz (reemplaza canvas de Particles) */}
          <AnimatedBackground />
          <FloatingHearts count={10} opacity={0.04} />
          <SparkleTrail color="#f76707" size={3.5} density={0.25} />
        </>
      )}

      <ClickSpark sparkColor="#f76707" sparkSize={12} sparkRadius={22} sparkCount={10} duration={500}>
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {!isAdminRoute && (
            <Header onLogoClick={handleLogoClick} currentStore={currentStore} onStoreChange={setCurrentStore} onBack={() => setNavDirection('slideRight')} />
          )}

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
        </div>
      </ClickSpark>
    </>
  );
}