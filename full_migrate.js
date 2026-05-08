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

function parseDuration(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return { month: 'Month', year: 'Year' };
    const parts = dateStr.split('-');
    if (parts.length === 2) {
        return { month: parts[0], year: parts[1] };
    }
    return { month: 'Month', year: 'Year' };
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
            const from = parseDuration(e['Duration_From']);
            const to = parseDuration(e['Duration_To']);
            eduMap[id].push({
                institute: e['Institute / School'],
                major: e['Major / Department'],
                degree: e['Degree'],
                durationFrom: e['Duration_From'],
                durationTo: e['Duration_To'],
                fromMonth: from.month,
                fromYear: from.year,
                toMonth: to.month,
                toYear: to.year,
                currentlyPursuing: e['Currently pursuing'] === 'true'
            });
        });

        const expMap = {};
        rawExp.forEach(e => {
            const id = e['Candidate Id'];
            if (!expMap[id]) expMap[id] = [];
            const from = parseDuration(e['Work Duration_From']);
            const to = parseDuration(e['Work Duration_To']);
            expMap[id].push({
                occupation: e['Occupation / Title'],
                company: e['Company'],
                summary: e['Summary'],
                durationFrom: e['Work Duration_From'],
                durationTo: e['Work Duration_To'],
                fromMonth: from.month,
                fromYear: from.year,
                toMonth: to.month,
                toYear: to.year,
                currentlyWorking: e['Currently working'] === 'true'
            });
        });

        const notesMap = {};
        rawNotes.forEach(n => {
            const id = n['Parent Id'];
            if (!notesMap[id]) notesMap[id] = [];
            notesMap[id].push({
                id: Date.now() + Math.random(),
                title: n['Note Title'] || 'Note',
                content: n['Note Content'],
                author: n['Created By'],
                createdAt: n['Created Time']
            });
        });

        const attachMap = {};
        rawAttach.forEach(a => {
            const id = a['Parent Id'];
            if (!attachMap[id]) attachMap[id] = [];
            attachMap[id].push({
                filename: a['File Name'],
                category: a['Category'] || 'Resume',
                dateCreated: a['Created Time'],
                dateModified: a['Modified Time'],
                size: a['Size'],
                attachedBy: a['Created By'],
                modifiedBy: a['Modified By'],
                content: `/api/attachments/file/${a['File Name']}`
            });
        });

        const client = await pool.connect();
        console.log('Connected to DB. Clearing existing data...');
        await client.query('TRUNCATE TABLE candidates RESTART IDENTITY');

        console.log('Inserting records...');

        let count = 0;
        for (const c of rawCandidates) {
            const cId = c['Candidate Id'];
            
            const firstName = c['First Name'] || '';
            const lastName = c['Last Name'] || '';
            const email = c['Email'] || '';
            const mobile = c['Mobile'] || '';
            const phone = c['Phone'] || '';
            const street = c['Street'] || '';
            const pinCode = c['Postal Code'] || '';
            const city = c['City'] || '';
            const state = c['Province'] || '';
            const country = c['Country'] || '';
            const experience = c['Experience in Years'] ? parseInt(c['Experience in Years']) : 0;
            const jobTitle = c['Current Job Title'] || '';
            const employer = c['Current Employer'] || '';
            const status = c['Candidate Status'] || 'New';
            const source = c['Source'] || '';
            const owner = c['Created By'] || '';
            const createdBy = c['Created By'] || '';
            const modifiedBy = c['Modified By'] || '';
            
            // New fields
            const linkedin = c['LinkedIn'] || '';
            const twitter = c['Twitter'] || '';
            const skypeId = c['Skype ID'] || '';
            const secondaryEmail = c['Secondary Email'] || '';
            const additionalInfo = c['Additional Info'] || '';

            const education = eduMap[cId] || [];
            const experienceList = expMap[cId] || [];
            const notes = notesMap[cId] || [];
            const attachments = attachMap[cId] || [];
            const skills = c['Skill Set'] ? c['Skill Set'].split(',').map(s => s.trim()) : [];

            const insertQuery = `
                INSERT INTO candidates 
                ("firstName", "lastName", email, mobile, phone, address1, "pinCode", city, state, country, 
                 experience, "jobTitle", employer, status, source, owner, "createdBy", "modifiedBy",
                 skills, education, "experienceList", attachments, notes, "createdAt", "modifiedTime",
                 linkedin, twitter, "skypeId", "secondaryEmail", "additionalInfo") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
            `;
            
            const params = [
                firstName, lastName, email, mobile, phone, street, pinCode, city, state, country, 
                experience, jobTitle, employer, status, source, owner, createdBy, modifiedBy,
                JSON.stringify(skills), JSON.stringify(education), 
                JSON.stringify(experienceList), JSON.stringify(attachments), JSON.stringify(notes),
                new Date(c['Created Time'] || Date.now()), new Date(c['Modified Time'] || Date.now()),
                linkedin, twitter, skypeId, secondaryEmail, additionalInfo
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
