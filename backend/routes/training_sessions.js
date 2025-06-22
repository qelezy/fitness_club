const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const trainingSessions = await pool.query('SELECT training_session_id, hall_category, administrator_full_name, coach_full_name, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members FROM training_session JOIN administrator ON administrator.administrator_id = training_session.administrator_id JOIN coach ON coach.coach_id = training_session.coach_id JOIN hall ON hall.hall_id = training_session.hall_id ORDER BY training_session_id ASC');
        res.json(trainingSessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/group_trainings/:date', async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ message: 'Дата обязательна' });
        }
        const query = `
            SELECT 
                training_session.training_session_id, hall.hall_id, coach_full_name, 
                training_session_date, training_session_start_time, 
                training_session_duration, training_session_max_members, 
                COUNT(trains.client_id) AS taken 
            FROM training_session 
            JOIN coach ON coach.coach_id = training_session.coach_id 
            JOIN hall ON hall.hall_id = training_session.hall_id
            LEFT JOIN trains ON trains.training_session_id = training_session.training_session_id
            WHERE training_session_type = true
            AND training_session_date = $1
            GROUP BY training_session.training_session_id, hall.hall_id, coach_full_name, training_session_date, training_session_start_time, training_session_duration, training_session_max_members
            ORDER BY training_session_start_time ASC
        `;
        const trainingSessions = await pool.query(query, [date]);
        res.json(trainingSessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/training_session_types', async (req, res) => {
    try {
        const trainingSessions = await pool.query('SELECT DISTINCT training_session_type FROM training_session');
        res.json(trainingSessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/:id/administrator_id', async (req, res) => {
    try {
        const { id } = req.params;
        const trainingSessions = await pool.query('SELECT administrator_id FROM training_session WHERE training_session_id = $1', [id]);
        res.json(trainingSessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/:id/coach_id', async (req, res) => {
    try {
        const { id } = req.params;
        const trainingSessions = await pool.query('SELECT coach_id FROM training_session WHERE training_session_id = $1', [id]);
        res.json(trainingSessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { hall_id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        const newTrainingSession = await pool.query('INSERT INTO training_session (hall_id, administrator_id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [hall_id, user.id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members]);
        res.json(newTrainingSession.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hall_id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        const updateTrainingSession = await pool.query('UPDATE training_session SET hall_id = $1, administrator_id = $2, coach_id = $3, training_session_date = $4, training_session_start_time = $5, training_session_duration = $6, training_session_type = $7, training_session_max_members = $8 WHERE training_session_id = $9', [hall_id, user.id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members, id]);
        res.json('Данные тренировки обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteTrainingSession = await pool.query('DELETE FROM training_session WHERE training_session_id = $1', [id]);
        res.json('Тренировка удалена');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;