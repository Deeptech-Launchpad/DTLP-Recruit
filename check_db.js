const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'recruit_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: process.env.DB_PORT || 5432,
});


async function check() {
    try {
        console.log('--- Database Check ---');
        
        // Check admins
        const admins = await pool.query('SELECT id, username, email FROM admins');
        console.log(`Admins count: ${admins.rowCount}`);
        console.log(admins.rows);

        // Check candidates
        const candidates = await pool.query('SELECT id, "firstName", "lastName", email, attachments, notes FROM candidates LIMIT 5');
        console.log(`\nCandidates sample (first 5): ${candidates.rowCount} found`);
        candidates.rows.forEach(c => {
            console.log(`- ID ${c.id}: ${c.firstName} ${c.lastName} (${c.email})`);
            console.log(`  Notes count: ${c.notes ? c.notes.length : 0}`);
            console.log(`  Attachments count: ${c.attachments ? c.attachments.length : 0}`);
        });

        // Check attachment files storage
        const files = await pool.query('SELECT id, filename, mime_type, LENGTH(file_data) as size FROM attachment_files LIMIT 5');
        console.log(`\nAttachment Files storage sample: ${files.rowCount} found`);
        files.rows.forEach(f => {
            console.log(`- ${f.filename} (${f.mime_type}, ${f.size} bytes)`);
        });

        await pool.end();
    } catch (err) {
        console.error('Database error:', err.message);
    }
}

check();
