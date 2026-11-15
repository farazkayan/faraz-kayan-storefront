import { createRoot } from 'react-dom/client';
import '../index.css';
import { FaqPage } from '../pages/FaqPage';

function mount() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(<FaqPage />);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
