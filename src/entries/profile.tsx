import { createRoot } from 'react-dom/client';
import '../index.css';
import { HomePage } from '../pages/HomePage';

function mount() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(<HomePage />);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
