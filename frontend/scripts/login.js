import { initModal, showModal } from "./modal.js";
import { serverLink } from "./config.js";

const phoneInput = document.getElementById('phone-input'),
      passwordInput = document.getElementById('password-input'),
      form = document.getElementById('login-form');

const maskOptions = {
    mask: '{8}(000)000-00-00'
};
const mask = IMask(phoneInput, maskOptions);

fetch('../components/modal.html')
.then(res => res.text())
.then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    initModal();
})
.catch(err => console.error('Ошибка загрузки модального окна:', err));

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = phoneInput.value,
          password = passwordInput.value;
    if (!phone || !password) {
        showModal('Заполните обязательные поля ввода');
        return;
    }
    const phoneFormat = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
    if (!phoneFormat.test(phone)) {
        showModal('Введены некорректные данные');
        return;
    }
    fetch(serverLink + 'auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ phone, password }),
    })
    .then(response => response.json())
    .then(result => {
        form.reset();
        if (result.success) {
            if (result.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (result.role === 'coach') {
                window.location.href = 'coach.html';
            } else if (result.role === 'client') {
                window.location.href = 'client.html';
            }
        } else {
            showModal(result.message);
        }
    });
});