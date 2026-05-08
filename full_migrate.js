const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recruit_db',
    password: 'admin123',
    port: 5432,
});

const DATA_DIR = path.join(__dirname, 'canditate data');

const FILES = {
    candidates: path.join(DATA_DIR, 'Candidates_001.csv'),
    education: path.join(DATA_DIR, 'Candidates_Educational_Details.csv'),
    experience: path.join(DATA_DIR, 'Candidates_Experience_Details.csv'),
    notes: path.join(DATA_DIR, 'Notes_001.csv'),
    attachments: path.join(DATA_DIR, 'Attachments_001.csv')
};

async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return resolve([]);
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

async function runMigration() {
    try {
        console.log('--- STARTING FULL MIGRATION ---');
        
        console.log('Reading CSV files...');
        const [rawCandidates, rawEdu, rawExp, rawNotes, rawAttach] = await Promise.all([
            readCSV(FILES.candidates),
            readCSV(FILES.education),
            readCSV(FILES.experience),
            readCSV(FILES.notes),
            readCSV(FILES.attachments)
        ]);

        console.log(`Loaded: ${rawCandidates.length} Candidates, ${rawEdu.length} Education, ${rawExp.length} Experience, ${rawNotes.length} Notes, ${rawAttach.length} Attachments.`);

        // Map data by Candidate Id
        const eduMap = {};
        rawEdu.forEach(e => {
            const id = e['Candidate Id'];
            if (!eduMap[id]) eduMap[id] = [];
            eduMap[id].push({
                school: e['Institute / School'],
                major: e['Major / Department'],
                degree: e['Degree'],
                from: e['Duration_From'],
                to: e['Duration_To']
            });
        });

        const expMap = {};
        rawExp.forEach(e => {
            const id = e['Candidate Id'];
            if (!expMap[id]) expMap[id] = [];
            expMap[id].push({
                title: e['Occupation / Title'],
                company: e['Company'],
                summary: e['Summary'],
                from: e['Work Duration_From'],
                to: e['Work Duration_To']
            });
        });

        const notesMap = {};
        rawNotes.forEach(n => {
            const id = n['Parent Id']; // Notes usually use Parent Id
            if (!notesMap[id]) notesMap[id] = [];
            notesMap[id].push({
                id: Date.now() + Math.random(),
                title: n['Note Title'] || 'Note',
                body: n['Note Content'],
                author: n['Created By'],
                date: n['Created Time']
            });
        });

        const attachMap = {};
        rawAttach.forEach(a => {
            const id = a['Parent Id'];
            if (!attachMap[id]) attachMap[id] = [];
            attachMap[id].push({
                filename: a['File Name'],
                category: a['Attachment Category'] || 'Resume',
                date: a['Created Time'],
                size: a['Size'],
                attachedBy: a['Created By'],
                content: `/api/attachments/file/${a['File Name']}`
            });
        });

        const client = await pool.connect();
        console.log('Connected to Database. Inserting records...');

        let count = 0;
        for (const c of rawCandidates) {
            const cId = c['Candidate Id'];
            
            const firstName = c['First Name'] || '';
            const lastName = c['Last Name'] || '';
            const email = c['Email'] || '';
            const mobile = c['Mobile'] || '';
            const phone = c['Phone'] || '';
            const city = c['City'] || '';
            const state = c['Province'] || '';
            const country = c['Country'] || '';
            const experience = c['Experience in Years'] ? parseInt(c['Experience in Years']) : 0;
            const jobTitle = c['Current Job Title'] || '';
            const employer = c['Current Employer'] || '';
            const status = c['Candidate Status'] || 'New';
            const source = c['Source'] || '';
            const owner = c['Created By'] || '';

            const education = eduMap[cId] || [];
            const experienceList = expMap[cId] || [];
            const notes = notesMap[cId] || [];
            const attachments = attachMap[cId] || [];
            const skills = c['Skill Set'] ? c['Skill Set'].split(',').map(s => s.trim()) : [];

            const insertQuery = `
                INSERT INTO candidates 
                ("firstName", "lastName", email, mobile, phone, city, state, country, 
                 experience, "jobTitle", employer, status, source, owner,
                 skills, education, "experienceList", attachments, notes, "createdAt", "modifiedTime") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            `;
            
            const params = [
                firstName, lastName, email, mobile, phone, city, state, country, 
                experience, jobTitle, employer, status, source, owner,
                JSON.stringify(skills), JSON.stringify(education), 
                JSON.stringify(experienceList), JSON.stringify(attachments), JSON.stringify(notes),
                new Date(c['Created Time'] || Date.now()), new Date(c['Modified Time'] || Date.now())
            ];

            await client.query(insertQuery, params);
            count++;
            if (count % 50 === 0) console.log(`Inserted ${count} candidates...`);
        }

        console.log(`\n✅ Migration Completed! ${count} candidates processed.`);
        client.release();
        process.exit(0);

    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

runMigration();
