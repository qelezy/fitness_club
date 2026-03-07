const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database');
const { requireAuth } = require('../middleware/authMiddleware');

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

router.get('/username', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
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

router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
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

async function tryLoginByRole({ phone, password, config, req, res }) {
    const { table, phoneField, idField, passwordField, role } = config;
    const query = `SELECT ${idField}, ${passwordField} FROM ${table} WHERE ${phoneField} = $1`;
    const result = await pool.query(query, [phone]);
    if (result.rows.length === 0) {
        return false;
    }
    const row = result.rows[0];
    const match = await bcrypt.compare(password, row[passwordField]);
    if (!match) {
        res.status(401).json({ success: false, message: 'Неверный пароль' });
        return true;
    }
    req.session.user = {
        id: row[idField],
        role
    };
    res.json({ success: true, role: role });
    return true;
}

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        const rolesConfig = [
            {
                table: 'administrator',
                phoneField: 'administrator_phone_number',
                idField: 'administrator_id',
                passwordField: 'administrator_password',
                role: 'admin'
            },
            {
                table: 'coach',
                phoneField: 'coach_phone_number',
                idField: 'coach_id',
                passwordField: 'coach_password',
                role: 'coach'
            },
            {
                table: 'client',
                phoneField: 'client_phone_number',
                idField: 'client_id',
                passwordField: 'client_password',
                role: 'client'
            }
        ];

        for (const config of rolesConfig) {
            const handled = await tryLoginByRole({ phone, password, config, req, res });
            if (handled) {
                return;
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