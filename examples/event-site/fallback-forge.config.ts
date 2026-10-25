import { defineConfig } from 'fallback-forge/config';

// Essential actions were proposed by `fallback-forge inspect` and then
// reviewed/edited by hand. Each one must keep working in the lightweight
// version under the tested network profiles.
export default defineConfig({
  siteName: 'DevDay Exchange Kochi',
  routes: ['/', '/schedule', '/register'],
  companionBase: '/lite',
  essentialActions: [
    {
      id: 'home-heading',
      description: 'Event name is visible',
      route: '/',
      type: 'text',
      match: 'DevDay Exchange Community Hackathon: Kochi',
    },
    {
      id: 'find-deadline',
      description: 'Registration deadline is readable',
      route: '/',
      type: 'text',
      match: '9 October 2026, 11:59 PM IST',
    },
    {
      id: 'find-venue',
      description: 'Venue is readable',
      route: '/',
      type: 'text',
      match: 'JAIN University, Kochi',
    },
    {
      id: 'open-registration',
      description: 'Registration page is reachable from home',
      route: '/',
      type: 'link',
      href: '/register',
    },
    {
      id: 'open-schedule',
      description: 'Schedule is reachable from home',
      route: '/',
      type: 'link',
      href: '/schedule',
    },
    {
      id: 'schedule-visible',
      description: 'Schedule lists the kick-off session',
      route: '/schedule',
      type: 'text',
      match: 'Kick-off',
    },
    {
      id: 'submit-registration',
      description: 'Test registration can be submitted',
      route: '/register',
      type: 'form',
      endpoint: '/api/register',
      method: 'POST',
      fields: {
        name: 'Test User',
        email: 'test@example.com',
        team: '2',
        track: 'works-anyway',
        notes: 'Submitted by Fallback Forge verify.',
      },
      success: 'Registered! Check your email for confirmation.',
    },
  ],
  detection: {
    slowLoadMs: 1000,
    // The site renders its own branded switch links (header + footer), so the
    // plugin's injected floating pill would only duplicate them.
    manualSwitchLink: false,
  },
  verify: {
    profiles: [
      { name: 'slow-3g', downloadKbps: 400, uploadKbps: 400, latencyMs: 400 },
      { name: 'fast-3g', downloadKbps: 1600, uploadKbps: 750, latencyMs: 150 },
    ],
  },
});
