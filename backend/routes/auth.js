const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database');

const router = express.Router();

router.post('/check', async (req, res) => {
    try {
        if (req.session && req.session.user) {
            return res.json({
                authenticated: true,
                role: req.session.user.role
            });
        } else {
            return res.json({ authenticated: false });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/username', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });

        let query;

        if (user.role === 'admin') {
            query = 'SELECT administrator_full_name AS full_name FROM administrator WHERE administrator_id = $1';
        } else if (user.role === 'coach') {
            query = 'SELECT coach_full_name AS full_name FROM coach WHERE coach_id = $1';
        } else if (user.role === 'client') {
            query = 'SELECT client_full_name AS full_name FROM client WHERE client_id = $1';
        }

        const result = await pool.query(query, [user.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });

        res.json({ full_name: result.rows[0].full_name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });

        let query;

        if (user.role === 'admin') {
            query = 'SELECT administrator_full_name AS full_name, administrator_phone_number AS phone FROM administrator WHERE administrator_id = $1';
        } else if (user.role === 'coach') {
            query = 'SELECT coach_full_name AS full_name, coach_phone_number AS phone, coach_specialization AS specialization FROM coach WHERE coach_id = $1';
        } else if (user.role === 'client') {
            query = 'SELECT client_full_name AS full_name, client_phone_number AS phone FROM client WHERE client_id = $1';
        }

        const result = await pool.query(query, [user.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        // Проверка среди администраторов
        const admin = await pool.query(
            'SELECT administrator_id, administrator_password FROM administrator WHERE administrator_phone_number = $1',
            [phone]
        );
        if (admin.rows.length > 0) {
            const match = await bcrypt.compare(password, admin.rows[0].administrator_password);
            if (match) {
                req.session.user = {
                    id: admin.rows[0].administrator_id,
                    role: 'admin'
                };
                return res.json({ success: true, role: 'admin' });
            } else {
                return res.status(401).json({ success: false, message: 'Неверный пароль' });
            }
        }
        // Проверка среди тренеров
        const coach = await pool.query(
            'SELECT coach_id, coach_password FROM coach WHERE coach_phone_number = $1',
            [phone]
        );
        if (coach.rows.length > 0) {
            const match = await bcrypt.compare(password, coach.rows[0].coach_password);
            if (match) {
                req.session.user = {
                    id: coach.rows[0].coach_id,
                    role: 'coach'
                };
                return res.json({ success: true, role: 'coach' });
            } else {
                return res.status(401).json({ success: false, message: 'Неверный пароль' });
            }
        }
        // Проверка среди клиентов
        const client = await pool.query(
            'SELECT client_id, client_password FROM client WHERE client_phone_number = $1',
            [phone]
        );
        if (client.rows.length > 0) {
            const match = await bcrypt.compare(password, client.rows[0].client_password);
            if (match) {
                req.session.user = {
                    id: client.rows[0].client_id,
                    role: 'client'
                };
                return res.json({ success: true, role: 'client' });
            } else {
                return res.status(401).json({ success: false, message: 'Неверный пароль' });
            }
        }
        res.status(404).json({ success: false, message: 'Пользователь не найден' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { fullName, phone, birthday, password } = req.body;
        const userExists = await pool.query(
            'SELECT client_id FROM client WHERE client_phone_number = $1',
            [phone]
        );
        if (userExists.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Пользователь с таким телефоном уже существует' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO client (client_full_name, client_phone_number, client_birthday, client_password) VALUES ($1, $2, $3, $4) RETURNING *`,
            [fullName, phone, birthday, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'Пользователь успешно зарегистрирован'});
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/logout', async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Ошибка выхода' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Выход выполнен успешно' });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;