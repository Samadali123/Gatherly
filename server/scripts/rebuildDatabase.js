const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const force = process.argv.includes('--force');
const knownTables = [
  'blocks',
  'follows',
  'anon_polls',
  'anon_messages',
  'anon_participants',
  'anon_rooms',
  'calls',
  'statuses',
  'reactions',
  'polls',
  'groups',
  'messages',
  'password_reset_tokens',
  'users',
];

const normalizeDatabaseUrl = (value = '') => value.replace(/\s+/g, '').trim();

const readMigration = (folder) =>
  fs.readFileSync(path.resolve(__dirname, `../prisma/migrations/${folder}/migration.sql`), 'utf8');

const run = async () => {
  if (!force) {
    throw new Error('This rebuild clears Gatherly app tables. Run: npm run db:rebuild -- --force');
  }

  const connectionString = normalizeDatabaseUrl(process.env.DIRECT_URL || process.env.DATABASE_URL || '');
  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL is missing in server/.env');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();

  try {
    await client.query('begin');
    await client.query(
      `drop table if exists ${knownTables.map((table) => `"public"."${table}"`).join(', ')} cascade`
    );
    await client.query(readMigration('20260508123000_init_supabase'));
    await client.query(readMigration('20260509143000_social_auth_upgrade'));
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }

  const { rows } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any($1::text[])
    order by table_name
  `, [knownTables]);

  await client.end();
  console.log(`Database rebuilt. ${rows.length} Gatherly tables are ready.`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
