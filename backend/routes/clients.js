const express = require('express');
const clientsService = require('../services/clientsService');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const clients = await clientsService.listClients();
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const { client_full_name, client_birthday, client_phone_number } = req.body;
        const newClient = await clientsService.addClient({
            client_full_name,
            client_birthday,
            client_phone_number
        });
        res.json(newClient);
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { client_full_name, client_birthday, client_phone_number } = req.body;
        await clientsService.editClient(id, {
            client_full_name,
            client_birthday,
            client_phone_number
        });
        res.json('Данные клиента обновлены');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await clientsService.removeClient(id);
        res.json('Клиент удален');
    } catch (err) {
        console.error(err.message);
        res.status(500).json(err.message);
    }
});

module.exports = router;