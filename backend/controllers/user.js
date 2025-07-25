const connection = require('../config/database');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const registerUser = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        console.log('File:', req.file);
        
        const { name, password, email } = req.body;
        let imagePath = null;

        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insert the user with verification token and verified = false
        const userSql = 'INSERT INTO users (name, password, email, profile_picture, verified, verification_token) VALUES (?, ?, ?, ?, ?, ?)';
        connection.execute(userSql, [name, hashedPassword, email, imagePath, false, verificationToken], async (err, result) => {
            if (err) {
                console.log('Database error:', err);
                return res.status(400).json({
                    success: false,
                    message: err.code === 'ER_DUP_ENTRY' ? 
                        'Email already exists' : 
                        'Error creating user',
                    error: err
                });
            }

            // Send verification email
            const verifyUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/verify-email?token=${verificationToken}`;
            const message = `Please verify your email by clicking <a href="${verifyUrl}">here</a>.`;
            try {
                await sendEmail({
                    email,
                    subject: 'Verify your email',
                    message
                });
            } catch (emailErr) {
                console.log('Email error:', emailErr);
            }

            return res.status(201).json({
                success: true,
                message: 'User registered successfully. Please check your email to verify your account.',
                userId: result.insertId
            });
        });
    } catch (error) {
        console.log('Server error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error
        });
    }
};

const verifyEmail = (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }
    const sql = 'SELECT id FROM users WHERE verification_token = ? AND verified = 0';
    connection.execute(sql, [token], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
        }
        const userId = results[0].id;
        const updateSql = 'UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?';
        connection.execute(updateSql, [userId], (err2) => {
            if (err2) {
                return res.status(500).json({ success: false, message: 'Database error', error: err2 });
            }
            return res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
        });
    });
};

const loginUser = async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    const sql = 'SELECT id, name, email, password, verified, role, status FROM users WHERE email = ?';
    connection.execute(sql, [email], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error logging in', details: err });
        }
        console.log(results)
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = results[0];

        if (!user.verified) {
            return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
        }

        if (user.status && user.status === 'inactive') {
            return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact support or your administrator.' });
        }

        const match = await bcrypt.compare(password, user.password);
        console.log(match)
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        delete user.password;

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, );

        return res.status(200).json({
            success: "welcome back",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role, // <-- this line is critical!
                verified: user.verified,
                status: user.status
            },
            token
        });
    });
};

const updateUser = (req, res) => {
    // {
    //   "name": "steve",
    //   "email": "steve@gmail.com",
    //   "password": "password"
    // }
    console.log(req.body, req.file)
    const { title, fname, lname, addressline, town, zipcode, phone, userId, } = req.body;

    if (req.file) {
        image = req.file.path.replace(/\\/g, "/");
    }
    //     INSERT INTO users(user_id, username, email)
    //   VALUES(1, 'john_doe', 'john@example.com')
    // ON DUPLICATE KEY UPDATE email = 'john@example.com';
    const userSql = `
  INSERT INTO customer 
    (title, fname, lname, addressline, town, zipcode, phone, image_path, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    fname = VALUES(fname),
    lname = VALUES(lname),
    addressline = VALUES(addressline),
    town = VALUES(town),
    zipcode = VALUES(zipcode),
    phone = VALUES(phone),
    image_path = VALUES(image_path)`;
    const params = [title, fname, lname, addressline, town, zipcode, phone, image, userId];

    try {
        connection.execute(userSql, params, (err, result) => {
            if (err instanceof Error) {
                console.log(err);

                return res.status(401).json({
                    error: err
                });
            }

            return res.status(200).json({
                success: true,
                result
            })
        });
    } catch (error) {
        console.log(error)
    }

};

const updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const sql = 'UPDATE users SET role = ? WHERE id = ?';
    connection.execute(sql, [role, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Role updated successfully' });
    });
};

const updateUserStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || (status !== 'active' && status !== 'inactive')) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const sql = 'UPDATE users SET status = ? WHERE id = ?';
    connection.execute(sql, [status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Status updated successfully' });
    });
};

const deactivateUser = (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
    const timestamp = new Date();

    connection.execute(sql, [timestamp, email], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error deactivating user', details: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            email,
            deleted_at: timestamp
        });
    });
};

const getAllUsers = (req, res) => {
    const sql = 'SELECT id, name, email, role, status FROM users';
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        return res.status(200).json({ rows: results });
    });
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser, verifyEmail, updateUserRole, updateUserStatus, getAllUsers };