import { initModal, showModal } from "./modal.js";
import { serverLink } from "./config.js";

const fullNameInput = document.getElementById('full-name-input'),
      phoneInput = document.getElementById('phone-input'),
      birthdayInput = document.getElementById('date-input'),
      passwordInput = document.getElementById('password-input'),
      repeatPasswordInput = document.getElementById('repeat-password-input'),
      form = document.getElementById('signup-form');

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
    const fullName = fullNameInput.value,
          phone = phoneInput.value,
          birthday = birthdayInput.value,
          password = passwordInput.value,
          repeatPassword = repeatPasswordInput.value;
    if (!fullName || !phone || !password || !repeatPassword) {
        showModal('Заполните обязательные поля ввода');
        return;
    }
    if (password !== repeatPassword) {
        showModal("Пароли не совпадают");
        return;
    }
    const phoneFormat = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
    if (!phoneFormat.test(phone)) {
        showModal('Введены некорректные данные');
        return;
    }
    fetch(serverLink + 'auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, phone, birthday, password }),
    })
    .then(response => response.json())
    .then(result => {
        form.reset();
        if (result.success) {
            window.location.href = 'login.html';
        } else {
            showModal(result.message);
        }
    });
});