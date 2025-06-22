const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const clients = await pool.query('SELECT client_id, client_full_name, client_birthday, client_phone_number FROM client ORDER BY client_id ASC');
        res.json(clients.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { client_full_name, client_birthday, client_phone_number } = req.body;
        const newClient = await pool.query('INSERT INTO client (client_full_name, client_birthday, client_phone_number) VALUES ($1, $2, $3) RETURNING *', [client_full_name, client_birthday, client_phone_number]);
        res.json(newClient.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { client_full_name, client_birthday, client_phone_number } = req.body;
        const updateClient = await pool.query('UPDATE client SET client_full_name = $1, client_birthday = $2, client_phone_number = $3 WHERE client_id = $4', [client_full_name, client_birthday, client_phone_number, id]);
        res.json('Данные клиента обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteClient = await pool.query('DELETE FROM client WHERE client_id = $1', [id]);
        res.json('Клиент удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;