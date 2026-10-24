import { NavLink, Route, Routes } from 'react-router';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Schedule from './pages/Schedule.jsx';

export default function App() {
  return (
    <>
      <header>
        <div className="container">
          <nav aria-label="Main">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/schedule">Schedule</NavLink>
            <NavLink to="/register">Register</NavLink>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className="container">
        <p>Contact: hello@example.com</p>
        <p>Organised by the DevDay Exchange community.</p>
      </footer>
    </>
  );
}
