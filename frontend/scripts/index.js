import { serverLink } from "./config.js";
fetch(serverLink + 'auth/check')
.then(res => res.json())
.then(data => {
    if (!data.authenticated) {
        window.location.href = 'pages/login.html';
    } else {
        switch (data.role) {
            case 'admin':
                window.location.href = 'pages/admin.html';
                break;
            case 'client':
                window.location.href = 'pages/client.html';
                break;
            case 'coach':
                window.location.href = 'pages/coach.html';
                break;
        }
    }
})
.catch(err => {
    console.error('Ошибка:', err);
    window.location.href = 'pages/login.html';
});