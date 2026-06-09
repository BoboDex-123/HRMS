// Super-admin-only admin management. Mounted at /api/admins behind requireSuperAdmin.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const VALID_ROLES = ['admin', 'superadmin'];

// List all admins (no password hashes).
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, is_active, created_at FROM admins ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Create a new admin / super admin.
router.post('/', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const adminRole = VALID_ROLES.includes(role) ? role : 'admin';

  try {
    const existing = await pool.query('SELECT 1 FROM admins WHERE username = $1', [username]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An admin with that username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO admins (id, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, is_active, created_at`,
      [uuidv4(), username, email || null, hash, adminRole]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Update an admin's active status or role. Cannot deactivate/demote yourself.
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active, role } = req.body;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own account here' });
  }
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const fields = [];
    const values = [];
    let i = 1;
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(Boolean(is_active)); }
    if (role !== undefined) { fields.push(`role = $${i++}`); values.push(role); }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, username, email, role, is_active, created_at`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Admin not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

module.exports = router;
