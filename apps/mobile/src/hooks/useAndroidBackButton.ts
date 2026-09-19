import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useAndroidBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', () => {
      const isRootRoute = ['/', '/tools', '/planner', '/profile'].includes(location.pathname);
      
      if (isRootRoute) {
        App.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove()).catch(console.error);
    };
  }, [location, navigate]);
}
