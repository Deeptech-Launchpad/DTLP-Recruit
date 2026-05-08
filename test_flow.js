const http = require('http');
const fs = require('fs');

const jwtToken = 'dummy_token'; // We might need a real token if endpoints are protected. Wait, the API doesn't fully enforce token for candidate creation if the frontend bypasses it or sends a default? Let's check server.js.

// Actually, it's easier to use the pg Pool to test DB operations, but testing API is closer to the UI.
// Let's test the database layer to ensure the structure holds up.

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recruit_db',
    password: 'admin123',
    port: 5432,
});

async function runTest() {
    try {
        console.log('--- STARTING SAMPLE DATA TEST ---');

        // 1. Insert Candidate
        const insertQuery = `
            INSERT INTO candidates (
                "firstName", "lastName", email, source, owner, status,
                attachments, notes, "createdBy", "modifiedBy"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING id;
        `;
        const initialNotes = [{
            id: Date.now(),
            title: "Test Note",
            body: "This is a sample test note for verification.",
            author: "System Test",
            authorInitials: "S",
            date: new Date().toLocaleDateString('en-GB')
        }];
        
        const pdfData = fs.readFileSync('sample_resume.pdf');
        
        // Save PDF to attachment_files
        const fileInsertQuery = `
            INSERT INTO attachment_files (filename, file_data, mime_type)
            VALUES ($1, $2, $3) RETURNING id
        `;
        const filename = 'sample_resume_' + Date.now() + '.pdf';
        await pool.query(fileInsertQuery, [filename, pdfData, 'application/pdf']);
        
        const initialAttachments = [{
            filename: filename,
            attachedBy: "System Test",
            date: new Date().toLocaleDateString('en-GB'),
            size: "1 KB",
            category: "Zrecruit_Resume",
            content: `/api/attachments/file/${filename}`
        }];

        const params = [
            'SampleTest', 'Candidate', 'sample@test.com', 'Added by User', 'Jey M', 'New',
            JSON.stringify(initialAttachments), JSON.stringify(initialNotes), 'System Test', 'System Test'
        ];

        const res = await pool.query(insertQuery, params);
        const candidateId = res.rows[0].id;
        console.log(`Successfully created Sample Candidate with ID: ${candidateId}`);

        // 2. Verify Data
        const verify = await pool.query('SELECT * FROM candidates WHERE id = $1', [candidateId]);
        const c = verify.rows[0];
        console.log(`\nVerified Data:`);
        console.log(`Name: ${c.firstName} ${c.lastName}`);
        console.log(`Email: ${c.email}`);
        console.log(`Owner: ${c.owner}`);
        console.log(`Status: ${c.status}`);
        console.log(`Source: ${c.source}`);
        console.log(`Notes Count: ${c.notes.length} -> Title: ${c.notes[0].title}`);
        console.log(`Attachments Count: ${c.attachments.length} -> Filename: ${c.attachments[0].filename}`);

        // 3. Delete Sample Data (Cleanup)
        console.log(`\nCleaning up sample data...`);
        await pool.query('DELETE FROM candidates WHERE id = $1', [candidateId]);
        await pool.query('DELETE FROM attachment_files WHERE filename = $1', [filename]);
        console.log('Cleanup successful.');

        pool.end();
    } catch (err) {
        console.error('Test failed:', err);
        pool.end();
    }
}

runTest();
