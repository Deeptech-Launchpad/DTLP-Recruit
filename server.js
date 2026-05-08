const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const JWT_SECRET = 'super_secret_admin_key_123'; // In production, use env variable

const app = express();
const PORT = process.env.PORT || 9002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
// Serve the static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recruit_db',
    password: 'admin123', // TODO: User needs to change this line!
    port: 9001,
});

// Connect and create table if it doesn't exist
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client! Did you change the password in server.js?', err.stack);
    }
    console.log('Connected to the PostgreSQL database.');

    // Create candidates table (PostgreSQL uses SERIAL for auto-increment)
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS candidates (
            id SERIAL PRIMARY KEY,
            "firstName" VARCHAR(255),
            "lastName" VARCHAR(255),
            email VARCHAR(255),
            mobile VARCHAR(50),
            phone VARCHAR(50),
            "secondaryEmail" VARCHAR(255),
            address1 TEXT,
            address2 TEXT,
            "pinCode" VARCHAR(20),
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            experience INTEGER,
            qualification VARCHAR(255),
            "jobTitle" VARCHAR(255),
            employer VARCHAR(255),
            "expectedSalary" VARCHAR(100),
            "currentSalary" VARCHAR(100),
            skills JSONB,
            "additionalInfo" TEXT,
            "skypeId" VARCHAR(255),
            linkedin VARCHAR(255),
            twitter VARCHAR(255),
            status VARCHAR(100),
            source VARCHAR(255),
            owner VARCHAR(255),
            "emailOptOut" BOOLEAN,
            education JSONB,
            "experienceList" JSONB,
            attachments JSONB,
            notes JSONB,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "modifiedTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    client.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating table', err.stack);
        } else {
            console.log('Candidates PostgreSQL table ready.');
        }

        // Create admins table
        const createAdminTableQuery = `
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                email VARCHAR(255)
            );
        `;

        client.query(createAdminTableQuery, async (err, result) => {
            if (err) {
                console.error('Error creating admins table', err.stack);
            } else {
                console.log('Admins PostgreSQL table ready.');
                // Seed default admin if none exists
                const countRes = await client.query('SELECT COUNT(*) FROM admins');
                if (parseInt(countRes.rows[0].count) === 0) {
                    const defaultPasswordHash = await bcrypt.hash('admin123', 10);
                    await client.query(
                        'INSERT INTO admins (username, hashed_password, is_active, email) VALUES ($1, $2, $3, $4)',
                        ['admin', defaultPasswordHash, true, 'admin@example.com']
                    );
                    console.log('Default admin created (admin / admin123).');
                }
            }
        });

        // Create attachment_files table for database storage of PDFs
        const createAttachmentTableQuery = `
            CREATE TABLE IF NOT EXISTS attachment_files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(500) UNIQUE NOT NULL,
                file_data BYTEA NOT NULL,
                mime_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        client.query(createAttachmentTableQuery, (err, result) => {
            if (err) console.error('Error creating attachment_files table', err.stack);
            else console.log('Attachment storage table ready.');
            release(); // Release client after all startup DB ops are done
        });
    });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user; // Contains admin id, username
        next();
    });
};

// API Routes
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

// GET all candidates
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY "modifiedTime" DESC NULLS LAST, id DESC');

        // Since we explicitly quoted columns in creation, PostgreSQL returns exact camelCase names!
        res.json({
            message: "success",
            data: result.rows
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST a new candidate
app.post('/api/candidates', async (req, res) => {
    const {
        firstName, lastName, email, mobile, phone, secondaryEmail,
        address1, address2, pinCode, city, state, country,
        experience, qualification, jobTitle, employer, expectedSalary, currentSalary,
        skills, additionalInfo, skypeId, linkedin, twitter,
        status, source, owner, emailOptOut,
        education, experienceList, attachments, notes
    } = req.body;

    const insertQuery = `
        INSERT INTO candidates 
        ("firstName", "lastName", email, mobile, phone, "secondaryEmail", 
         address1, address2, "pinCode", city, state, country, 
         experience, qualification, "jobTitle", employer, "expectedSalary", "currentSalary", 
         skills, "additionalInfo", "skypeId", linkedin, twitter, 
         status, source, owner, "emailOptOut", 
         education, "experienceList", attachments, notes, "modifiedTime") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32) RETURNING *;
    `;
    const expValue = (experience === '' || experience === null || experience === undefined) ? null : parseInt(experience, 10);
    const params = [
        firstName, lastName, email, mobile, phone, secondaryEmail,
        address1, address2, pinCode, city, state, country,
        expValue, qualification, jobTitle, employer, expectedSalary, currentSalary,
        JSON.stringify(skills), additionalInfo, skypeId, linkedin, twitter,
        status, source, owner, emailOptOut,
        JSON.stringify(education), JSON.stringify(experienceList), JSON.stringify(attachments), JSON.stringify(notes),
        req.body.modifiedTime ? new Date(req.body.modifiedTime) : new Date()
    ];

    try {
        const result = await pool.query(insertQuery, params);
        res.json({
            message: "success",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (Update) a candidate
app.put('/api/candidates/:id', async (req, res) => {
    const { id } = req.params;
    const {
        firstName, lastName, email, mobile, phone, secondaryEmail,
        address1, address2, pinCode, city, state, country,
        experience, qualification, jobTitle, employer, expectedSalary, currentSalary,
        skills, additionalInfo, skypeId, linkedin, twitter,
        status, source, owner, emailOptOut,
        education, experienceList, attachments, notes
    } = req.body;

    const updateQuery = `
        UPDATE candidates 
        SET "firstName" = $1, "lastName" = $2, email = $3, mobile = $4, phone = $5, "secondaryEmail" = $6, 
            address1 = $7, address2 = $8, "pinCode" = $9, city = $10, state = $11, country = $12, 
            experience = $13, qualification = $14, "jobTitle" = $15, employer = $16, "expectedSalary" = $17, "currentSalary" = $18, 
            skills = $19, "additionalInfo" = $20, "skypeId" = $21, linkedin = $22, twitter = $23, 
            status = $24, source = $25, owner = $26, "emailOptOut" = $27, 
            education = $28, "experienceList" = $29, attachments = $30, notes = $31, "modifiedTime" = $32, "modifiedBy" = $33
        WHERE id = $34 RETURNING *;
    `;
    const expValue = (experience === '' || experience === null || experience === undefined) ? null : parseInt(experience, 10);
    const params = [
        firstName, lastName, email, mobile, phone, secondaryEmail,
        address1, address2, pinCode, city, state, country,
        expValue, qualification, jobTitle, employer, expectedSalary, currentSalary,
        JSON.stringify(skills), additionalInfo, skypeId, linkedin, twitter,
        status, source, owner, emailOptOut,
        JSON.stringify(education), JSON.stringify(experienceList), JSON.stringify(attachments), JSON.stringify(notes),
        new Date(), req.user ? req.user.username : 'system',
        id
    ];

    try {
        const result = await pool.query(updateQuery, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Candidate not found" });
        }
        res.json({
            message: "success",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// ATTACHMENT ROUTES (Database Storage)
// ==========================================

// Upload attachment to DB
app.post('/api/attachments/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const filename = req.body.filename || req.file.originalname;
        const mimeType = req.file.mimetype;
        const fileData = req.file.buffer;

        const query = 'INSERT INTO attachment_files (filename, file_data, mime_type) VALUES ($1, $2, $3) ON CONFLICT (filename) DO UPDATE SET file_data = $2, mime_type = $3 RETURNING id';
        const result = await pool.query(query, [filename, fileData, mimeType]);

        res.json({ message: "success", filename: filename, id: result.rows[0].id });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

// View attachment from DB
app.get('/api/attachments/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const result = await pool.query('SELECT file_data, mime_type FROM attachment_files WHERE filename = $1', [filename]);

        if (result.rows.length === 0) {
            // Fallback to physical file if not in DB (for backward compatibility during transition)
            return res.sendFile(path.join(__dirname, 'frontend', 'Attachments', filename), (err) => {
                if (err) res.status(404).send('File not found');
            });
        }

        const file = result.rows[0];
        res.setHeader('Content-Type', file.mime_type || 'application/pdf');
        res.send(file.file_data);
    } catch (err) {
        console.error("View error:", err);
        res.status(500).send('Error retrieving file');
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = result.rows[0];

        if (!admin || !admin.is_active) {
            return res.status(401).json({ error: "Invalid credentials or account inactive" });
        }

        const validPassword = await bcrypt.compare(password, admin.hashed_password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ access_token: token, token_type: "bearer" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current Admin
app.get('/api/admin/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, is_active FROM admins WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all Admins
app.get('/api/admin/list', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, is_active FROM admins ORDER BY id ASC');
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new Admin
app.post('/api/admin/create', authenticateToken, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO admins (username, email, hashed_password, is_active) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_active',
            [username, email, hashedPassword, true]
        );
        res.json({ message: "Admin created successfully", data: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation in Postgres
            return res.status(400).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Toggle Admin Status
app.put('/api/admin/:id/toggle-status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    // Prevent deactivating oneself
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
    }

    try {
        const adminRes = await pool.query('SELECT is_active FROM admins WHERE id = $1', [id]);
        if (adminRes.rows.length === 0) return res.status(404).json({ error: "Admin not found" });

        const currentStatus = adminRes.rows[0].is_active;
        const result = await pool.query(
            'UPDATE admins SET is_active = $1 WHERE id = $2 RETURNING id, username, email, is_active',
            [!currentStatus, id]
        );
        res.json({ message: "Status updated", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// BULK IMPORT ROUTE
// ==========================================

// POST /api/candidates/bulk-import  — accepts { candidates: [...] }
app.post('/api/candidates/bulk-import', authenticateToken, async (req, res) => {
    const { candidates } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'No candidates provided' });
    }

    const insertQuery = `
        INSERT INTO candidates 
        ("firstName", "lastName", email, mobile, phone, "secondaryEmail", 
         address1, address2, "pinCode", city, state, country, 
         experience, qualification, "jobTitle", employer, "expectedSalary", "currentSalary", 
         skills, "additionalInfo", "skypeId", linkedin, twitter, 
         status, source, owner, "emailOptOut", 
         education, "experienceList", attachments, notes, "modifiedTime", "createdBy", "modifiedBy") 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
        RETURNING id;
    `;

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const c of candidates) {
            try {
                const expValue = (c.experience === '' || c.experience === null || c.experience === undefined)
                    ? null : parseInt(c.experience, 10);
                const params = [
                    c.firstName || '', c.lastName || '', c.email || '', c.mobile || '',
                    c.phone || '', c.secondaryEmail || '',
                    c.address1 || '', c.address2 || '', c.pinCode || '',
                    c.city || '', c.state || '', c.country || '',
                    expValue, c.qualification || '', c.jobTitle || '', c.employer || '',
                    c.expectedSalary || '', c.currentSalary || '',
                    JSON.stringify(c.skills || []), c.additionalInfo || '',
                    c.skypeId || '', c.linkedin || '', c.twitter || '',
                    c.status || 'New', c.source || 'Import', c.owner || '',
                    !!c.emailOptOut,
                    JSON.stringify(c.education || []),
                    JSON.stringify(c.experienceList || []),
                    JSON.stringify(c.attachments || []),
                    JSON.stringify(c.notes || []),
                    new Date()
                ];
                await client.query(insertQuery, params);
                successCount++;
            } catch (rowErr) {
                failCount++;
                errors.push({ row: c.firstName + ' ' + c.lastName, error: rowErr.message });
            }
        }
        await client.query('COMMIT');
        res.json({ message: 'success', successCount, failCount, errors });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Production Server running on http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});
