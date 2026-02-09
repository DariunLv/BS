// src/App.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import CatalogPage from './pages/CatalogPage';
import CategoryPage from './pages/CategoryPage';
import SecondStorePage from './pages/SecondStorePage';
import SecondStoreCategoryPage from './pages/SecondStoreCategoryPage';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './components/AdminLogin';
import ClickSpark from './components/ClickSpark';
import Particles from './components/Particles';
import FloatingHearts from './components/FloatingHearts';
import SparkleTrail from './components/SparkleTrail';
import BottomNav from './components/BottomNav';
import { loadStore, saveStore } from './utils/store';
import { loadFromFirebase } from './utils/firebase';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [storeData, setStoreData] = useState(() => loadStore());
  const [currentStore, setCurrentStore] = useState('jewelry');
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshData = useCallback(() => {
    setStoreData(loadStore());
  }, []);

  // Cargar datos de Firebase al iniciar
  useEffect(() => {
    loadFromFirebase().then((firebaseData) => {
      if (firebaseData) {
        saveStore(firebaseData);
        refreshData();
      }
    });
  }, []);

  // Scroll arriba y refrescar en cada cambio de ruta
  useEffect(() => {
    refreshData();
    window.scrollTo(0, 0);
  }, [location.pathname, refreshData]);

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
          <Particles
            particleCount={50}
            colors={['#f76707', '#1a2744', '#d4a574', '#ff922b', '#2c4a80']}
            speed={0.25}
            opacity={0.07}
            minSize={1}
            maxSize={2.5}
            connectDistance={120}
          />
          <FloatingHearts count={10} opacity={0.04} />
          <SparkleTrail color="#f76707" size={3.5} density={0.25} />
        </>
      )}

      <ClickSpark sparkColor="#f76707" sparkSize={12} sparkRadius={22} sparkCount={10} duration={500}>
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {!isAdminRoute && (
            <Header onLogoClick={handleLogoClick} currentStore={currentStore} onStoreChange={setCurrentStore} />
          )}

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <CatalogPage storeData={storeData}
                  onNavigateCategory={(catId) => navigate(`/categoría/${catId}`)}
                  onNavigateSecondStore={() => navigate('/tienda-general')}
                />
              } />
              <Route path="/categoría/:categoryId" element={<CategoryPage storeData={storeData} />} />
              <Route path="/tienda-general" element={
                <SecondStorePage storeData={storeData}
                  onNavigateCategory={(catId) => navigate(`/tienda-general/categoría/${catId}`)}
                  onBack={() => navigate('/')}
                />
              } />
              <Route path="/tienda-general/categoría/:categoryId"
                element={<SecondStoreCategoryPage storeData={storeData} onBack={() => navigate('/tienda-general')} />}
              />
              {isAdmin && (
                <Route path="/admin/*"
                  element={<AdminPanel storeData={storeData} onRefresh={refreshData} onLogout={handleLogout} />}
                />
              )}
            </Routes>
          </AnimatePresence>

          {!isAdminRoute && (
            <BottomNav currentStore={currentStore}
              onStoreChange={(store) => { setCurrentStore(store); navigate(store === 'general' ? '/tienda-general' : '/'); }}
            />
          )}

          <AdminLogin open={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
        </div>
      </ClickSpark>
    </>
  );
}