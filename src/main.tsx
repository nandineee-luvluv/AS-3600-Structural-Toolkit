import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('AS 3600 Structural Toolkit - Starting...');

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found!');
  throw new Error('Root element with id="root" not found in HTML');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log('AS 3600 Structural Toolkit - Ready!');
