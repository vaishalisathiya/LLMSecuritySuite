-- Run after 001_add_user_auth_columns.sql on an existing DB that already has seed users without passwords.
-- Password for all rows below: devpass123 (local lab only).

UPDATE users SET username = 'mazin', password_hash = '$2b$12$45kb6bcjPar8JGstPpgGduHf2ph9UqvWtm83wyvmemTZ5zilDtFGK'
  WHERE email = 'mazin@test.com';
UPDATE users SET username = 'vaishali', password_hash = '$2b$12$45kb6bcjPar8JGstPpgGduHf2ph9UqvWtm83wyvmemTZ5zilDtFGK'
  WHERE email = 'vaishali@test.com';
UPDATE users SET username = 'earl', password_hash = '$2b$12$45kb6bcjPar8JGstPpgGduHf2ph9UqvWtm83wyvmemTZ5zilDtFGK'
  WHERE email = 'earl@test.com';

INSERT INTO users (tenant_id, name, username, email, password_hash, role)
VALUES (1, 'Local Dev', 'dev', 'dev@localhost', '$2b$12$45kb6bcjPar8JGstPpgGduHf2ph9UqvWtm83wyvmemTZ5zilDtFGK', 'admin')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;
