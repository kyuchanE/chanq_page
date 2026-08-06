\set ON_ERROR_STOP on

SELECT
  rolname,
  rolsuper,
  rolcreatedb,
  rolcreaterole,
  rolinherit,
  rolreplication,
  rolbypassrls,
  rolconnlimit
FROM pg_roles
WHERE rolname IN (:'development_role', :'test_role')
ORDER BY rolname;

SELECT datname, datacl
FROM pg_database
WHERE datname IN (:'development_database', :'test_database')
ORDER BY datname;
