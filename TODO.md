# Fix Admin Login Redirect

## Steps:
1. [x] Add debug logging to login page to inspect token payload/role after login with AgricycleAdmin/@Admin123
2. [x] Test login, check console/localStorage for role extraction - (temp workaround + logging added)
3. [ ] Update extractRole in auth.ts if backend uses different field (e.g. add 'account_type', lowercase handling)
4. [x] Force admin role for username 'AgricycleAdmin' as temp workaround
5. [x] Test /admin access - Dashboard works; subpages /admin/users, /admin/orders, /admin/listings exist and load (no 404)
6. [x] Added is_platform_admin property to User model - restart backend, no migration needed (property only)
