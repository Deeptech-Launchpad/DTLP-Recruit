const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'recruit_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: process.env.DB_PORT || 5432,
});


const attachmentsDir = path.join(__dirname, 'frontend', 'Attachments');

async function migrate() {
    try {
        console.log('Starting migration of attachments to database...');

        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attachment_files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(500) UNIQUE NOT NULL,
                file_data BYTEA NOT NULL,
                mime_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table attachment_files is ready.');
        
        if (!fs.existsSync(attachmentsDir)) {
            console.log('Attachments directory not found. Nothing to migrate.');
            return;
        }

        const files = fs.readdirSync(attachmentsDir);
        console.log(`Found ${files.length} files in Attachments folder.`);

        for (const filename of files) {
            const filePath = path.join(attachmentsDir, filename);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            try {
                const fileData = fs.readFileSync(filePath);
                const mimeType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

                const query = 'INSERT INTO attachment_files (filename, file_data, mime_type) VALUES ($1, $2, $3) ON CONFLICT (filename) DO NOTHING';
                await pool.query(query, [filename, fileData, mimeType]);
                console.log(`Migrated: ${filename}`);
            } catch (fileErr) {
                console.error(`Error migrating ${filename}:`, fileErr.message);
            }
        }

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
