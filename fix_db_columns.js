require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'recruit_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: process.env.DB_PORT || 5432,
});

async function fixTable() {
    const client = await pool.connect();
    try {
        console.log('Checking for missing columns in "candidates" table...');
        
        // Add "createdBy" if missing
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='createdBy') THEN
                    ALTER TABLE candidates ADD COLUMN "createdBy" VARCHAR(255);
                    RAISE NOTICE 'Added column createdBy';
                END IF;
            END $$;
        `);

        // Add "modifiedBy" if missing
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='modifiedBy') THEN
                    ALTER TABLE candidates ADD COLUMN "modifiedBy" VARCHAR(255);
                    RAISE NOTICE 'Added column modifiedBy';
                END IF;
            END $$;
        `);

        console.log('Database table "candidates" updated successfully!');
    } catch (err) {
        console.error('Error updating database:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixTable();
