const express = require('express');
const pool = require('../database');

const router = express.Router();

router.get('/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        let sales;
        if (startDate !== 'null' && endDate !== 'null') {
            sales = await pool.query('SELECT client_full_name, client_phone_number, subscription_validity_period, subscription_purchase_date, subscription_start_date, subscription_price FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date >= $1 AND subscription_purchase_date <= $2 UNION SELECT NULL, NULL, NULL, NULL, NULL, SUM(subscription_price) FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date >= $1 AND subscription_purchase_date <= $2 ORDER BY client_full_name', [startDate, endDate]);
        } else if (startDate !== 'null') {
            sales = await pool.query('SELECT client_full_name, client_phone_number, subscription_validity_period, subscription_purchase_date, subscription_start_date, subscription_price FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date >= $1 UNION SELECT NULL, NULL, NULL, NULL, NULL, SUM(subscription_price) FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date >= $1 ORDER BY client_full_name', [startDate]);
        } else if (endDate !== 'null') {
            sales = await pool.query('SELECT client_full_name, client_phone_number, subscription_validity_period, subscription_purchase_date, subscription_start_date, subscription_price FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date <= $1 UNION SELECT NULL, NULL, NULL, NULL, NULL, SUM(subscription_price) FROM client JOIN subscription ON subscription.client_id = client.client_id WHERE subscription_purchase_date <= $1 ORDER BY client_full_name', [endDate]);
        }
        res.json(sales.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;