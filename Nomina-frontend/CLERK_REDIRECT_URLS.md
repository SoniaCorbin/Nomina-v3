# Clerk — Redirect URLs to allow

Add these **exact** URLs in the [Clerk Dashboard](https://dashboard.clerk.com) under **Configure → Paths** (or **Domains / Allowed redirect URLs**, depending on your Clerk project).

## Production (Vercel)

| URL | Purpose |
|-----|---------|
| `https://nomina-v3.vercel.app/login` | Sign-in page |
| `https://nomina-v3.vercel.app/sso-callback` | OAuth / 2FA callback after sign-in |

## Development (local)

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/sso-callback` | OAuth / 2FA callback (Vite dev server) |

---

**Verification checklist**

- [ ] `https://nomina-v3.vercel.app/login` is in the allowlist
- [ ] `https://nomina-v3.vercel.app/sso-callback` is in the allowlist
- [ ] `http://localhost:5173/sso-callback` is in the allowlist

If you use Clerk MCP or the Clerk API, you can verify/update these same URLs there.
