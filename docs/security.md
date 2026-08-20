# Qasr Al Mabrook - Security Requirements

## 1. Authentication

Admin authentication must use secure:

- Password hashing
- Session management
- Cookie configuration
- Expiration
- Revocation

Do not implement authentication solely in client-side JavaScript.

## 2. Authorization

Roles:

- Super Admin
- Admin

Every protected mutation must perform server-side authorization.

Never trust:

- Client-side role state
- Hidden form fields
- URL parameters
- UI visibility

## 3. Passwords

Use a modern password hashing algorithm supported by the chosen authentication implementation.

Never log passwords or password hashes.

## 4. Sessions

Use:

- HttpOnly cookies
- Secure cookies in production
- SameSite protection
- Expiration
- Session revocation

## 5. Input Validation

Validate:

- Forms
- Search parameters
- IDs
- Slugs
- Attribute values
- Variant combinations
- Admin mutations
- Upload metadata

Use a shared validation library/pattern consistently.

## 6. SQL

All database access must use parameterized Drizzle queries.

Never concatenate user-controlled SQL.

## 7. XSS

Treat product descriptions and CMS content as untrusted input.

Avoid rendering raw HTML unless:

- Explicitly required,
- Sanitized,
- And restricted to approved markup.

## 8. CSRF

Protect state-changing endpoints according to the selected authentication/session architecture.

## 9. Rate Limiting

Apply rate limits to:

- Login
- Quote submission
- Contact form
- Sensitive admin actions
- Potentially expensive search endpoints

## 10. Spam Protection

Request Quote and contact forms should have an abuse mitigation strategy.

Possible layers:

- Rate limiting
- Honeypot
- CAPTCHA/Turnstile if needed
- Email validation
- Server-side anomaly checks

Do not add intrusive CAPTCHA by default if lighter controls are sufficient.

## 11. Upload Security

Validate:

- MIME type
- File extension
- File size
- Image dimensions
- Actual file signature where appropriate

Do not trust client-provided MIME type.

## 12. Secrets

Never commit:

- Database passwords
- R2 keys
- Auth secrets
- Email credentials

Use environment variables/secrets management.

## 13. Logging

Do not log:

- Passwords
- Session tokens
- Sensitive customer data unnecessarily

Admin/audit events may be logged where useful.

## 14. Security Headers

Configure appropriate headers including:

- Content-Security-Policy strategy
- Referrer-Policy
- X-Content-Type-Options
- Permissions-Policy
- Frame protections as appropriate

Do not blindly copy a CSP without testing required assets.

## 15. Dependency Security

Keep dependencies updated and review security advisories.

## 16. Database

Use least-privilege database credentials where operationally possible.

Production migrations should be controlled and versioned.
