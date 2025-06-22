const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        let workload;
        if (startDate !== 'null' && endDate !== 'null') {
            workload = await pool.query('SELECT coach_full_name, COUNT(training_session.coach_id) AS count_training_sessions, SUM(CASE WHEN training_session_type = FALSE THEN 1 ELSE 0 END) AS sum_individual, SUM(CASE WHEN training_session_type = TRUE THEN 1 ELSE 0 END) AS sum_group, SUM(training_session_duration) AS sum_duration FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id WHERE training_session_date >= $1 AND training_session_date <= $2 GROUP BY coach_full_name ORDER BY coach_full_name', [startDate, endDate]);
        } else if (startDate !== 'null') {
            workload = await pool.query('SELECT coach_full_name, COUNT(training_session.coach_id) AS coun_training_sessions, SUM(CASE WHEN training_session_type = FALSE THEN 1 ELSE 0 END) AS sum_individual, SUM(CASE WHEN training_session_type = TRUE THEN 1 ELSE 0 END) AS sum_group, SUM(training_session_duration) AS sum_duration FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id WHERE training_session_date >= $1 GROUP BY coach_full_name ORDER BY coach_full_name', [startDate]);
        } else if (endDate !== 'null') {
            workload = await pool.query('SELECT coach_full_name, COUNT(training_session.coach_id) AS count_training_sessions, SUM(CASE WHEN training_session_type = FALSE THEN 1 ELSE 0 END) AS sum_individual, SUM(CASE WHEN training_session_type = TRUE THEN 1 ELSE 0 END) AS sum_group, SUM(training_session_duration) AS sum_duration FROM training_session JOIN coach ON coach.coach_id = training_session.coach_id WHERE training_session_date <= $1 GROUP BY coach_full_name ORDER BY coach_full_name', [endDate]);
        }
        res.json(workload.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;