const pool = require('../database');

async function getAllClients() {
    const result = await pool.query(
        'SELECT client_id, client_full_name, client_birthday, client_phone_number FROM client ORDER BY client_id ASC'
    );
    return result.rows;
}

async function createClient({ client_full_name, client_birthday, client_phone_number }) {
    const result = await pool.query(
        'INSERT INTO client (client_full_name, client_birthday, client_phone_number) VALUES ($1, $2, $3) RETURNING *',
        [client_full_name, client_birthday, client_phone_number]
    );
    return result.rows[0];
}

async function updateClient(id, { client_full_name, client_birthday, client_phone_number }) {
    await pool.query(
        'UPDATE client SET client_full_name = $1, client_birthday = $2, client_phone_number = $3 WHERE client_id = $4',
        [client_full_name, client_birthday, client_phone_number, id]
    );
}

async function deleteClient(id) {
    await pool.query('DELETE FROM client WHERE client_id = $1', [id]);
}

module.exports = {
    getAllClients,
    createClient,
    updateClient,
    deleteClient
};

