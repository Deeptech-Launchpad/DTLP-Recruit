const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Connect to the default 'postgres' database first
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres', // Connect to default DB
        password: process.env.DB_PASSWORD || 'root',
        port: process.env.DB_PORT || 5432,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL (postgres database).');
        
        const dbName = process.env.DB_NAME || 'recruit_db';
        
        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        
        if (res.rowCount === 0) {
            console.log(`Database "${dbName}" does not exist. Creating it...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created successfully!`);
        } else {
            console.log(`Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('❌ Error creating database:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
