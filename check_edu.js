const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'recruit_db', password: 'admin123', port: 5432 });

pool.query(`SELECT id, "firstName", notes FROM candidates WHERE notes != '[]' AND notes IS NOT NULL LIMIT 3`)
  .then(r => {
    r.rows.forEach(row => {
      const notes = typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes;
      console.log(`\n[${row.id}] ${row.firstName} - Notes:`);
      console.log(JSON.stringify(notes, null, 2));
    });
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
