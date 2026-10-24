import { describe, expect, it } from 'vitest';
import { findEndpoints, findRoutes } from '../src/inspect/source-scan.js';

describe('findRoutes', () => {
  it('finds JSX Route paths, object paths and index routes; skips dynamic ones', () => {
    const src = `
      <Routes>
        <Route index element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="register" element={<Register />} />
        <Route path="/teams/:id" element={<Team />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      const routes = [{ path: '/about', element: <About /> }];
    `;
    expect(findRoutes(src).sort()).toEqual(['/', '/about', '/register', '/schedule']);
  });
});

describe('findEndpoints', () => {
  it('extracts fetch and axios calls with methods', () => {
    const src = `
      fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      fetch("/api/health")
      axios.post('/api/other')
      fetch(dynamicUrl)
      fetch('relative/path')
    `;
    expect(findEndpoints(src)).toEqual([
      { method: 'POST', url: '/api/register' },
      { method: 'GET', url: '/api/health' },
      { method: 'POST', url: '/api/other' },
    ]);
  });
});
