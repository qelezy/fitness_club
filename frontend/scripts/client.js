import { initModal, showModal } from "./modal.js";
import { serverLink } from "./config.js";

const logoutBtn = document.getElementById('logout-btn'),
      navItems = document.querySelectorAll('.nav-item'),
      activeContainer = document.getElementById('active-subscription'),
      pendingContainer = document.getElementById('pending-subscriptions'),
      showButton = document.getElementById('show-pending'),
      closeModalBtn = document.getElementById('close-modal-btn'),
      toggleButtons = document.querySelectorAll('.toggle-btn'),
      views = document.querySelectorAll('.training-view'),
      selected = document.getElementById('selected-coach'),
      optionsContainer = document.getElementById('coach-options'),
      dropdown = document.getElementById('coach-dropdown'),
      form = document.getElementById('individual-form');

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
        fetchUserSubscriptions();
        fetchUserTrainings();
    });
}

function fetchUserSubscriptions() {
    fetch(serverLink + 'subscriptions/get_by_user', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(subscriptions => {
        const active = subscriptions.find(sub => sub.subscription_status === true);
        const pending = subscriptions.filter(sub => !sub.subscription_start_date);
        if (active) {
            activeContainer.innerHTML = renderSubscriptionCard(active, 'Активный абонемент');
        } else {
            activeContainer.innerHTML = '<p>Нет активного абонемента</p>';
        }
        showButton.addEventListener('click', () => {
            pendingContainer.innerHTML = '';
            if (pending.length === 0) {
                pendingContainer.innerHTML = '<p>Нет купленных абонементов</p>';
            } else {
                pending.forEach(sub => {
                    const card = document.createElement('div');
                    card.classList.add('subscription-card');
                    card.innerHTML = `
                        <h3>Абонемент на ${sub.subscription_validity_period} мес.</h3>
                        <div class="subscription-card-item">
                            <span>Куплен:</span>
                            <span>${new Date(sub.subscription_purchase_date).toISOString().split('T')[0]}</span>
                        </div>
                        <div class="subscription-card-item">
                            <span>Цена:</span>
                            <span>${sub.subscription_price} ₽</span>
                        </div>
                        <button class="activate-btn" data-id="${sub.id}">Активировать</button>
                    `;
                    pendingContainer.appendChild(card);
                });
                document.querySelectorAll('.activate-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.dataset.id;
                        const startDate = new Date().toISOString().split('T')[0];
                        fetch(serverLink + `subscriptions/activate/${id}`, {
                            method: 'PUT',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                start_date: startDate
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.message) {
                                showModal(data.message);
                            }
                        });
                    });
                });
            }
            document.getElementById('pending-modal').classList.add('show');
            document.getElementById('pending-modal-overlay').classList.add('show');
        });
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('pending-modal').classList.remove('show');
            document.getElementById('pending-modal-overlay').classList.remove('show');
        });
    });
}

function renderSubscriptionCard(sub, title) {
    return `
        <div class="subscription-card">
          <h3>${title}</h3>
          <div class="subscription-card-item">
            <span>Куплен:</span>
            <span>${new Date(sub.subscription_purchase_date).toISOString().split('T')[0]}</span>
          </div>
          <div class="subscription-card-item">
            <span>Действует с:</span>
            <span>${new Date(sub.subscription_start_date).toISOString().split('T')[0]}</span>
          </div>
          <div class="subscription-card-item">
            <span>Срок:</span>
            <span>${sub.subscription_validity_period} мес.</span>
          </div>
          <div class="subscription-card-item">
            <span>Цена:</span>
            <span>${sub.subscription_price} ₽</span>
          </div>
          <div class="subscription-card-item">
            <span>Статус:</span>
            <span>${sub.subscription_status ? 'Активен' : 'Неактивен'}</span>
          </div>
        </div>
    `;
}

function fetchUserTrainings() {
    fetch(serverLink + 'trains/get_by_user', {
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
                    <td>Тренер: ${t.coach_full_name}</td>
                </table>
            `;
            const btn = document.createElement('button');
            btn.className = 'cancel-btn';
            btn.textContent = 'Отменить';
            btn.addEventListener('click', () => cancelTraining(t.training_session_id));
            li.appendChild(btn);
            list.appendChild(li);
        });
    });
}

function cancelTraining(trainingId) {
    fetch(serverLink + `trains/${trainingId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showModal(data.message);
        }
    });
}

toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        views.forEach(view => view.classList.remove('active'));
        const type = btn.dataset.type;
        document.getElementById(`${type}-trainings`)?.classList.add('active');
    });
});

function enrollTraining(trainingId) {
    fetch(serverLink + 'trains/group/enroll', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ training_session_id: trainingId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showModal(data.message);
            const activeDateBtn = document.querySelector('.calendar-weeks button.active');
            if (activeDateBtn) {
                loadGroupTrainings(activeDateBtn.dataset.date);
            }
        }
    })
    .catch(err => {
        console.error('Ошибка записи:', err);
        showModal('Ошибка при записи на тренировку');
    });
}

function generateWeeks() {
    const start = new Date();
    const calendarWeeks = document.getElementById('calendar-weeks');

    for (let i = 0; i < 14; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const btn = document.createElement('button');
        btn.textContent = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
        btn.dataset.date = d.toISOString().split('T')[0];
        btn.addEventListener('click', () => {
            document.querySelectorAll('.calendar-weeks button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGroupTrainings(btn.dataset.date);
        });
        calendarWeeks.appendChild(btn);
    }
    const firstBtn = calendarWeeks.querySelector('button');
    if (firstBtn) {
        firstBtn.classList.add('active');
        loadGroupTrainings(firstBtn.dataset.date);
    }
}

function loadGroupTrainings(date) {
    const container = document.getElementById('group-training-list');
    
    fetch(serverLink + `training_sessions/group_trainings/${date}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(trainings => {
        container.innerHTML = '';
        if (!trainings || trainings.length === 0) {
            container.innerHTML = '<p>Нет тренировок на выбранную дату.</p>';
            return;
        }
        trainings.forEach(t => {
            const free = t.training_session_max_members - t.taken;
            const startTime = t.training_session_start_time.slice(0, 5);
            const endTime = getEndTime(startTime, t.training_session_duration);
            const date = new Date(t.training_session_date).toISOString().split('T')[0]
            const card = document.createElement('div');
            card.className = 'training-card';
            card.innerHTML = `
                <div class="training-header">
                    <div class="training-hall">
                        <span>Зал №${t.hall_id}</span>
                    </div>
                    <div class="training-time">
                        <span>${startTime} — ${endTime}</span>
                    </div>
                </div>
                <div class="training-body">
                    <div class="training-body-item">
                        <span>Тренер:</span>
                        <span>${t.coach_full_name.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <div class="training-body-item">
                        <span>Осталось мест:</span>
                        <span>${free}</span>
                    </div>
                </div>              
            `;
            const btn = document.createElement('button');
            btn.className = 'enroll-btn';
            btn.textContent = free === 0 ? 'Нет мест' : 'Записаться';
            btn.disabled = free === 0;
            btn.addEventListener('click', () => enrollTraining(t.training_session_id));
            const footer = document.createElement('div');
            footer.className = 'training-footer';
            footer.appendChild(btn);
            card.appendChild(footer);
            container.appendChild(card);
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

function getHallCategory(category) {
    switch (category) {
        case 1:
            return 'Бассейн';
        case 2:
            return 'Боевых искусств';
        case 3:
            return 'Тренажерный';
        case 4:
            return 'Танцевальный';
        case 5:
            return 'Для йоги';
        case 6:
            return 'Для аэробики';
    }
}

function fetchCoaches() {
    fetch(serverLink + 'coaches', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        createCoachesCards(data);
    });
}

function loadSubscriptions() {
    const subscriptions = [
        { title: '1 месяц', price: 2000, duration: 1 },
        { title: '3 месяца', price: 5000, duration: 3 },
        { title: '6 месяцев', price: 10000, duration: 6 },
        { title: '12 месяцев', price: 18000, duration: 12 }
    ];

    const grid = document.querySelector('.subscriptions-grid');

    subscriptions.forEach((plan, index) => {
        const card = document.createElement('div');
        card.className = 'subscription-card';
        card.innerHTML = `
            <h3>${plan.title}</h3>
            <div class="price">${plan.price} ₽</div>
            <button data-index="${index}">Выбрать</button>
        `;
        grid.appendChild(card);
    });

    grid.addEventListener('click', function (e) {
        if (e.target.tagName === 'BUTTON') {
            const index = e.target.getAttribute('data-index');
            const selectedPlan = subscriptions[index];

            console.log('Оформляется абонемент:', selectedPlan);

            const today = new Date();
            const purchaseDate = today.toISOString().split('T')[0];

            fetch(serverLink + 'subscriptions/add', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    duration: selectedPlan.duration,
                    price: selectedPlan.price,
                    purchase_date: purchaseDate
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    showModal(data.message);
                }
            });
        }
    });
}

function createCoachesCards(coaches) {
    const container = document.querySelector('.coaches-grid');
    container.innerHTML = coaches.map(getCoachCard).join('');
}

function getCoachCard(coach) {
    return `
        <div class="coach-card">
            <div class="img-container">
                <i class="bi-person-circle"></i>
            </div>
            <div class="coach-card-content">
                <h3>${coach.coach_full_name.split(' ').slice(0, 2).join(' ')}</h3>
                <div class="coach-card-item">
                    <span>Специализация:</span>
                    <span>${coach.coach_specialization}</span>
                </div>
                <div class="coach-card-item">
                    <span>Телефон:</span>
                    <span>${coach.coach_phone_number}</span>
                </div>
            </div>
        </div>
    `;
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

function fetchIndividualCoaches() {
    fetch(serverLink + 'coaches', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(coaches => {
        coaches.forEach(coach => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = `${coach.coach_full_name} — ${coach.coach_specialization}`;
            option.dataset.id = coach.coach_id;

            option.addEventListener('click', () => {
                selected.textContent = option.textContent;
                selected.dataset.id = option.dataset.id;
                optionsContainer.style.display = 'none';
            });

            optionsContainer.appendChild(option);
        });
    });
}

selected.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
        optionsContainer.style.display = 'none';
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const coachId = selected.dataset.id;
    const date = document.getElementById('individual-date').value;
    const time = document.getElementById('individual-time').value;
    if (!coachId) {
        showModal('Выберите тренера');
        return;
    }
    if (!date || !time) {
        showModal('Заполните дату и время');
        return;
    }
    fetch(serverLink + 'trains/individual/enroll', {
        method: 'POST',
        credentials: 'include',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            coach_id: coachId,
            date: date,
            time: time
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showModal(data.message);
        }
    })
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        item.classList.add('active');
        const targetSection = item.getAttribute('data-section');
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(targetSection).classList.add('active');
        if (targetSection === 'profile') {
            fetchProfile();
        } else if (targetSection === 'coaches') {
            fetchCoaches();
        } else if (targetSection === 'subscription') {
            loadSubscriptions();
        } else if (targetSection === 'booking') {
            generateWeeks();
            fetchIndividualCoaches();
        }
    });
});

