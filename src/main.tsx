import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/theme-dark.css';
import './styles/theme-light.css';
import './styles/theme-blue.css';
import './styles/theme-yellow.css';
import './styles/pixel-font.css';
import './locales/i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
