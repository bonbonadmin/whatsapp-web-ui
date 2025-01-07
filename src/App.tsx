import React, { useEffect } from "react";
import AppRoutes from "routes";
import useAppLoad from "common/hooks/useAppLoad";
import SplashPage from "pages/splash";

export default function App() {
  const { isLoaded, progress } = useAppLoad();

  useEffect(() => {
    const resetLocalStorage = () => {
      localStorage.clear();
      console.log("✅ Local storage cleared on reload or new tab");
    };
  
    // Clear localStorage on tab reload or new tab
    window.addEventListener('load', resetLocalStorage);
    window.addEventListener('beforeunload', resetLocalStorage);
  
    return () => {
      window.removeEventListener('load', resetLocalStorage);
      window.removeEventListener('beforeunload', resetLocalStorage);
    };
  }, []);

  if (!isLoaded) {
    return <SplashPage progress={progress} />;
  }

  return <AppRoutes />;
}
