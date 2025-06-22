import { serverLink } from './config.js';

let navItem, sidebar, sidebarBtn, logoutBtn;

export function initSidebar() {
    navItem = document.getElementsByClassName('nav-item-content');
    sidebar = document.getElementById('sidebar');
    sidebarBtn = document.getElementById('sidebar-btn');
    logoutBtn = document.getElementById('logout-btn');

    initItems(navItem);
    initSidebarToggle();
    initLogout();
    initOutsideClickClose();
    initUsernameDisplay();
}

function initItems(navItemList) {
    for (const item of navItemList) {
        item.addEventListener('click', handleNavItemClick);
    }
}

function handleNavItemClick(e) {
    let itemParent = e.target.closest('li');
    if (!itemParent) return;
    if (sidebar.classList.contains('close')) {
        for (let child of itemParent.parentElement.children) {
            if (child !== itemParent && child.classList.contains('show-menu')) {
                child.classList.remove('show-menu');
                resetSubMenu(child);
            }
        }
    }

    itemParent.classList.toggle('show-menu');
    const subMenu = itemParent.querySelector('.nav-item-sub-menu');

    if (!subMenu) return;

    if (sidebar.classList.contains('close')) {
        subMenu.style.transition = 'opacity 0.1s';
        subMenu.style.maxHeight = itemParent.classList.contains('show-menu') ? subMenu.scrollHeight + 'px' : null;
        subMenu.style.opacity = itemParent.classList.contains('show-menu') ? 1 : 0;
    } else {
        const arrow = itemParent.querySelector('.arrow');
        if (arrow) arrow.classList.toggle('rotated');

        subMenu.style.transition = 'max-height 0.3s';
        if (subMenu.style.maxHeight) {
            subMenu.style.maxHeight = null;
            subMenu.style.opacity = 0;
        } else {
            subMenu.style.maxHeight = subMenu.scrollHeight + 'px';
            subMenu.style.opacity = 1;
        }
    }
}

function resetSubMenu(menuItem) {
    const subMenus = menuItem.getElementsByClassName('nav-item-sub-menu');
    for (const sm of subMenus) {
        sm.style.maxHeight = null;
        sm.style.transition = 'max-height 0s';
        sm.style.opacity = 0;
    }
}

function initSidebarToggle() {
    sidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('close');
        const arrows = document.getElementsByClassName('arrow');
        for (const arrow of arrows) {
            arrow.classList.remove('rotated');
        }

        const openedMenus = document.getElementsByClassName('show-menu');
        for (const menu of openedMenus) {
            menu.classList.remove('show-menu');
            resetSubMenu(menu);
        }
    });
}

function initLogout() {
    logoutBtn.addEventListener('click', logoutUser);
}

async function logoutUser() {
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
}

function initOutsideClickClose() {
    document.addEventListener('click', (e) => {
        let isClicked = false;
        for (const item of navItem) {
            if (item.contains(e.target)) {
                isClicked = true;
            }
        }
        if (!isClicked && sidebar.classList.contains('close')) {
            const openedMenus = document.getElementsByClassName('show-menu');
            for (const menu of openedMenus) {
                menu.classList.remove('show-menu');
                resetSubMenu(menu);
            }
        }
    });
}

function formatFullName(fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    const [lastName, firstName, surname] = parts;
    const initials = `${firstName?.[0] || ''}.${surname?.[0] || ''}.`;
    return `${lastName} ${initials}`;
}

async function initUsernameDisplay() {
    try {
        const res = await fetch(serverLink + 'auth/username', {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Ошибка получения пользователя');

        const data = await res.json();
        const username = document.querySelector('.user-profile-btn .username');
        if (username && data.full_name) {
            username.textContent = formatFullName(data.full_name);
        }
    } catch (err) {
        console.log(err);
        window.location.href = 'login.html';
    }
}
