import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { applyTheme, config } from './lib/config';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import './styles/index.css';

applyTheme(config);

// Set document title from config
document.title = config.site.title;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
