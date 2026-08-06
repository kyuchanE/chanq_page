\set ON_ERROR_STOP on

SELECT format(
  'REVOKE CONNECT, CREATE, TEMPORARY ON DATABASE %I FROM PUBLIC',
  :'database_name'
) \gexec

SELECT format(
  'GRANT CONNECT, CREATE, TEMPORARY ON DATABASE %I TO %I',
  :'database_name',
  :'owner_role'
) \gexec

SELECT format(
  'REVOKE ALL PRIVILEGES ON DATABASE %I FROM %I',
  :'database_name',
  :'blocked_role'
) \gexec

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

SELECT format('REVOKE ALL PRIVILEGES ON SCHEMA public FROM %I', :'blocked_role') \gexec
SELECT format('REVOKE CREATE ON SCHEMA public FROM %I', :'application_role') \gexec
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'application_role') \gexec

SELECT format(
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
  :'blocked_role'
) \gexec

SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
  :'application_role'
) \gexec

SELECT format(
  'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
  :'blocked_role'
) \gexec

SELECT format(
  'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'application_role'
) \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
  :'owner_role',
  :'application_role'
) \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
  :'owner_role',
  :'application_role'
) \gexec

SELECT format(
  'GRANT CONNECT ON DATABASE %I TO %I',
  :'database_name',
  :'application_role'
) \gexec
