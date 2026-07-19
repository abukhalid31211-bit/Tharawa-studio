# Security Policy - Tharwah Capital

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@tharwah.com**

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 24 hours and work with you to fix the issue.

## Security Measures Implemented (v2.0)

### Authentication & Authorization
- ✅ **No hardcoded credentials** - All admin credentials via ENV
- ✅ **Password hashing** - PBKDF2 with SHA-256, 100k iterations + salt
- ✅ **Secure session storage** - Encrypted + signed + expiry (8h admin, 24h client)
- ✅ **Rate limiting** - 5 attempts / 15min, 30min block
- ✅ **Supabase Auth** - JWT-based with RLS policies
- ✅ **RLS Policies** - Row Level Security on all tables

### Data Protection
- ✅ **Input sanitization** - XSS prevention, CSV injection prevention
- ✅ **Obfuscation** - localStorage data obfuscated (not plain JSON)
- ✅ **Validation** - Zod schemas for all inputs
- ✅ **Audit logs** - Immutable audit trail

### Infrastructure
- ✅ **Security headers** - CSP, HSTS, X-Frame-Options, etc.
- ✅ **CORS** - Restricted to allowed origins
- ✅ **Rate limiting** - API rate limiting 100 req/min
- ✅ **HTTPS only** - Enforced in production

### Code Security
- ✅ **No `dangerouslySetInnerHTML`** without sanitization
- ✅ **No `eval()`**
- ✅ **Dependencies audited** - `npm audit`

## Security Checklist for Production Deployment

Before deploying to production, ensure:

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
- [ ] `VITE_SUPER_ADMIN_EMAIL` set to real admin email
- [ ] `VITE_SUPER_ADMIN_PASSWORD_HASH` and `SALT` generated via `npm run hash-password`
- [ ] `VITE_SESSION_SECRET` set to random 64+ char string
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set server-side only
- [ ] No `.env.local` committed to Git
- [ ] Supabase RLS enabled and tested
- [ ] Sentry DSN configured for error monitoring
- [ ] All `console.log` removed from production code
- [ ] Security headers verified

## Known Limitations (to be addressed)

- File uploads not yet implemented with virus scanning
- 2FA not yet implemented (planned for v2.1)
- Web Application Firewall (WAF) to be added via Cloudflare/Vercel

## Compliance

- **PDPL** (Saudi Personal Data Protection Law) - Privacy policy implemented
- **CMA** - Licensed financial platform (disclaimer)
- Data retention: Audit logs 90 days, login attempts 30 days

## Security Updates

| Version | Date | Fixes |
|---------|------|-------|
| 2.0.0 | 2026-07-19 | Complete security overhaul: removed hardcoded creds, added hashing, RLS, secure storage |
| 1.0.0 | 2026-07-19 | Initial version with vulnerabilities (deprecated) |

---

**Last updated:** 2026-07-19
**Security contact:** security@tharwah.com
