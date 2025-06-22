const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        let schedule;
        if (startDate !== 'null' && endDate !== 'null') {
            schedule = await pool.query('SELECT training_session_date, training_session_start_time, coach_full_name, hall_category, training_session_type, training_session_duration, training_session_max_members FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id JOIN hall ON hall.hall_id = training_session.hall_id WHERE training_session_date >= $1 AND training_session_date <= $2 ORDER BY training_session_date', [startDate, endDate]);
        } else if (startDate !== 'null') {
            schedule = await pool.query('SELECT training_session_date, training_session_start_time, coach_full_name, hall_category, training_session_type, training_session_duration, training_session_max_members FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id JOIN hall ON hall.hall_id = training_session.hall_id WHERE training_session_date >= $1 ORDER BY training_session_date', [startDate]);
        } else if (endDate !== 'null') {
            schedule = await pool.query('SELECT training_session_date, training_session_start_time, coach_full_name, hall_category, training_session_type, training_session_duration, training_session_max_members FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id JOIN hall ON hall.hall_id = training_session.hall_id WHERE training_session_date <= $1 ORDER BY training_session_date', [endDate]);
        }
        res.json(schedule.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;