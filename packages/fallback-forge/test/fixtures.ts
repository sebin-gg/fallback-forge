import type { InspectedPage, ResolvedConfig } from '../src/types.js';
import { resolveConfig } from '../src/config.js';

export const homePage: InspectedPage = {
  route: '/',
  title: 'DevDay Exchange Kochi',
  description: 'A hackathon.',
  blocks: [
    {
      kind: 'nav',
      links: [
        { text: 'Home', href: '/', internal: true },
        { text: 'Schedule', href: '/schedule', internal: true },
        { text: 'Register', href: '/register', internal: true },
      ],
    },
    { kind: 'heading', level: 1, text: 'DevDay Exchange Community Hackathon: Kochi' },
    { kind: 'paragraph', text: 'Build anything. Ship by morning.' },
    { kind: 'image', alt: 'Hackathon hall' },
    { kind: 'heading', level: 2, text: 'Event details' },
    {
      kind: 'definitions',
      items: [
        { term: 'Venue', detail: 'JAIN University, Kochi' },
        { term: 'Registration closes', detail: '9 October 2026, 11:59 PM IST' },
      ],
    },
    { kind: 'link', link: { text: 'Register now', href: '/register', internal: true } },
    { kind: 'widget', tag: 'svg', label: 'Participants by track' },
    {
      kind: 'nav',
      links: [{ text: 'Home', href: '/', internal: true }],
    },
  ],
  links: [
    { text: 'Home', href: '/', internal: true },
    { text: 'Schedule', href: '/schedule', internal: true },
    { text: 'Register', href: '/register', internal: true },
    { text: 'Register now', href: '/register', internal: true },
  ],
  forms: [],
};

export const registerPage: InspectedPage = {
  route: '/register',
  title: 'Register',
  description: '',
  blocks: [
    { kind: 'heading', level: 1, text: 'Register' },
    {
      kind: 'form',
      form: {
        id: 'register',
        method: 'GET',
        submitText: 'Register',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'email', type: 'email', label: 'Email', required: true },
          {
            name: 'team',
            type: 'select',
            label: 'Team size',
            required: false,
            options: [
              { value: '1', label: 'Solo' },
              { value: '2', label: 'Team of 2' },
            ],
          },
          { name: 'notes', type: 'textarea', label: 'Notes', required: false },
        ],
      },
    },
  ],
  links: [],
  forms: [],
};
registerPage.forms = [(registerPage.blocks[1] as { kind: 'form'; form: never }).form];

export function testConfig(
  overrides: Partial<Parameters<typeof resolveConfig>[0]> = {},
): ResolvedConfig {
  return resolveConfig(
    {
      siteName: 'Test Site',
      routes: ['/', '/register'],
      essentialActions: [
        { id: 'deadline', route: '/', type: 'text', match: '9 October 2026, 11:59 PM IST' },
        { id: 'open-register', route: '/', type: 'link', href: '/register' },
        {
          id: 'submit',
          route: '/register',
          type: 'form',
          endpoint: '/api/register',
          method: 'POST',
          fields: { name: 'T', email: 't@example.com' },
          success: 'Registered!',
        },
      ],
      ...overrides,
    },
    '/proj',
  );
}
