const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Secret key for JWT signing (Fallback provided, but best set in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fire_safety_key';

let db;

// Initialize Async Database Connection
async function connectDB() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'fire_extinguisher_mgmt'
        });
        console.log(' Connected to MySQL Database using Async/Await.');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Stop server execution if database connection fails
    }
}
connectDB();

// ==========================================
// 1. AUTHENTICATION (REGISTER / LOGIN)
// ==========================================

// Register a new user with Bcrypt Hashing
app.post('/api/users/register', async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Please provide full_name, email, and password.' });
    }

    try {
        // Hash password securely before database insertion
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`;
        const result = await db.execute(sql, [full_name, email, passwordHash, role || 'Inspector']);

        // For mysql2/promise:
        // - SELECT: returns [rows, fields]
        // - INSERT/UPDATE: returns [OkPacket]
        // In practice, we can safely normalize insertId.
        const insertId = Array.isArray(result) ? (result[0]?.insertId) : result?.insertId;


        res.status(201).json({ message: 'User created successfully!', userId: insertId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'This email address is already registered.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login User with Bcrypt Comparison and JWT generation
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'This account has been deactivated.' });
        }

        // Compare incoming plain text password against the stored secure hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate a secure JSON Web Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' } // Token expires in 8 hours
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. LOCATION ROUTING
// ==========================================

app.get('/api/locations', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM locations ORDER BY building_name, floor');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/locations', async (req, res) => {
    const { building_name, floor, specific_zone } = req.body;
    try {
        const sql = `INSERT INTO locations (building_name, floor, specific_zone) VALUES (?, ?, ?)`;
        const [result] = await db.execute(sql, [building_name, floor, specific_zone]);
        res.status(201).json({ message: 'Location added successfully', locationId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    const { building_name, floor, specific_zone } = req.body;
    try {
        const sql = `UPDATE locations SET building_name = ?, floor = ?, specific_zone = ? WHERE id = ?`;
        await db.execute(sql, [building_name, floor, specific_zone, id]);
        res.json({ message: 'Location updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM locations WHERE id = ?', [id]);
        res.json({ message: 'Location deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. FIRE EXTINGUISHER INVENTORY ROUTING
// ==========================================

app.get('/api/extinguishers', async (req, res) => {
    try {
        const sql = `
            SELECT e.*, l.building_name, l.floor, l.specific_zone 
            FROM extinguishers e
            LEFT JOIN locations l ON e.location_id = l.id
            ORDER BY e.next_service_date ASC
        `;
        const [results] = await db.execute(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/extinguishers', async (req, res) => {
    const { serial_number, type, capacity_kg, location_id, manufacture_date, next_service_date, hydrostatic_test_due } = req.body;
    try {
        const sql = `INSERT INTO extinguishers 
            (serial_number, type, capacity_kg, location_id, status, manufacture_date, next_service_date, hydrostatic_test_due) 
            VALUES (?, ?, ?, ?, 'Active', ?, ?, ?)`;
        
        const [result] = await db.execute(sql, [serial_number, type, capacity_kg, location_id, manufacture_date, next_service_date, hydrostatic_test_due]);
        res.status(201).json({ message: 'Extinguisher tracked successfully', assetId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/extinguishers/:id', async (req, res) => {
    const { id } = req.params;
    const { serial_number, type, capacity_kg, location_id, manufacture_date, next_service_date, hydrostatic_test_due, status } = req.body;
    try {
        const sql = `UPDATE extinguishers SET 
            serial_number = ?, type = ?, capacity_kg = ?, location_id = ?, 
            status = ?, manufacture_date = ?, next_service_date = ?, hydrostatic_test_due = ? 
            WHERE id = ?`;
        await db.execute(sql, [serial_number, type, capacity_kg, location_id, status || 'Active', manufacture_date, next_service_date, hydrostatic_test_due, id]);
        res.json({ message: 'Extinguisher updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/extinguishers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM extinguishers WHERE id = ?', [id]);
        res.json({ message: 'Extinguisher deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. DIGITAL INSPECTION LOGIC (WITH AUTOMATED OVERRIDES)
// ==========================================

app.post('/api/inspections', async (req, res) => {
    const {
        extinguisher_id, inspector_id, pressure_gauge, nozzle_and_hose,
        tamper_seal_intact, physical_signs_rust_dent, is_obstructed, signage_visible, comments
    } = req.body;

    // Safety automation rules
    const status_passed = (
        pressure_gauge === 'Normal' && 
        nozzle_and_hose === 'Good' && 
        Number(tamper_seal_intact) === 1 && 
        Number(physical_signs_rust_dent) === 0 && 
        Number(is_obstructed) === 0 && 
        Number(signage_visible) === 1
    ) ? 1 : 0;

    try {
        const insertInspectionSql = `
            INSERT INTO inspections (extinguisher_id, inspector_id, pressure_gauge, nozzle_and_hose, tamper_seal_intact, physical_signs_rust_dent, is_obstructed, signage_visible, status_passed, comments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(insertInspectionSql, [extinguisher_id, inspector_id, pressure_gauge, nozzle_and_hose, tamper_seal_intact, physical_signs_rust_dent, is_obstructed, signage_visible, status_passed, comments]);

        if (!status_passed) {
            // Update device status and throw alert using clean await calls
            await db.execute(`UPDATE extinguishers SET status = 'Under Maintenance' WHERE id = ?`, [extinguisher_id]);
            const alertMsg = `Extinguisher failed routine check. Reason: ${comments || 'Irregular structural or pressure levels logged.'}`;
            await db.execute(`INSERT INTO alerts (extinguisher_id, alert_type, message) VALUES (?, 'Failed Inspection', ?)`, [extinguisher_id, alertMsg]);
        } else {
            // Extend standard service timeline forward by 6 months if passed
            await db.execute(`UPDATE extinguishers SET status = 'Active', next_service_date = DATE_ADD(CURDATE(), INTERVAL 6 MONTH) WHERE id = ?`, [extinguisher_id]);
        }

        res.status(201).json({ 
            message: 'Inspection compiled successfully', 
            inspectionId: result.insertId,
            passed: !!status_passed 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. MAINTENANCE & ALERTS ROUTING
// ==========================================

app.get('/api/alerts', async (req, res) => {
    try {
        const sql = `SELECT a.*, e.serial_number FROM alerts a 
                     JOIN extinguishers e ON a.extinguisher_id = e.id 
                     WHERE a.is_resolved = FALSE ORDER BY a.triggered_at DESC`;
        const [results] = await db.execute(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/maintenance', async (req, res) => {
    const { extinguisher_id, technician_id, maintenance_type, service_provider, cost, details } = req.body;
    try {
        const sql = `INSERT INTO maintenance_logs (extinguisher_id, technician_id, maintenance_type, service_date, service_provider, cost, details)
                     VALUES (?, ?, ?, CURDATE(), ?, ?, ?)`;
        const [result] = await db.execute(sql, [extinguisher_id, technician_id, maintenance_type, service_provider, cost, details]);

        // Restore asset state and close alert tags asynchronously
        await db.execute(`UPDATE extinguishers SET status = 'Active', next_service_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR) WHERE id = ?`, [extinguisher_id]);
        await db.execute(`UPDATE alerts SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP WHERE extinguisher_id = ? AND is_resolved = FALSE`, [extinguisher_id]);

        res.status(201).json({ message: 'Maintenance record generated.', recordId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Async server initialized on:http://localhost:${PORT}`));