const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const subscriptions = await pool.query('SELECT subscription_id, client_full_name, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price FROM subscription JOIN client ON client.client_id = subscription.client_id ORDER BY subscription_id ASC');
        res.json(subscriptions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/get_by_user', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        const subscriptions = await pool.query('SELECT subscription_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price FROM subscription WHERE client_id = $1 ORDER BY subscription_id ASC', [user.id]);
        res.json(subscriptions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/subscription_statuses', async (req, res) => {
    try {
        const subscriptions = await pool.query('SELECT DISTINCT subscription_status FROM subscription ORDER BY subscription_status ASC');
        res.json(subscriptions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.get('/:id/client_id', async (req, res) => {
    try {
        const { id } = req.params;
        const subscriptions = await pool.query('SELECT client_id FROM subscription WHERE subscription_id = $1', [id]);
        res.json(subscriptions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price } = req.body;
        const newSubscription = await pool.query('INSERT INTO subscription (client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price]);
        res.json(newSubscription.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});


router.post('/add', async (req, res) => {
    try {
        const { duration, price, purchase_date } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });

        const newSubscription = await pool.query('INSERT INTO subscription (client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [user.id, purchase_date, null, duration, false, price]);
        res.json({
            message: 'Абонемент успешно оформлен',
            subscription: newSubscription.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price } = req.body;
        const updateSubscription = await pool.query('UPDATE subscription SET client_id = $1, subscription_purchase_date = $2, subscription_start_date = $3, subscription_validity_period = $4, subscription_status = $5, subscription_price = $6 WHERE subscription_id = $7', [client_id, subscription_purchase_date, subscription_start_date, subscription_validity_period, subscription_status, subscription_price, id]);
        res.json('Данные абонемента обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/activate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date } = req.body;
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Пользователь не авторизован' });
        // Проверяем наличие активного абонемента
        const activeCheck = await pool.query(
            'SELECT * FROM subscription WHERE client_id = $1 AND subscription_status = $2',
            [user.id, true]
        );
        if (activeCheck.rows.length > 0) {
            return res.status(400).json({ message: 'У вас уже есть активный абонемент' });
        }
        // Активируем выбранный абонемент
        const updateSubscription = await pool.query('UPDATE subscription SET subscription_start_date = $1, subscription_status = $2 WHERE subscription_id = $3', [start_date, user.id, id]);
        res.json('Абонемент успешно активирован');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteSubscription = await pool.query('DELETE FROM subscription WHERE subscription_id = $1', [id]);
        res.json('Абонемент удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;