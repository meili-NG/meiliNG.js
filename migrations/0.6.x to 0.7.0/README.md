<h1 align="center">Upgrading Meiling Gatekeeper (a.k.a. meiliNG) to 0.7.0</h1>

0.7.0 introduces various breaking changes, which is caused by misuse of `Authorization` and `Authentication` term in Database Schema and prisma database structure. Due to this, 0.7.0 requires an database migration due to this table name change.

## How to apply migration
```bash
cat "0.6.x to 0.7.0.sql" | mysql -D database_name
```
