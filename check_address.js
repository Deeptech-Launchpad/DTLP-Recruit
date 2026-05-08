const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'recruit_db', password: 'admin123', port: 5432 });

// Search for the candidate with mobile matching what we saw in the screenshot
pool.query(`SELECT id, "firstName", "lastName", mobile, address1, city, state, "pinCode", country FROM candidates WHERE mobile LIKE '%63743%' OR mobile LIKE '%6374331755%'`)
  .then(r => {
    console.log('Candidate by mobile:');
    console.log(JSON.stringify(r.rows, null, 2));
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
