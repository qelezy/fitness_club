const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const administrators = await pool.query('SELECT administrator_id, administrator_full_name, administrator_phone_number FROM administrator ORDER BY administrator_id ASC');
        res.json(administrators.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { administrator_full_name, administrator_phone_number, administrator_password } = req.body;
        const hashedPassword = await bcrypt.hash(administrator_password, 10);
        const newAdministrator = await pool.query('INSERT INTO administrator (administrator_full_name, administrator_phone_number, administrator_password) VALUES ($1, $2, $3) RETURNING *', [administrator_full_name, administrator_phone_number, hashedPassword]);
        res.json(newAdministrator.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { administrator_full_name, administrator_phone_number } = req.body;
        const updateAdministrator = await pool.query('UPDATE administrator SET administrator_full_name = $1, administrator_phone_number = $2 WHERE administrator_id = $3', [administrator_full_name, administrator_phone_number, id]);
        res.json('Данные администратора обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteAdministrator = await pool.query('DELETE FROM administrator WHERE administrator_id = $1', [id]);
        res.json('Администратор удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;