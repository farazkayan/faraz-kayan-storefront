import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';

export default function App() {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    if (pathname === '/about' || pathname === '/about.html') {
      return <AboutPage />;
    }
    if (pathname === '/faq' || pathname === '/faq.html') {
      return <FaqPage />;
    }
  }
  return <HomePage />;
}
