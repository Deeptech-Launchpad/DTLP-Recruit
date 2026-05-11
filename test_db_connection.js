const { Client } = require('pg');

async function testConnection(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`✅ Success with config: user=${config.user}, password=${config.password}`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`❌ Failed with config: user=${config.user}, password=${config.password ? '****' : '(none)'} - ${err.message}`);
        return false;
    }
}

async function run() {
    const os = require('os');
    const currentUser = os.userInfo().username;
    
    const configs = [
        { user: 'postgres', password: 'admin123', host: 'localhost', port: 5432, database: 'postgres' },
        { user: 'postgres', password: 'root', host: 'localhost', port: 5432, database: 'postgres' },
        { user: 'postgres', password: '123456', host: 'localhost', port: 5432, database: 'postgres' },
        { user: currentUser, password: '', host: 'localhost', port: 5432, database: 'postgres' },
        { user: currentUser, password: 'admin123', host: 'localhost', port: 5432, database: 'postgres' },
        { user: 'postgres', password: 'Postgres@123', host: 'localhost', port: 5432, database: 'postgres' },
    ];

    for (const config of configs) {
        if (await testConnection(config)) break;
    }
}

run();
