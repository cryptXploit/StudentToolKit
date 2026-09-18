import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Set native status bar style on load
if (Capacitor.isNativePlatform()) {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(console.error);
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: isDark ? '#020617' : '#f8fafc' }).catch(console.error);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
