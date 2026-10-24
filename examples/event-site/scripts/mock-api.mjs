import crypto from 'node:crypto';

function parseBody(contentType, body) {
  try {
    if (contentType.includes('application/json')) {
      return JSON.parse(body || '{}');
    }
    const params = new URLSearchParams(body);
    return Object.fromEntries(params.entries());
  } catch {
    return {};
  }
}

function sendRegisterResponse(res, isValid, message, wantsHtml) {
  res.statusCode = isValid ? 200 : 400;
  res.setHeader('Cache-Control', 'no-store');

  if (wantsHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Registration</title></head><body><p>${message}</p><p><a href="/register">Back</a></p></body></html>`,
    );
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  const data = isValid
    ? { ok: true, message, id: crypto.randomBytes(8).toString('hex') }
    : { ok: false, message };
  res.end(JSON.stringify(data));
}

function handleRegister(req, res, body) {
  const contentType = req.headers['content-type'] || '';
  const parsed = parseBody(contentType, body);

  const name = (parsed.name || '').trim();
  const email = (parsed.email || '').trim();
  const isValid = Boolean(name && email);

  const message = isValid
    ? 'Registered! Check your email for confirmation.'
    : 'Name and email are required.';

  const accept = req.headers['accept'] || '';
  const wantsHtml = accept.includes('text/html') && !accept.includes('application/json');

  sendRegisterResponse(res, isValid, message, wantsHtml);
}

export function mockApi() {
  function middleware(req, res, next) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (!url.pathname.startsWith('/api/')) {
      return next();
    }

    if (url.pathname === '/api/health' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (url.pathname === '/api/register' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => handleRegister(req, res, body));
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ ok: false, message: 'Not found' }));
  }

  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
