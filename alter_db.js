const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'recruit_db', password: 'admin123', port: 5432 });

pool.query('ALTER TABLE candidates ADD COLUMN "modifiedTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;')
    .then(() => {
        console.log('Altered table successfully');
        process.exit(0);
    })
    .catch(e => {
        if (e.code === '42701') {
            console.log('Column already exists');
        } else {
            console.error('Error:', e);
        }
        process.exit(0);
    });
