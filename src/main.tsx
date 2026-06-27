import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import i18n from './i18n';
import App from './App';
import '@xyflow/react/dist/style.css';
import './styles/global.css';

document.title = i18n.t('appTitle', { ns: 'common' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
