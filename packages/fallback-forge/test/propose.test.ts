import { describe, expect, it } from 'vitest';
import { proposeActions, sampleValue, slug } from '../src/inspect/propose.js';
import { homePage, registerPage } from './fixtures.js';

describe('proposeActions', () => {
  it('proposes heading text, key definition terms, nav links and forms', () => {
    const actions = proposeActions(
      [homePage, registerPage],
      [{ method: 'POST', url: '/api/register', file: 'src/x.jsx' }],
    );
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('home-heading');
    expect(ids).toContain('home-registration-closes');
    expect(ids).toContain('home-nav-schedule');
    expect(ids).toContain('home-nav-register');
    expect(ids).not.toContain('home-nav-home');
    const form = actions.find((a) => a.type === 'form');
    expect(form).toMatchObject({
      route: '/register',
      endpoint: '/api/register',
      method: 'POST',
      fields: { name: 'Test User', email: 'test@example.com', team: '1' },
    });
    expect(form?.success).toMatch(/^TODO/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leaves the endpoint as TODO when it cannot be inferred', () => {
    const [form] = proposeActions([registerPage], []).filter((a) => a.type === 'form');
    expect(form?.endpoint).toMatch(/^TODO/);
  });
});

describe('helpers', () => {
  it('sampleValue picks type-appropriate values', () => {
    expect(sampleValue({ name: 'email', type: 'email', label: '', required: true })).toBe(
      'test@example.com',
    );
    expect(sampleValue({ name: 'fullName', type: 'text', label: '', required: true })).toBe(
      'Test User',
    );
    expect(sampleValue({ name: 'count', type: 'number', label: '', required: false })).toBe('1');
  });

  it('slug', () => {
    expect(slug('/')).toBe('home');
    expect(slug('/register')).toBe('register');
    expect(slug('Registration closes!')).toBe('registration-closes');
  });
});
