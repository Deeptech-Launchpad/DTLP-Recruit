const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require('pg');

// 1. Database Connection Config
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recruit_db',
    password: 'admin123', // Change if your password is different
    port: 5432,
});

// 2. CSV file path
const csvFilePath = 'candidates_export.csv'; // Zoho Recruit la irunthu export panna file name

async function migrateData() {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL for Migration...');

    const results = [];

    // CSV file read pandrom
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Found ${results.length} records in CSV. Migrating to database...`);
            
            let successCount = 0;
            let errorCount = 0;

            for (const row of results) {
                try {
                    // CSV column names unga export file ku etha mari mathikonga.
                    // Example: Zoho export la "First Name" nu iruntha, inga row["First Name"] nu podanum.
                    const firstName = row['First Name'] || '';
                    const lastName = row['Last Name'] || '';
                    const email = row['Email'] || '';
                    const mobile = row['Mobile'] || '';
                    const phone = row['Phone'] || '';
                    const city = row['City'] || '';
                    const state = row['State'] || '';
                    const country = row['Country'] || '';
                    const experience = row['Experience in Years'] ? parseInt(row['Experience in Years']) : 0;
                    const jobTitle = row['Job Title'] || row['Current Job Title'] || '';
                    const employer = row['Current Employer'] || '';
                    const expectedSalary = row['Expected Salary'] || '';
                    const currentSalary = row['Current Salary'] || '';
                    const status = row['Candidate Status'] || 'New';
                    const source = row['Source'] || '';
                    
                    // JSONB fields kaana dummy or empty values default ah set pandrom
                    const skills = [];
                    const education = [];
                    const experienceList = [];
                    const attachments = [];
                    const notes = [];

                    const insertQuery = `
                        INSERT INTO candidates 
                        ("firstName", "lastName", email, mobile, phone, city, state, country, 
                         experience, "jobTitle", employer, "expectedSalary", "currentSalary", 
                         status, source, skills, education, "experienceList", attachments, notes) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                    `;
                    
                    const params = [
                        firstName, lastName, email, mobile, phone, city, state, country, 
                        experience, jobTitle, employer, expectedSalary, currentSalary, 
                        status, source, JSON.stringify(skills), JSON.stringify(education), 
                        JSON.stringify(experienceList), JSON.stringify(attachments), JSON.stringify(notes)
                    ];

                    await client.query(insertQuery, params);
                    successCount++;
                } catch (err) {
                    console.error(`Error inserting row for email ${row['Email']}:`, err.message);
                    errorCount++;
                }
            }

            console.log(`\nMigration Completed!`);
            console.log(`✅ Success: ${successCount}`);
            console.log(`❌ Failed: ${errorCount}`);
            
            client.release();
            process.exit(0);
        });
}

migrateData().catch(err => console.error(err));
