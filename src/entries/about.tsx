import { createRoot } from 'react-dom/client';
import '../index.css';
import { AboutPage } from '../pages/AboutPage';

function mount() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(<AboutPage />);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
