# Security Practices

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
