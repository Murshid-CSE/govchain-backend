# GovChain Security & Trust Guidelines

## 1. Authentication & Session Management
- **Password Storage**: Passwords hashed with `bcryptjs` using 10 salt rounds.
- **JWT Protection**: Signed using `HS256` with strong secrets. Default 24h expiration.
- **Anti-Enumeration**: Consistent error messages for authentication attempts (`"Invalid email or password"`).
- **Brute Force Defense**: Rate limited with `express-rate-limit` (10 attempts per 15 minutes on auth endpoints).

## 2. Authorization & Least Privilege
- Centralized server-side Role-Based Access Control (`authorize('admin', 'official', ...)`).
- Object-level authorization ensures citizens can only update their own draft issues.
- Admin privileges strictly separated: only verified administrators can provision official and moderator accounts.

## 3. Defense Against Common Web Vulnerabilities
- **SQL Injection**: Parameterized queries enforced at all times via Prisma ORM. No raw string interpolation.
- **Cross-Site Scripting (XSS)**: Handled via Helmet security headers and strict input validation via Zod schemas.
- **Denial of Service (DoS)**: Tiered rate limiters (general API, auth, uploads) and payload size restrictions (1MB body limit).
- **Path Traversal**: Uploaded files are renamed using cryptographically random UUIDs (`uuidv4()`). File deliveries are sanitised with `path.basename()`.

## 4. Secret Management
- Zero secrets committed to version control.
- `.gitignore` ignores all `.env*` files except `.env.example`.
- Pre-flight environment validation fails fast on startup if required secrets are absent or weak.
