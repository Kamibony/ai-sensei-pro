import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';

console.log("main.jsx: Script loaded, initiating React render...");
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* JEDEN HLAVNÍ ROUTER ZDE */}
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);