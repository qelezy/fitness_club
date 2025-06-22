let modal, modalOverlay, closeModalBtn, OkModalBtn;

function closeModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
}

export function initModal() {
    modal = document.getElementById('modal');
    modalOverlay = document.getElementById('modal-overlay');
    closeModalBtn = document.getElementById('close-modal-btn');
    OkModalBtn = document.getElementById('ok-modal-btn');

    closeModalBtn.addEventListener('click', closeModal);
    OkModalBtn.addEventListener('click', closeModal);
}

export function showModal(message) {
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = '';
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    modalContent.appendChild(paragraph);
    modal.classList.add('show');
    modalOverlay.classList.add('show');
}