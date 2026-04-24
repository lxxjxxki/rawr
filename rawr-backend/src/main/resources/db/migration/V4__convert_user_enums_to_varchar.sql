-- users 테이블의 enum 컬럼들도 VARCHAR로 변환
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
ALTER TABLE users ALTER COLUMN oauth_provider TYPE VARCHAR(20) USING oauth_provider::text;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS oauth_provider CASCADE;
