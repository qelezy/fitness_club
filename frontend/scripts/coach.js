import { initModal, showModal } from "./modal.js";
import { serverLink } from "./config.js";

const logoutBtn = document.getElementById('logout-btn');

fetch(serverLink + 'auth/check', {
    method: 'POST',
    credentials: 'include'
})
.then(res => res.json())
.then(data => {
    if (!data.authenticated) {
        window.location.href = 'login.html';
    }
});

fetch('../components/modal.html')
.then(res => res.text())
.then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    initModal();
});

fetchProfile();

function fetchProfile() {
    fetch(serverLink + 'auth/profile', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('user-full-name').textContent = data.full_name;
        document.getElementById('user-phone').textContent = data.phone;
        fetchUserTrainings();
    });
}

function fetchUserTrainings() {
    fetch(serverLink + 'trains/get_by_coach', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(trainings => {
        const list = document.getElementById('bookings');
        list.innerHTML = '';
        if (!trainings || trainings.length === 0) {
            list.innerHTML = '<p style="text-align:center;">Нет записей на тренировки.</p>';
            return;
        }
        trainings.forEach(t => {
            const li = document.createElement('li');
            li.className = 'booking-item';

            const startTime = t.training_session_start_time.slice(0, 5);
            const endTime = getEndTime(startTime, t.training_session_duration);

            li.innerHTML = `
                <table>
                    <td>${new Date(t.training_session_date).toISOString().split('T')[0]} | ${startTime}–${endTime}</td>
                    <td>Зал №${t.hall_id}</td>
                    <td>${t.training_session_type ? 'Групповая' : 'Индивидуальная'}</td>
                    <td><strong>Клиенты:</strong>
                        <ul>
                            ${
                                t.clients && t.clients.length > 0
                                    ? t.clients.map(c => `<li>${c.client_full_name}</li>`).join('')
                                    : '<li>Нет записанных клиентов</li>'
                            }
                        </ul>
                    </td>
                </table>
            `;
            list.appendChild(li);
        });
    });
}

function getEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');

    return `${endHours}:${endMinutes}`;
}

logoutBtn.addEventListener('click', async () => {
    try {
        const res = await fetch(serverLink + 'auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (res.ok) {
            window.location.href = 'login.html';
        } else {
            console.error('Ошибка при выходе');
        }
    } catch (err) {
        console.error('Ошибка сети', err);
    }
});