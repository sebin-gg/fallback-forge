import { NavLink, Route, Routes, Link } from 'react-router';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Schedule from './pages/Schedule.jsx';

export default function App() {
  return (
    <>
      <header>
        <div className="container">
          <Link to="/" className="site-brand" aria-label="DevDay Exchange home">
            <span className="site-brand-icon" aria-hidden="true">
              ⚡
            </span>
            <span className="site-brand-name">DevDay Exchange</span>
          </Link>
          <div className="header-right">
            <nav aria-label="Main">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/schedule">Schedule</NavLink>
              <NavLink to="/register">Register</NavLink>
            </nav>
            <a className="btn-lite" href="/lite/" data-ff-switch>
              ⚡ Lite mode
            </a>
          </div>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer>
        <div className="footer-inner">
          <span>© 2026 DevDay Exchange Community</span>
          <div className="footer-links">
            <a href="mailto:hello@example.com">Contact</a>
            <a href="/lite/" data-ff-switch>
              Lightweight version
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
