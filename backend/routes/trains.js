const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const trains = await pool.query("SELECT CONCAT(LPAD(trains.training_session_id::TEXT, 8, '0'), LPAD(trains.client_id::TEXT, 8, '0')) AS trains_id, hall_category, administrator_full_name, coach_full_name, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members, client_full_name FROM trains JOIN training_session ON training_session.training_session_id = trains.training_session_id JOIN administrator ON administrator.administrator_id = training_session.administrator_id JOIN coach ON coach.coach_id = training_session.coach_id JOIN hall ON hall.hall_id = training_session.hall_id JOIN client ON client.client_id = trains.client_id ORDER BY trains.training_session_id, trains.client_id ASC");
        res.json(trains.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/get_by_user', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        const query = `
            SELECT 
                training_session.training_session_id,
                training_session_date,
                training_session_start_time,
                training_session_duration,
                training_session_type,
                coach_full_name,
                hall.hall_id
            FROM trains
            JOIN training_session ON training_session.training_session_id = trains.training_session_id
            JOIN coach ON coach.coach_id = training_session.coach_id
            JOIN hall ON hall.hall_id = training_session.hall_id
            WHERE trains.client_id = $1 AND training_session_date >= CURRENT_DATE
            ORDER BY training_session_date, training_session_start_time ASC
        `;
        const result = await pool.query(query, [user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/get_by_coach', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        const query = `
            SELECT 
                training_session.training_session_id,
                training_session_date,
                training_session_start_time,
                training_session_duration,
                training_session_type,
                hall.hall_id,
                json_agg(
                    json_build_object(
                        'client_full_name', client_full_name
                    )
                ) AS clients
            FROM training_session
            JOIN hall ON hall.hall_id = training_session.hall_id
            LEFT JOIN trains ON trains.training_session_id = training_session.training_session_id
            LEFT JOIN client ON client.client_id = trains.client_id
            WHERE training_session.coach_id = $1 AND training_session_date >= CURRENT_DATE
            GROUP BY 
                training_session.training_session_id,
                training_session_date,
                training_session_start_time,
                training_session_duration,
                training_session_type,
                hall.hall_id
            ORDER BY training_session_date, training_session_start_time ASC
        `;
        const result = await pool.query(query, [user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { training_session_id, client_id } = req.body;
        const newTrains = await pool.query('CALL add_client_to_training_session($1, $2)', [training_session_id, client_id]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/group/enroll', async (req, res) => {
    try {
        const { training_session_id } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
         // Проверка записан ли пользователь на эту тренировку
        const checkQuery = `
            SELECT 1 FROM trains 
            WHERE client_id = $1 AND training_session_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [user.id, training_session_id]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: 'Вы уже записаны на эту тренировку' });
        }
        const newTrains = await pool.query('CALL add_client_to_training_session($1, $2)', [training_session_id, user.id]);
        req.json({ message: 'Вы успешно записались на тренировку' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/individual/enroll', async (req, res) => {
    try {
        const { coach_id, date, time } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        // Получаем специализацию тренера
        const coachResult = await pool.query(
            'SELECT coach_specialization FROM coach WHERE coach_id = $1',
            [coach_id]
        );
        if (coachResult.rows.length === 0) {
            return res.status(400).json({ message: 'Тренер не найден' });
        }
        const specialization = coachResult.rows[0].coach_specialization;
        let hall_id;
        switch (specialization) {
            case 'Плавание':
                hall_id = 1;
                break;
            case 'Дзюдо':
            case 'Карате':
            case 'Бокс':
            case 'Айкидо':
                hall_id = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
                break;
            case 'Бодибилдинг':
                hall_id = Math.floor(Math.random() * (6 - 4 + 1)) + 4;
                break;
            case 'Бальные танцы':
                hall_id = Math.floor(Math.random() * (8 - 7 + 1)) + 7;
                break;
            case 'Йога':
                hall_id = 9;
                break;
            case 'Аэробика':
                hall_id = 10;
                break;
            default:
                return res.status(400).json({ message: 'Неизвестная специализация тренера' });
        }
        const administrator_id = Math.floor(Math.random() * (5 - 1 + 1)) + 1
        // Создание индивидуальной тренировки
        const newTrainingSession = await pool.query('INSERT INTO training_session (hall_id, administrator_id, coach_id, training_session_date, training_session_start_time, training_session_duration, training_session_type, training_session_max_members) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING training_session_id', [hall_id, administrator_id, coach_id, date, time, 60, false, null]);
        const training_session_id = newTrainingSession.rows[0].training_session_id;
        const newTrains = await pool.query('CALL add_client_to_training_session($1, $2)', [training_session_id, user.id]);
        res.json({ message: 'Вы успешно записались на тренировку' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:trainingSessionID/:clientID', async (req, res) => {
    try {
        const { trainingSessionID, clientID } = req.params;
        const { training_session_id, client_id } = req.body;
        const updateTrains = await pool.query('UPDATE trains SET training_session_id = $1, client_id = $2 WHERE training_session_id = $3 AND client_id = $4', [training_session_id, client_id, trainingSessionID, clientID]);
        res.json('Данные записи на тренировку обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:trainingSessionID/:clientID', async (req, res) => {
    try {
        const { trainingSessionID, clientID } = req.params;
        const deleteTrains = await pool.query('DELETE FROM trains WHERE training_session_id = $1 AND client_id = $2', [trainingSessionID, clientID]);
        res.json('Запись на тренировку удалена');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        // Получаем тип тренировки
        const sessionTypeQuery = await pool.query(
            'SELECT training_session_type FROM training_session WHERE training_session_id = $1',
            [id]
        );
        if (sessionTypeQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Тренировка не найдена' });
        }
        const isGroup = sessionTypeQuery.rows[0].training_session_type;
        const deleteTrains = await pool.query('DELETE FROM trains WHERE training_session_id = $1 AND client_id = $2', [id, user.id]);
        // Если тренировка индивидуальная — удаляем и саму тренировку
        if (!isGroup) {
            await pool.query('DELETE FROM training_session WHERE training_session_id = $1', [id]);
        }
        res.json({ message: 'Запись на тренировку отменена' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;