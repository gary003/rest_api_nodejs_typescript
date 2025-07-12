# Security Practices

<!-- ## Authentication & Authorization

- **JWT with strong algorithms** (RS256, HS512)
- **OAuth2** for third-party integrations
- **Role-based access control** (RBAC) enforced at API/DB levels -->

## Data Protection

- **All inputs sanitized** (Zod for validation, parameterized SQL queries)
- **Secrets management**:
  - Never hardcoded - use environment variables + GitHub Actions secrets
  - Database credentials rotated quarterly
- **Encryption**:
  - TLS 1.2+ enforced (via `helmet()`)
  - Sensitive data encrypted at rest (AES-256)

## API Security

```typescript
// Example security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'trusted.cdn.com']
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true }
  })
)
```
