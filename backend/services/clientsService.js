const clientsRepository = require('../repositories/clientsRepository');

async function listClients() {
    return clientsRepository.getAllClients();
}

async function addClient(data) {
    return clientsRepository.createClient(data);
}

async function editClient(id, data) {
    await clientsRepository.updateClient(id, data);
}

async function removeClient(id) {
    await clientsRepository.deleteClient(id);
}

module.exports = {
    listClients,
    addClient,
    editClient,
    removeClient
};

