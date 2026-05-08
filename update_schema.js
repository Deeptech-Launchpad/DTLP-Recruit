const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recruit_db',
    password: 'admin123',
    port: 5432,
});

async function updateSchema() {
    try {
        console.log('Adding columns...');
        await pool.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS "createdBy" TEXT');
        await pool.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS "modifiedBy" TEXT');
        
        console.log('Updating existing records...');
        await pool.query('UPDATE candidates SET "createdBy" = \'Jey M\' WHERE "createdBy" IS NULL');
        await pool.query('UPDATE candidates SET "modifiedBy" = \'Jey M\' WHERE "modifiedBy" IS NULL');
        
        console.log('Done!');
        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateSchema();
