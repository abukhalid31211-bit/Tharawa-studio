import { describe, expect, it } from 'vitest';
import { sanitizeCsvValue, sanitizeEmail, sanitizeHtml, sanitizeInput } from './security';

describe('security utilities', () => {
  it('normalizes email addresses', () => expect(sanitizeEmail('  ADMIN@Example.COM ')).toBe('admin@example.com'));
  it('removes executable markup from plain input', () => expect(sanitizeInput('<script>javascript:alert(1)</script>')).not.toContain('<'));
  it('escapes HTML output', () => expect(sanitizeHtml('<b>safe</b>')).toContain('&lt;b&gt;'));
  it('prevents spreadsheet formula injection', () => expect(sanitizeCsvValue('=1+1')).toBe("'=1+1"));
});
