const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const halls = await pool.query('SELECT hall_id, hall_id AS hall_number, hall_category FROM hall ORDER BY hall_id ASC');
        res.json(halls.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/all', async (req, res) => {
    try {
        const halls = await pool.query('SELECT hall_id, hall_category FROM hall ORDER BY hall_id ASC');
        res.json(halls.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/hall_categories', async (req, res) => {
    try {
        const halls = await pool.query('SELECT DISTINCT hall_category FROM hall ORDER BY hall_category ASC');
        res.json(halls.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/:id/hall_id', async (req, res) => {
    try {
        const { id } = req.params;
        const halls = await pool.query('SELECT hall_id FROM training_session WHERE training_session_id = $1', [id]);
        res.json(halls.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { hall_id, hall_category } = req.body;
        const newHall = await pool.query('INSERT INTO hall (hall_id, hall_category) VALUES ($1, $2) RETURNING *', [hall_id, hall_category]);
        res.json(newHall.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hall_id, hall_category } = req.body;
        const updateHall = await pool.query('UPDATE hall SET hall_id = $1, hall_category = $2 WHERE hall_id = $3', [hall_id, hall_category, id]);
        res.json('Данные зала обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteHall = await pool.query('DELETE FROM hall WHERE hall_id = $1', [id]);
        res.json('Зал удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;