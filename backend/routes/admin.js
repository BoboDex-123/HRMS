// Admin-only routes. Mounted at /api/admin behind requireAdminAuth.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { sendEmail, template } = require('../mailer');

// Generate a readable temporary password the admin hands to the new employee.
function genTempPassword() {
  return 'Welcome@' + Math.floor(1000 + Math.random() * 9000);
}

// Create a new employee login in the local `employees` table (replaces Cognito AdminCreateUser).
router.post('/create-employee', async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  try {
    const existing = await pool.query('SELECT 1 FROM employees WHERE username = $1', [username]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'An employee with that username already exists' });
    }

    const tempPassword = genTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `INSERT INTO employees (id, username, email, password_hash, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [uuidv4(), username, email, hash]
    );

    // Return the temp password so the admin can share it with the employee.
    res.json({ success: true, tempPassword });

    // Fire-and-forget credentials email (no-op until a mail provider key is set).
    sendEmail({
      to: email,
      subject: 'Your HRMS account is ready',
      html: template('Welcome to HRMS', [
        `Your employee account has been created.`,
        `<strong>Username:</strong> ${username}`,
        `<strong>Temporary password:</strong> ${tempPassword}`,
        `You'll be asked to set a new password on first login.`,
      ]),
    });
  } catch (err) {
    console.error('❌ Error creating employee:', err);
    res.status(500).json({ message: 'Failed to create employee' });
  }
});

module.exports = router;
