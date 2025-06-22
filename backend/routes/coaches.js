const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const coaches = await pool.query('SELECT coach_id, coach_full_name, coach_phone_number, coach_specialization FROM coach ORDER BY coach_id ASC');
        res.json(coaches.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { coach_full_name, coach_phone_number, coach_specialization, coach_password } = req.body;
        const hashedPassword = await bcrypt.hash(coach_password, 10);
        const newCoach = await pool.query('INSERT INTO coach (coach_full_name, coach_phone_number, coach_specialization, coach_password) VALUES ($1, $2, $3, $4) RETURNING *', [coach_full_name, coach_phone_number, coach_specialization, hashedPassword]);
        res.json(newCoach.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { coach_full_name, coach_phone_number, coach_specialization } = req.body;
        const updateCoach = await pool.query('UPDATE coach SET coach_full_name = $1, coach_phone_number = $2, coach_specialization = $3 WHERE coach_id = $4', [coach_full_name, coach_phone_number, coach_specialization, id]);
        res.json('Данные тренера обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteCoach = await pool.query('DELETE FROM coach WHERE coach_id = $1', [id]);
        res.json('Тренер удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;