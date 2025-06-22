import { initModal, showModal } from "./modal.js";
import { initSidebar } from "./sidebar.js";
import { serverLink } from "./config.js";

const tables = document.getElementById('tables'),
      tableName = document.getElementById('table-name'),
      tableHeader = document.getElementById('table-header'),
      tableContent = document.getElementById('table-content'),
      reports = document.getElementById('reports'),
      reportName = document.getElementById('report-name'),
      reportHeader = document.getElementById('report-header'),
      reportContent = document.getElementById('report-content'),
      resetBtn = document.getElementById('reset-btn'),
      searchInput = document.getElementById('search-input'),
      showColumnBtn = document.getElementById('show-column-btn'),
      addRecordBtn = document.getElementById('add-record'),
      editRecordBtn = document.getElementById('edit-record'),
      deleteRecordBtn = document.getElementById('delete-record'),
      confirmAddRecordBtn = document.getElementById('confirm-add-record'),
      confirmEditRecordBtn = document.getElementById('confirm-edit-record'),
      saveTable = document.getElementById('save-table'),
      saveReport = document.getElementById('save-report'),
      filterBtn = document.getElementById('filter-btn'),
      reportWindow = document.getElementById('report-window'),
      mainWindow = document.getElementById('main-window'),
      startInfo = document.getElementById('start-info'),
      profileWindow = document.getElementById('profile-window'),
      profileBtn = document.getElementById('user-profile-btn');

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

initSidebar();

fetch('../components/modal.html')
.then(res => res.text())
.then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    initModal();
});

let currentPage = 1;
let totalRecords;
let tableNameStr = '';
let reportNameStr = ''
let data = [];
let filteredData = [];
let activeFilters = [];

profileBtn.addEventListener('click', () => {
    fetch(serverLink + 'auth/profile', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('user-full-name').textContent = data.full_name;
        document.getElementById('user-phone').textContent = data.phone;

        if (startInfo.style.display != 'none') {
            profileWindow.style.display = 'flex';
            startInfo.style.display = 'none';
        }
        if (mainWindow.style.display != 'none') {
            profileWindow.style.display = 'flex';
            mainWindow.style.display = 'none';
        }
        if (reportWindow.style.display != 'none') {
            profileWindow.style.display = 'flex';
            reportWindow.style.display = 'none';
        }
    });
});

filterBtn.addEventListener('click', () => {
    const filterDropdownContent = document.querySelector('.filter-dropdown-content');
    const filterFields = getFilterFields();
    filterDropdownContent.innerHTML = '';
    filterDropdownContent.classList.toggle('show');
    const dropdown = document.createElement('div');
    dropdown.classList.add('filter-select');
    if (!filterFields) {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Для этой таблицы не предусмотрены фильтры';
        dropdown.appendChild(paragraph);
        filterDropdownContent.appendChild(dropdown);
        return;
    }
    const dropdownBtn = document.createElement('button');
    dropdownBtn.innerHTML = '<span>Выберите столбец</span><i class="bi-chevron-down arrow"></i>';
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('filter-select-content');
    filterFields.forEach(field => {
        const item = document.createElement('div');
        item.classList.add('filter-option');
        item.textContent = field.label;
        item.setAttribute('data-key', field.key);
        item.setAttribute('data-filter-header', field.header);
        item.addEventListener('click', (e) => {
            const btnText = dropdownBtn.querySelector('span');
            const selectedField = e.target.getAttribute('data-key');
            const selectedHeader = e.target.getAttribute('data-filter-header');
            const selectedLabel = e.target.textContent;
            dropdownBtn.querySelector('.arrow').classList.remove('rotated');
            dropdownContent.classList.toggle('show');
            btnText.textContent = item.textContent;
            const existing = filterDropdownContent.querySelector('.filter-content-body');
            if (existing) {
                existing.remove();
            }
            createFilterInputs(selectedField, selectedHeader, selectedLabel);
        })
        dropdownContent.appendChild(item);
    });
    dropdown.appendChild(dropdownBtn);
    dropdown.appendChild(dropdownContent);
    filterDropdownContent.appendChild(dropdown);

    dropdownBtn.addEventListener('click', () => {
        dropdownBtn.querySelector('.arrow').classList.toggle('rotated');
        dropdownContent.classList.toggle('show');
    });
});

function createFilterInputs(fieldKey, fieldHeader, fieldLabel) {
    const filterDropdownContent = document.querySelector('.filter-dropdown-content');
    const filterGroupContent = document.createElement('div');
    filterGroupContent.classList.add('filter-content-body');
    let filterHTML = '';
    const filterGroup = document.createElement('div');
    filterGroup.classList.add('filter-content-group');
    switch (fieldKey) {
    case 'date':
        filterHTML = `
            <div class="date-container">
                <label>от</label>
                <input type="date">
            </div>
            <div class="date-container">
                <label>до</label>
                <input type="date">
            </div>
        `;
        break;

    case 'time':
        filterHTML = `
            <div class="time-container">
                <label>от</label>
                <input type="text">
            </div>
            <div class="time-container">
                <label>до</label>
                <input type="text">
            </div>
        `;
        break;

    case 'category':
        filterHTML = `
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" value="1" checked> Бассейн
                </label>
                <label>
                    <input type="checkbox" value="2" checked> Боевых искусств
                </label>
                <label>
                    <input type="checkbox" value="6" checked> Для аэробики
                </label>
                <label>
                    <input type="checkbox" value="5" checked> Для йоги
                </label>
                <label>
                    <input type="checkbox" value="4" checked> Танцевальный
                </label>
                <label>
                    <input type="checkbox" value="3" checked> Тренажерный
                </label>
            </div>
        `;
        break;

    case 'number':
        filterHTML = `
            <div class="number-container">
                <label>от</label>
                <input type="number">
            </div>
            <div class="number-container">
                <label>до</label>
                <input type="number">
            </div>
        `;
        break;

    case 'status':
        filterHTML = `
            <div class="radio-group">
                <label>
                    <input type="radio" name="status" value="true"> Активен
                </label>
                <label>
                    <input type="radio" name="status" value="false"> Неактивен
                </label>
            </div>
        `;
        break;

    case 'type':
        filterHTML = `
            <div class="radio-group">
                <label>
                    <input type="radio" name="status" value="false"> Индивидуальная
                </label>
                <label>
                    <input type="radio" name="status" value="true"> Групповая
                </label>
            </div>
        `;
        break;
    }
    filterGroup.innerHTML = filterHTML;
    filterGroupContent.appendChild(filterGroup);
    const btn = document.createElement('button');
    btn.classList.add('apply-filter');
    btn.textContent = 'Применить';
    filterGroupContent.appendChild(btn);
    filterDropdownContent.appendChild(filterGroupContent)
    btn.addEventListener('click', () => {
        applyFilter(fieldHeader, fieldLabel);
        filterDropdownContent.classList.remove('show');
    });
}

function applyFilter(fieldHeader, fieldLabel) {
    const filters = { key: fieldHeader };
    let values = [];
    const filterDropdownContent = document.querySelector('.filter-dropdown-content');
    filterDropdownContent.querySelectorAll('input[type="text"]').forEach((input, index) => {
        if (input.value) {
            values.push({index: index, value: input.value});
        }
    });
    filterDropdownContent.querySelectorAll('input[type="number"]').forEach((input, index) => {
        if (input.value) {
            values.push({index: index, value: parseInt(input.value)});
        }
    });
    filterDropdownContent.querySelectorAll('input[type="date"]').forEach((input, index) => {
        if (input.value) {
            values.push({index: index, value: input.value});
        }
    });
    filterDropdownContent.querySelectorAll('input[type="checkbox"]:checked').forEach((input, index) => {
        values.push({index: index, value: parseInt(input.value)});
    });
    filterDropdownContent.querySelectorAll('input[type="radio"]:checked').forEach((input, index) => {
        values.push({index: index, value: (input.value === 'true') ? true : false});
    });

    const existingFilterIndex = activeFilters.findIndex(filter => filter.key === filters.key);
    if (existingFilterIndex !== -1) {
        activeFilters.splice(existingFilterIndex, 1);
    }

    filters.values = values;
    if (filters.values.length === 0) {
        showModal('Для фильтра не установлено значение');
        return;
    }
    activeFilters.push(filters);
    filterData(filters);
    addFilterItem(fieldLabel, filters);
    currentPage = 1;
    totalRecords = filteredData.length;
    tableContent.innerHTML = '';
    displayBody();
}

function filterData(filters) {
    filteredData = filteredData.filter(item => {
        if (!filters.key.includes('status') && !filters.key.includes('type') && !! !filters.key.includes('category')) {
            const fromValue = filters.values.find(({ index }) => index === 0)?.value;
            const toValue = filters.values.find(({ index }) => index === 1)?.value;
            if (filters.key.includes('_date') || filters.key.includes('birthday')) {
                const itemValue = formatDate(item[filters.key]);
                if (fromValue !== undefined && toValue !== undefined) {
                    return itemValue >= fromValue && itemValue <= toValue;
                } else if (fromValue !== undefined) {
                    return itemValue >= fromValue;
                } else if (toValue !== undefined) {
                    return itemValue <= toValue;
                }
            } else {
                if (fromValue !== undefined && toValue !== undefined) {
                    return item[filters.key] >= fromValue && item[filters.key] <= toValue;
                } else if (fromValue !== undefined) {
                    return item[filters.key] >= fromValue;
                } else if (toValue !== undefined) {
                    return item[filters.key] <= toValue;
                }
            }
        } else if (filters.key.includes('category')) {
            return filters.values.some(({ value }) => item[filters.key] === value);
        } else if (filters.key.includes('status') || filters.key.includes('type')) {
            const filterValue = filters.values[0]?.value;
            return item[filters.key] === filterValue;
        }
        return true;
    });
}

function addFilterItem(fieldLabel, filters) {
    const filterBody = document.querySelector('.filter-body');
    const filterItem = document.createElement('div');
    filterItem.classList.add('filter-item');
    const filterText = document.createElement('span');
    const filterValues = filters.values.map(({ index, value }) => {
        if (!filters.key.includes('status') && !filters.key.includes('type') && !! !filters.key.includes('category')) {
            if (index === 0) return `от: ${value}`;
            if (index === 1) return `до: ${value}`;
        } else if (filters.key.includes('status')) {
            return `${value ? 'Активен' : 'Неактивен'}`;
        } else if (filters.key.includes('type')) {
            return `${value ? 'Групповая' : 'Индивидуальная'}`;
        } else if (filters.key.includes('category')) {
            return `${getHallCategory(value)}`;
        }
        return value;
    }).join(', ');
    filterText.textContent = `${fieldLabel} - ${filterValues}`;
    filterItem.appendChild(filterText);

    const closeBtn = document.createElement('i');
    closeBtn.classList.add('bi-x');
    closeBtn.addEventListener('click', () => {
        const filterKey = filterItem.getAttribute('data-key');
        activeFilters = activeFilters.filter(filter => filter.key !== filterKey);
        filteredData = data;
        activeFilters.forEach(filter => {
            filteredData = filteredData.filter(item => {
                if (!filter.key.includes('status') && !filter.key.includes('type') && !filter.key.includes('category')) {
                    const fromValue = filters.values.find(({ index }) => index === 0)?.value;
                    const toValue = filters.values.find(({ index }) => index === 1)?.value;
                    if (filters.key.includes('_date') || filters.key.includes('birthday')) {
                        const itemValue = formatDate(item[filters.key]);
                        if (fromValue !== undefined && toValue !== undefined) {
                            return itemValue >= fromValue && itemValue <= toValue;
                        } else if (fromValue !== undefined) {
                            return itemValue >= fromValue;
                        } else if (toValue !== undefined) {
                            return itemValue <= toValue;
                        }
                    } else {
                        if (fromValue !== undefined && toValue !== undefined) {
                            return item[filters.key] >= fromValue && item[filters.key] <= toValue;
                        } else if (fromValue !== undefined) {
                            return item[filters.key] >= fromValue;
                        } else if (toValue !== undefined) {
                            return item[filters.key] <= toValue;
                        }
                    }
                } else if (filter.key.includes('category')) {
                    return filter.values.some(({ value }) => item[filter.key] === value);
                } else if (filter.key.includes('status') || filter.key.includes('type')) {
                    const filterValue = filter.values[0]?.value;
                    return item[filter.key] === filterValue;
                }
                return true;
            });
        });
        currentPage = 1;
        totalRecords = filteredData.length;
        filterBody.removeChild(filterItem);
        tableContent.innerHTML = '';
        displayBody();
    });
    filterItem.appendChild(closeBtn);
    filterItem.setAttribute('data-key', filters.key);
    filterBody.appendChild(filterItem);
}

function getFilterFields() {
    switch (tableNameStr) {
        case 'administators':
        case 'coaches':
            return null;
        case 'clients':
            return [
                { key: 'date', label: 'Дата рождения', header: 'client_birthday' },
            ];
        case 'halls':
            return [
                { key: 'category', label: 'Категория', header: 'hall_category' },
            ];
        case 'subscriptions':
            return [
                { key: 'date', label: 'Дата приобретения', header: 'subscription_purchase_date' },
                { key: 'date', label: 'Дата начала действия', header: 'subscription_start_date' },
                { key: 'number', label: 'Срок действия, мес.', header: 'subscription_validity_period' },
                { key: 'status', label: 'Статус', header: 'subscription_status' },
                { key: 'number', label: 'Цена, руб.', header: 'subscription_price' },
            ];
        case 'training_sessions':
            return [
                { key: 'date', label: 'Дата', header: 'training_session_date' },
                { key: 'time', label: 'Время начала', header: 'training_session_start_time' },
                { key: 'number', label: 'Продолжительность, мин.', header: 'training_session_duration' },
                { key: 'type', label: 'Тип', header: 'training_session_type' },
                { key: 'number', label: 'Максимум участников', header: 'training_session_max_members' },
            ];
    }
}

saveReport.addEventListener('click', () => {
    const formReportSection = document.querySelector('.form-report-section');
    if (formReportSection.classList.contains('show')) {
        showModal('Для сохранения отчёта необходимо сначала его отобразить');
        return;
    }
    generateReportPDF();
});

function generateReportPDF() {
    const converted = htmlToPdfmake(`<h2>${reportName.textContent}</h2>` + getReport());
    const docDefinition = { 
        content: [
            converted,
            reportNameStr === 'sales' ? { text: `Итого: ${filteredData[filteredData.length - 1]['subscription_price']} руб.`, alignment: 'right' } : ''
        ],
        pageOrientation: 'landscape'
    };
    pdfMake.createPdf(docDefinition).download(`${reportNameStr}.pdf`);
}

function getReport() {
    let table = `<table>`;
    table += '<thead>';
    table += getReportHeader();
    table += '<thead>';
    table += '<tbody>';
    table += getReportBody();
    table += '<tbody>';
    table += '</table>';
    return table;
}

function getReportBody() {
    let body = '';
    filteredData.forEach(item => {
        let keys = Object.keys(item);
        let row = '<tr>';
        for (const key of keys) {
            const value = item[key];
            if (typeof value === 'boolean' && key === 'subscription_status') {
                row += `<td>${value ? 'Активен' : 'Неактивен'}</td>`;
            } else if (typeof value === 'boolean' && key === 'training_session_type') {
                row += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
            } else if (typeof value === 'number' && key === 'hall_category') {
                row += `<td>${getHallCategory(value)}</td>`;
            } else if (value === null) {
                if (key === 'client_full_name' && reportNameStr === 'sales') {
                    break;
                } else {
                    row += `<td class="null">[${value}]</td>`;
                }
            } else if (typeof value === 'string' && value.match(/[-TZ]/) && !isNaN(Date.parse(value))) {
                row += `<td>${formatDate(value)}</td>`;
            } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
                row += `<td>${value.slice(0, -3)}</td>`;
            } else {
                row += `<td>${value}</td>`;
            }
        }
        row += '</tr>';
        body += row;
    });
    return body;
}

for (const report of reports.children) {
    report.addEventListener('click', (e) => {
        if (e.target.tagName == 'SPAN' && !e.target.parentElement.classList.contains('sub-menu-header')) {
            reportName.innerText = e.target.innerText;
            reportNameStr = e.target.attributes.value.value;
            document.querySelector('.add-record-container').classList.remove('show');
            document.querySelector('.edit-record-container').classList.remove('show');
            document.querySelector('.filter-dropdown-content').classList.remove('show');
            activeFilters = [];
            [...document.querySelector('.filter-body').children].forEach(item => {
                item.remove();
            });
            if (startInfo.style.display != 'none') {
                reportWindow.style.display = 'flex';
                startInfo.style.display = 'none';
            }
            if (mainWindow.style.display != 'none') {
                reportWindow.style.display = 'flex';
                mainWindow.style.display = 'none';
            }
            if (profileWindow.style.display != 'none') {
                reportWindow.style.display = 'flex';
                profileWindow.style.display = 'none';
            }
            createReportWindow();
        }
    });
}

function createReportWindow() {
    const formReportSection = document.querySelector('.form-report-section');
    formReportSection.classList.add('show');
    const reportHTML = `
        <div class="form-report-content">
            <div class="date-range">
                <label for="start-date">Левая граница даты:</label>
                <input type="date" id="start-date">
            </div>
            <div class="date-range">
                <label for="end-date">Правая граница даты:</label>
                <input type="date" id="end-date">
            </div>
            <button id="generate-report-btn">Показать отчёт</button>
        </div>
    `;
    formReportSection.innerHTML = reportHTML;
    const generateBtn = formReportSection.querySelector('#generate-report-btn');
    generateBtn.addEventListener('click', () => {
        const startDate = document.getElementById('start-date').value || null;
        const endDate = document.getElementById('end-date').value || null;

        if (!startDate && !endDate) {
            showModal('Необходимо выставить хотя бы одну из границ');
        } else {
            formReportSection.classList.remove('show');
            reportWindow.querySelector('.report-section').classList.add('show');
            fetchReport(startDate, endDate);
        }
    });
}

async function fetchReport(startDate, endDate) {
    try {
        const response = await fetch(serverLink + reportNameStr + `/${startDate}/${endDate}`, {
            method: 'GET'
        });
        data = await response.json();
        filteredData = data;
        totalRecords = data.length;
        currentPage = 1;
        if (!response.ok) {
            showModal(data);
        }
        createReportPagination(Math.ceil(totalRecords / 12));
        displayReport();
        if (startDate && endDate) {
            reportName.textContent += ` за период от ${startDate} до ${endDate}`;
        } else if (startDate) {
            reportName.textContent += ` за период от ${startDate}`;
        } else if (endDate) {
            reportName.textContent += ` за период до ${endDate}`;
        }
    } catch (err) {
        console.error(err.message);
    }
}

function createReportPagination(totalPages) {
    const pagesList = document.getElementById('report-pages-list');
    pagesList.innerHTML = '';
    const prevBtn = document.createElement('li');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="bi-chevron-left"></i>';
    prevBtn.addEventListener('click', () => changeReportPage(currentPage - 1, totalPages));
    pagesList.appendChild(prevBtn);
    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        if (currentPage <= 4) {
            for (let i = 2; i <= 5; i++) {
                pages.push(i);
            }
            if (totalPages > 6) {
                pages.push('...');
                pages.push(totalPages);
            }
        } else if (currentPage > 4 && currentPage < totalPages - 3) {
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else {
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i);
            }
        }
    }
    pages.forEach(page => {
        const pageItem = document.createElement('li');
        pageItem.className = typeof page === 'number' ? 'page-number' : 'page-dots';
        pageItem.textContent = page;
        if (page === currentPage) {
            pageItem.classList.add('active');
        }
        if (typeof page === 'number') {
            pageItem.addEventListener('click', () => changeReportPage(page, totalPages));
        }
        pagesList.appendChild(pageItem);
    });
    const nextBtn = document.createElement('li');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="bi-chevron-right"></i>';
    nextBtn.addEventListener('click', () => changeReportPage(currentPage + 1, totalPages));
    pagesList.appendChild(nextBtn);
    updateReportPaginationDisplay();
}

function changeReportPage(page, totalPages) {
    if (page < 1 || page > totalPages) {
        return;
    }
    currentPage = page;
    createReportPagination(totalPages);
    reportContent.innerHTML = '';
    displayReportBody();
    updateReportPaginationDisplay();
}

function updateReportPaginationDisplay() {
    const pageNumbers = document.getElementById('report-pages-list').getElementsByClassName('page-number');
    [...pageNumbers].forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.textContent) === currentPage) {
            item.classList.add('active');
        }
    });
}

function displayReport() {
    reportHeader.innerHTML = '';
    reportContent.innerHTML = '';
    displayReportHeader();
    displayReportBody();
}

function displayReportHeader() {
    reportHeader.innerHTML += getReportHeader();
}

function getReportHeader() {
    let header = '<tr>';
    switch (reportNameStr) {
        case 'schedule':
            header += `<th>Дата</th>`;
            header += `<th>Время</th>`;
            header += `<th>ФИО тренера</th>`;
            header += `<th>Категория зала</th>`;
            header += `<th>Тип тренировки</th>`;
            header += `<th>Длительность, мин.</th>`;
            header += `<th>Максимум участников</th>`;
            break;
        case 'workload':
            header += `<th>ФИО тренера</th>`;
            header += `<th>Количество тренировок</th>`;
            header += `<th>Индивидуальные</th>`;
            header += `<th>Групповые</th>`;
            header += `<th>Общая длительность, мин.</th>`;
            break;
        case 'sales':
            header += `<th>ФИО клиента</th>`;
            header += `<th>Номер телефона</th>`;
            header += `<th>Срок действия, мес.</th>`;
            header += `<th>Дата приобретения</th>`;
            header += `<th>Дата начала действия</th>`;
            header += `<th>Цена, руб.</th>`;
            break;
    }
    header += '</tr>';
    return header;
}

function displayReportBody() {
    const limit = 12;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalRecords);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const recordsStart = document.getElementById('report-records-start'),
          recordsEnd = document.getElementById('report-records-end'),
          recordsTotal = document.getElementById('report-records-total');
    recordsStart.textContent = startIndex + 1;
    recordsEnd.textContent = endIndex;
    recordsTotal.textContent = totalRecords;
    createPagination(Math.ceil(totalRecords / limit));
    paginatedData.forEach(item => {
        let keys = Object.keys(item);
        let row = '<tr>';
        for (const key of keys) {
            const value = item[key];
            if (typeof value === 'boolean' && key === 'subscription_status') {
                row += `<td>${value ? 'Активен' : 'Неактивен'}</td>`;
            } else if (typeof value === 'boolean' && key === 'training_session_type') {
                row += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
            } else if (typeof value === 'number' && key === 'hall_category') {
                row += `<td>${getHallCategory(value)}</td>`;
            } else if (value === null) {
                if (key === 'client_full_name' && reportNameStr === 'sales') {
                    row += `<p class="result-report">Итого: ${item['subscription_price']} руб.</p>`;
                    break;
                } else {
                    row += `<td class="null">[${value}]</td>`;
                }
            } else if (typeof value === 'string' && value.match(/[-TZ]/) && !isNaN(Date.parse(value))) {
                row += `<td>${formatDate(value)}</td>`;
            } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
                row += `<td>${value.slice(0, -3)}</td>`;
            } else {
                row += `<td>${value}</td>`;
            }
        }
        row += '</tr>';
        reportContent.innerHTML += row;
    });
}

function generatePDF() {
    const converted = htmlToPdfmake(`<h2>${tableName.textContent}</h2>` + getTable());
    const docDefinition = { 
        content: converted,
        pageOrientation: tableNameStr === 'training_sessions' ? 'landscape' : 'portrait'
    };
    pdfMake.createPdf(docDefinition).download(`${tableNameStr}.pdf`);
}

function getTable() {
    let table = `<table>`;
    table += '<thead>';
    table += getHeader();
    table += '<thead>';
    table += '<tbody>';
    table += getBody();
    table += '<tbody>';
    table += '</table>';
    return table;
}

function getHeader() {
    let headers;
    let keys = Object.keys(filteredData[0]);
    if (keys.length == 1) {
        return '';
    }
    if (keys.includes('selected')) {
        keys = keys.slice(0, -1);
    }
    if (tableNameStr === 'trains') {
        if (keys.length > 2) {
            if (keys.includes('client_full_name')) {
                headers = ['training_client', 'client_full_name'];
            } else {
                headers = ['training_client'];
            }
        } else {
            headers = keys.slice(1);
        }
    } else {
        headers = keys.slice(1);
    }
    header = '<tr>';
    for (const key of headers) {
        header += `<th>${getHeaderName(key)}</th>`;
    }
    header += '</tr>';
    return header;
}

function getBody() {
    let body = '';
    filteredData.forEach(item => {
        let keys = Object.keys(item).slice(1, -1);
        let row = `<tr>`;
        if (tableNameStr === 'trains') {
            if (keys.length > 1 && keys.includes('client_full_name')) {
                row += createInnerTable(item, keys);
                row += `<td>${item[keys[keys.length - 1]]}</td>`;
            } else if (keys.length > 1 && !keys.includes('client_full_name')) {
                row += createInnerTable(item, keys);
            } else if (keys.length !== 0) {
                row += `<td>${item[keys[0]]}</td>`;
            }
        } else {
            for (const key of keys) {
                const value = item[key];
                if (typeof value === 'boolean' && key === 'subscription_status') {
                    row += `<td>${value ? 'Активен' : 'Неактивен'}</td>`;
                } else if (typeof value === 'boolean' && key === 'training_session_type') {
                    row += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
                } else if (typeof value === 'number' && key === 'hall_category') {
                    row += `<td>${getHallCategory(value)}</td>`;
                } else if (value === null) {
                    row += `<td class="null">[${value}]</td>`;
                } else if (typeof value === 'string' && value.match(/[-T]/) && !isNaN(Date.parse(value))) {
                    row += `<td>${formatDate(value)}</td>`;
                } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
                    row += `<td>${value.slice(0, -3)}</td>`;
                } else {
                    row += `<td>${value}</td>`;
                }
            }
        }
        row += '</tr>';
        body += row;
    });
    return body;
}

saveTable.addEventListener('click', () => {
    generatePDF();
});

function checkAllFieldsFilled() {
    const rowContent = document.querySelectorAll('.row-content');
    for (const row of rowContent) {
        const header = row.querySelector('.row-header span');
        if (header.textContent) {
            const value = row.getAttribute('data-selected-value');
            if (!value) {
                const input = row.querySelector('input');
                if (input) {
                    if (!input.value) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
    }
    return true;
}

confirmAddRecordBtn.addEventListener('click', () => {
    if (checkAllFieldsFilled()) {
        const rowContent = document.querySelectorAll('.row-content');
        let newRecord = {};
        let keys = tableNameStr === 'trains' ? ['trains_id', 'client_full_name'] : Object.keys(data[0]).slice(1, -1);
        if (tableNameStr === 'training_sessions') {
            keys = keys.filter(key => key !== 'administrator_full_name');
        }
        if (tableNameStr === 'administrators' || tableNameStr === 'coaches') {
            keys.push(tableNameStr === 'administrators' ? 'administrator_password' : 'coach_password');
        }
        rowContent.forEach((row, index) => {
            const input = row.querySelector('input');
            const dropdown = row.querySelector('.dropdown-row button span');
            let columnName = keys[index];
            let value = null;
    
            if (input) {
                if (input.value.length > 0) {
                    value = input.value;
                }
            } else if (dropdown) {
                value = row.getAttribute('data-selected-value') || dropdown.innerText;
            }
            if (value === 'Активен' || value === 'Групповая') {
                value = true;
            } else if (value === 'Неактивен' || value === 'Индивидуальная') {
                value = false;
            }
            if (columnName === 'client_full_name' && tableNameStr !== 'clients') {
                columnName = 'client_id';
                value = parseInt(value);
            }
            if (columnName === 'administrator_full_name' && tableNameStr !== 'administrators') {
                columnName = 'administrator_id';
                value = parseInt(value);
            }
            if (columnName === 'coach_full_name' && tableNameStr !== 'coaches') {
                columnName = 'coach_id';
                value = parseInt(value);
            }
            if (columnName === 'hall_category' && tableNameStr !== 'halls' || columnName === 'hall_number') {
                columnName = 'hall_id';
                value = parseInt(value);
            }
            if (columnName === 'hall_number') {
                columnName = 'hall_id';
                value = parseInt(value);
            }
            if (columnName === 'trains_id') {
                columnName = 'training_session_id';
                value = parseInt(value);
            }
            if (columnName && !columnName.includes('_password') && typeof value === 'string' && !isNaN(parseInt(value)) && !value.match(/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/) && !value.match(/^\d{2}:\d{2}$/) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                value = parseInt(value);
            }
            if (value === "[null]") {
                value = null;
            }
            newRecord[columnName] = value;
        });
        addRow(newRecord).then(res => {
            loadTable();
        });
        document.querySelector('.add-record-container').classList.toggle('show');
    } else {
        showModal('Не все обязательные поля заполнены');
    }
});

confirmEditRecordBtn.addEventListener('click', () => {
    if (checkAllFieldsFilled()) {
        const rowContent = document.querySelectorAll('.row-content');
        let updatedRecord = {};
        let keys = tableNameStr === 'trains' ? ['trains_id', 'client_full_name'] : Object.keys(data[0]).slice(1, -1);
        if (tableNameStr === 'training_sessions') {
            keys = keys.filter(key => key !== 'administrator_full_name');
        }
        rowContent.forEach((row, index) => {
            const input = row.querySelector('input');
            const dropdown = row.querySelector('.dropdown-row button span');
            let columnName = keys[index];
            let value = null;
    
            if (input) {
                if (input.value.length > 0) {
                    value = input.value;
                }
            } else if (dropdown) {
                value = row.getAttribute('data-selected-value') || dropdown.innerText;
            }
            if (value === 'Активен' || value === 'Групповая') {
                value = true;
            } else if (value === 'Неактивен' || value === 'Индивидуальная') {
                value = false;
            }
            if (columnName === 'client_full_name' && tableNameStr !== 'clients') {
                columnName = 'client_id';
                value = parseInt(value);
            }
            if (columnName === 'administrator_full_name' && tableNameStr !== 'administrators') {
                columnName = 'administrator_id';
                value = parseInt(value);
            }
            if (columnName === 'coach_full_name' && tableNameStr !== 'coaches') {
                columnName = 'coach_id';
                value = parseInt(value);
            }
            if (columnName === 'hall_category' && tableNameStr !== 'halls' || columnName === 'hall_number') {
                columnName = 'hall_id';
                value = parseInt(value);
            }
            if (columnName === 'hall_number') {
                columnName = 'hall_id';
                value = parseInt(value);
            }
            if (columnName === 'trains_id') {
                columnName = 'training_session_id';
                value = parseInt(value);
            }
            if (columnName && !columnName.includes('_password') && typeof value === 'string' && !isNaN(parseInt(value)) && !value.match(/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/) && !value.match(/^\d{2}:\d{2}$/) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                value = parseInt(value);
            }
            if (value === "[null]") {
                value = null;
            }
            updatedRecord[columnName] = value;
        });
        const selectedItem = filteredData.filter(item => item.selected === true)[0];
        const selectedItemID = selectedItem[Object.keys(selectedItem)[0]];
        updateRow(selectedItemID, updatedRecord).then(res => {
            loadTable();
        });
        document.querySelector('.edit-record-container').classList.toggle('show');
    } else {
        showModal('Не все обязательные поля заполнены');
    }
});

async function addRow(newRecord) {
    try {
        const response = await fetch(serverLink + `${tableNameStr}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(newRecord)
        });
        const result = await response.json();
        if (!response.ok) {
            showModal(result);
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function createWorkWithRecordWindow(keys, headerNames) {
    const contentPromises = keys.map(async (key, index) => {
        let content = '';
        const nullHeaders = ['training_session_max_members', 'subscription_start_date', 'client_birthday'];
        switch (getEditFieldType(key)) {
            case 'input':
                content = `<div class="row-content"><h2 class="row-header">${headerNames[index]}<span>${nullHeaders.includes(key) ? '' : '*'}</span></h2><input type="${key.includes('_date') || key.includes('birthday') ? 'date' : (key.includes('password') ? 'password' : 'text')}"></div>`;
                return content;
            case 'dropdown':
                const dropdown = await generateDropdown(key, '');
                content = `<div class="row-content"><h2 class="row-header">${headerNames[index]}<span>${nullHeaders.includes(key) ? '' : '*'}</span></h2>${dropdown}</div>`;
                return content;
        }
    });
    const content = await Promise.all(contentPromises);
    const allContent = content.join('');
    return allContent;
}

addRecordBtn.addEventListener('click', () => {
    const addRecordContent = document.querySelector('.add-record-content');
    const addRecordContainer = document.querySelector('.add-record-container');
    addRecordContainer.classList.toggle('show');
    let keys = tableNameStr === 'trains' ? ['trains_id', 'client_full_name'] : Object.keys(data[0]).slice(1, -1);
    let headerNames = [];
    if (tableNameStr === 'training_sessions') {
        keys = keys.filter(key => key !== 'administrator_full_name');
    }
    for (const key of keys) {
        headerNames.push(getHeaderName(key));
    }
    if (tableNameStr === 'trains') {
        headerNames = ['Тренировка', 'Клиент'];
    } else if (tableNameStr === 'administrators' || tableNameStr === 'coaches') {
        headerNames.push('Пароль');
        keys.push(tableNameStr === 'administrators' ? 'administrator_password' : 'coach_password');
    }
    createWorkWithRecordWindow(keys, headerNames).then(value => {
        addRecordContent.innerHTML = value;
        const rowContents = addRecordContent.querySelectorAll('.row-content');
        rowContents.forEach((rowContent, index) => {
            const dropdown = rowContent.querySelector('.dropdown-row');
            if (dropdown) {
                const dropdownBtn = dropdown.querySelector('button');
                const dropdownContent = dropdown.querySelector('.dropdown-row-content');
                dropdownBtn.addEventListener('click', () => {
                    dropdownContent.classList.toggle('show');
                    dropdownBtn.parentElement.querySelector('.arrow').classList.toggle('rotated');
                });
                const tableRows = dropdownContent.querySelectorAll('tr');
                tableRows.forEach(row => {
                    row.addEventListener('click', () => {
                        const record = row.querySelectorAll('td');
                        const btnText = dropdownBtn.querySelector('span');
                        if (keys[index] === 'subscription_status' || keys[index] === 'training_session_type' || (keys[index] === 'hall_category' && tableNameStr)) {
                            btnText.textContent = record[0].innerText;
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        } else if (keys[index] === 'trains_id') {
                            const headers = row.parentNode.querySelectorAll('tr > th');
                            btnText.textContent = '';
                            for (let j = 1; j < headers.length; j++) {
                                btnText.textContent += headers[j].innerText + ': ';
                                btnText.textContent += record[j].innerText;
                                if (j !== headers.length - 1) {
                                    btnText.textContent += ' | ';
                                }
                            }
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        } else {
                            btnText.textContent = record[1].innerText;
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        }
                        dropdownContent.classList.toggle('show');
                    });
                });
            }
        });
    });
});

editRecordBtn.addEventListener('click', () => {
    const selectedItems = filteredData.filter(item => item.selected === true);
    if (selectedItems.length > 1) {
        showModal('Редактирование возможно только для одной записи');
        return;
    }
    if (selectedItems.length === 0) {
        showModal('Перед редактированием необходимо выбрать одну запись');
        return;
    }
    const selectedItem = selectedItems[0];
    const editRecordContent = document.querySelector('.edit-record-content');
    const editRecordContainer = document.querySelector('.edit-record-container');
    editRecordContainer.classList.toggle('show');
    let keys = tableNameStr === 'trains' ? ['trains_id', 'client_full_name'] : Object.keys(data[0]).slice(1, -1);
    let headerNames = [];
    if (tableNameStr === 'training_sessions') {
        keys = keys.filter(key => key !== 'administrator_full_name');
    }
    for (const key of keys) {
        headerNames.push(getHeaderName(key));
    }
    if (tableNameStr === 'trains') {
        headerNames = ['Тренировка', 'Клиент'];
    }
    createWorkWithRecordWindow(keys, headerNames).then(value => {
        editRecordContent.innerHTML = value;
        const rowContents = editRecordContent.querySelectorAll('.row-content');
        rowContents.forEach((rowContent, index) => {
            const dropdown = rowContent.querySelector('.dropdown-row');
            const input = rowContent.querySelector('input');
            if (input) {
                let value = selectedItem[keys[index]];
                if (keys[index].includes('_date') || keys[index].includes('birthday')) {
                    value = formatDate(selectedItem[keys[index]]);
                } else if (keys[index].includes('_time')) {
                    value = value.slice(0, -3);
                }
                input.value = value;
            } else if (dropdown) {
                const dropdownBtn = dropdown.querySelector('button');
                const dropdownContent = dropdown.querySelector('.dropdown-row-content');
                let value = selectedItem[keys[index]];
                if (typeof value === 'boolean' && tableNameStr === 'subscriptions') {
                    value = value ? 'Активен' : 'Неактивен';
                } else if (typeof value === 'boolean' && tableNameStr === 'training_sessions') {
                    value = value ? 'Групповая' : 'Индивидуальная';
                } else if (typeof value === 'number' && keys[index] === 'hall_category') {
                    value = getHallCategory(value);
                } else if (tableNameStr === 'trains' && keys[index] === 'trains_id') {
                    const row = tableContent.querySelector(`tr[data-id="${value}"]`);
                    const headers = row.querySelectorAll('th');
                    const records = row.querySelectorAll('th + td');
                    value = '';
                    for (let i = 0; i < headers.length; i++) {
                        value += headers[i].innerText + ': ';
                        value += records[i].innerText;
                        if (i !== headers.length - 1) {
                            value += ' | ';
                        }
                    }
                }
                dropdownBtn.querySelector('span').textContent = value;
                rowContent.setAttribute('data-selected-value', value);
                if (keys[index] === 'client_full_name') {
                    let clientID;
                    if (tableNameStr === 'subscriptions') {
                        const id = selectedItem[Object.keys(data[0])[0]];
                        const clientIDPromise = getID(`subscriptions/${id}/client_id`)
                        .then(value => {
                            clientID = value[0]['client_id'];
                            rowContent.setAttribute('data-selected-value', clientID);
                        });
                    } else if (tableNameStr === 'trains') {
                        const id = selectedItem[Object.keys(data[0])[0]];
                        rowContent.setAttribute('data-selected-value', parseInt(id.slice(-8)));
                    }
                } else if (keys[index] === 'administrator_full_name') {
                    let administratorID;
                    if (tableNameStr === 'training_sessions') {
                        const id = selectedItem[Object.keys(data[0])[0]];
                        const administratorIDPromise = getID(`training_sessions/${id}/administrator_id`)
                        .then(value => {
                            administratorID = value[0]['administrator_id'];
                            rowContent.setAttribute('data-selected-value', administratorID);
                        });
                    }
                } else if (keys[index] === 'coach_full_name') {
                    let coachID;
                    if (tableNameStr === 'training_sessions') {
                        const id = selectedItem[Object.keys(data[0])[0]];
                        const administratorIDPromise = getID(`training_sessions/${id}/coach_id`)
                        .then(value => {
                            coachID = value[0]['coach_id'];
                            rowContent.setAttribute('data-selected-value', coachID);
                        });
                    }
                } else if (keys[index] === 'trains_id') {
                    const id = selectedItem[Object.keys(data[0])[0]];
                    rowContent.setAttribute('data-selected-value', parseInt(id.slice(8)));
                } else if (keys[index] === 'hall_category') {
                    let hallID;
                    if (tableNameStr === 'training_sessions') {
                        const id = selectedItem[Object.keys(data[0])[0]];
                        const hallIDPromise = getID(`halls/${id}/hall_id`)
                        .then(value => {
                            hallID = value[0]['hall_id'];
                            rowContent.setAttribute('data-selected-value', hallID);
                        });
                    }
                }
                dropdownBtn.addEventListener('click', () => {
                    dropdownContent.classList.toggle('show');
                    dropdownBtn.parentElement.querySelector('.arrow').classList.toggle('rotated');
                });
                const tableRows = dropdownContent.querySelectorAll('tr');
                tableRows.forEach(row => {
                    row.addEventListener('click', () => {
                        const record = row.querySelectorAll('td');
                        const btnText = dropdownBtn.querySelector('span');
                        if (keys[index] === 'subscription_status' || keys[index] === 'training_session_type') {
                            btnText.textContent = record[0].innerText;
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        } else if (keys[index] === 'trains_id') {
                            const headers = row.parentNode.querySelectorAll('tr > th');
                            btnText.textContent = '';
                            for (let j = 1; j < headers.length; j++) {
                                btnText.textContent += headers[j].innerText + ': ';
                                btnText.textContent += record[j].innerText;
                                if (j !== headers.length - 1) {
                                    btnText.textContent += ' | ';
                                }
                            }
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        } else {
                            btnText.textContent = record[1].innerText;
                            rowContent.setAttribute('data-selected-value', record[0].innerText);
                        }
                        dropdownContent.classList.toggle('show');
                    });
                });
            }
        });
    });
});

deleteRecordBtn.addEventListener('click', () => {
    const selectedItems = filteredData.filter(item => item.selected === true);
    if (selectedItems.length === 0) {
        showModal('Необходимо выбрать хотя бы одну запись для удаления');
    }
    for (const item of selectedItems) {
        const id = Object.keys(item).find(key => key.includes('_id'));
        deleteRow(item[id]).then(res => {
            loadTable();
        });
    }
});

showColumnBtn.addEventListener('click', () => {
    document.getElementById('show-column-content').classList.toggle('show');
});

searchInput.addEventListener('input', () => {
    const text = searchInput.value.toLowerCase();
    if (text) {
        filteredData = filteredData.filter(row => {
            const values = Object.entries(row).slice(1);
            return values.some(([key, value]) => {
                if (key === 'subscription_status') {
                    value = value ? 'Активен' : 'Неактивен';
                } else if (key === 'training_session_type') {
                    value = value ? 'Групповая' : 'Индивидуальная';
                } else if (key === 'hall_category') {
                    value = getHallCategory(value);
                } else if (typeof value === 'string' && value.match(/[-T]/) && !isNaN(Date.parse(value))) {
                    value = formatDate(value);
                }
                return String(value).toLowerCase().includes(text);
            });
        });
    } else {
        filteredData = data;
        if (activeFilters) {
            activeFilters.forEach(filter => {
                filteredData = filteredData.filter(item => {
                    if (!filter.key.includes('status') && !filter.key.includes('type') && !filter.key.includes('category')) {
                        const fromValue = filter.values.find(({ index }) => index === 0)?.value;
                        const toValue = filter.filters.values.find(({ index }) => index === 1)?.value;
                        if (filter.key.includes('_date') || filter.key.includes('birthday')) {
                            const itemValue = formatDate(item[filter.key]);
                            if (fromValue !== undefined && toValue !== undefined) {
                                return itemValue >= fromValue && itemValue <= toValue;
                            } else if (fromValue !== undefined) {
                                return itemValue >= fromValue;
                            } else if (toValue !== undefined) {
                                return itemValue <= toValue;
                            }
                        } else {
                            if (fromValue !== undefined && toValue !== undefined) {
                                return item[filter.key] >= fromValue && item[filter.key] <= toValue;
                            } else if (fromValue !== undefined) {
                                return item[filter.key] >= fromValue;
                            } else if (toValue !== undefined) {
                                return item[filter.key] <= toValue;
                            }
                        }
                    } else if (filter.key.includes('category')) {
                        return filter.values.some(({ value }) => item[filter.key] === value);
                    } else if (filter.key.includes('status') || filter.key.includes('type')) {
                        const filterValue = filter.values[0]?.value;
                        return item[filter.key] === filterValue;
                    }
                    return true;
                });
            });
        }
        const tableHeadings = tableHeader.getElementsByTagName('th');
        [...tableHeadings].forEach(heading => {
            heading.classList.remove('asc');
            heading.classList.remove('desc');
            for (const child of heading.children) {
                if (child.tagName == 'I') {
                    child.style.display = 'none';
                }
            }
        });
        
    }
    totalRecords = filteredData.length;
    currentPage = 1;
    createPagination(Math.ceil(totalRecords / (tableNameStr === 'trains' ? 2 : 12)));
    tableContent.innerHTML = '';
    displayBody();
});

resetBtn.addEventListener('click', () => {
    resetSort();
    resetShowColumn();
    resetSelection();
    resetFilter();
});

function resetFilter() {
    activeFilters = [];
    [...document.querySelector('.filter-body').children].forEach(item => {
        item.remove();
    });
    filteredData = data;
    totalRecords = filteredData.length;
    currentPage = 1;
    displayTable();
}

function resetSelection() {
    filteredData.forEach(item => item.selected = false);
    displayTable();
}

function resetShowColumn() {
    const checkboxes = document.getElementsByClassName('show-column-checkbox');
    for (const checkbox of checkboxes) {
        checkbox.checked = true;
    }
    const saveColumnContentBtn = document.getElementById('save-column-content-btn');
    saveColumnContentBtn.click();
}

function resetSort() {
    data.sort((a, b) => {
        return Object.values(a)[0] > Object.values(b)[0] ? 1 : -1;
    });
    displayTable();
}

function createShowColumnDropdown() {
    const headers = tableNameStr === 'trains' ? ['training_client', 'client_full_name'] : Object.keys(data[0]).slice(1);
    const showColumnContent = document.getElementById('show-column-content');
    showColumnContent.innerHTML = '';
    const showColumnItemsContainer = document.createElement('div');
    showColumnItemsContainer.className = 'show-column-items-container';
    for (const key of headers) {
        if (key === 'selected') {
            continue;
        }
        const labelItem = document.createElement('label');
        labelItem.innerHTML = `<input class="show-column-checkbox" type="checkbox" value="${key}" checked> ${getHeaderName(key)}`;
        showColumnItemsContainer.appendChild(labelItem);
    }
    showColumnContent.appendChild(showColumnItemsContainer);
    const saveColumnContentBtn = document.createElement('button');
    saveColumnContentBtn.id = 'save-column-content-btn';
    saveColumnContentBtn.textContent = 'Сохранить';
    saveColumnContentBtn.addEventListener('click', () => {
        const checkboxes = document.getElementsByClassName('show-column-checkbox');
        let keys = [];
        for (const checkbox of checkboxes) {
            if (checkbox.checked) {
                keys.push(checkbox.value);
            }
        }
        filteredData = data.map(item => {
            let filteredEntries;
            if (tableNameStr === 'trains') {
                if (keys.includes('training_client')) {
                    if (!keys.includes('client_full_name')) {
                        filteredEntries = Object.entries(item).slice(0, -1);
                    } else {
                        filteredEntries = Object.entries(item);
                    }
                } else {
                    filteredEntries = Object.entries(item).filter(([key]) => keys.includes(key) || key === Object.keys(item)[0]);
                }
            } else {
                filteredEntries = Object.entries(item).filter(([key]) => keys.includes(key) || key === Object.keys(item)[0]);
            }
            return Object.fromEntries(filteredEntries);
        });
        showColumnContent.classList.remove('show');
        displayTable()
    });
    showColumnContent.appendChild(saveColumnContentBtn);
}

function getHeaderName(key) {
    switch (key) {
        case 'client_full_name':
            return tableNameStr === 'clients' ? 'ФИО' : 'Клиент';
        case 'client_birthday':
            return 'Дата рождения';
        case 'administrator_phone_number':
        case 'coach_phone_number':
        case 'client_phone_number':
            return 'Номер телефона';
        case 'administrator_full_name':
            return tableNameStr === 'administrators' ? 'ФИО' : 'Администратор';
        case 'coach_full_name':
            return tableNameStr === 'coaches' ? 'ФИО' : 'Тренер';
        case 'coach_specialization':
            return 'Специализация';
        case 'hall_number':
            return 'Номер зала';
        case 'hall_category':
            return tableNameStr === 'halls' ? 'Категория' : 'Зал';
        case 'training_session_date':
            return 'Дата';
        case 'training_session_start_time':
            return 'Время начала';
        case 'training_session_duration':
            return 'Продолжительность, мин.';
        case 'training_session_type':
            return 'Тип';
        case 'training_session_max_members':
            return 'Максимум участников';
        case 'subscription_purchase_date':
            return 'Дата приобретения';
        case 'subscription_start_date':
            return 'Дата начала действия';
        case 'subscription_validity_period':
            return 'Срок действия, мес.';
        case 'subscription_status':
            return 'Статус';
        case 'subscription_price':
            return 'Цена, руб.';
        case 'training_client':
            return 'Тренировка';
        case 'administrator_password':
        case 'coach_password':
            return 'Пароль';
    }
}

async function loadTable() {
    await fetchData();
}

async function fetchData() {
    try {
        const response = await fetch(serverLink + tableNameStr, {
            method: 'GET'
        });
        data = await response.json();
        filteredData = data;
        filteredData.forEach(item => {
            item.selected = false;
        });
        totalRecords = data.length;
        currentPage = 1;
        createShowColumnDropdown();
        createPagination(Math.ceil(totalRecords / (tableNameStr === 'trains' ? 2 : 12)));
        displayTable();
    } catch (err) {
        console.error(err.message);
    }
}

function displayTable() {
    tableHeader.innerHTML = '';
    tableContent.innerHTML = '';
    displayHeader();
    displayBody();
    const tableHeadings = tableHeader.getElementsByTagName('th');
    [...tableHeadings].slice(1, -1).forEach(heading => {
        let sortAsc = true;
        heading.addEventListener('click', () => {
            for (const head of tableHeadings) {
                if (heading !== head) {
                    head.classList.remove('asc');
                    head.classList.remove('desc');
                    for (const child of head.children) {
                        if (child.tagName == 'I') {
                            child.style.display = 'none';
                        }
                    }
                }
            }

            heading.classList.toggle('desc', !sortAsc);
            heading.classList.toggle('asc', sortAsc);

            sortAsc = heading.classList.contains('asc') ? false : true;

            for (const child of heading.children) {
                if (child.tagName == 'I') {
                    child.style.display = 'inline-block';
                }
            }

            sortTable(sortAsc, heading.attributes.data.value);
        });
    });
}

function displayHeader() {
    tableHeader.innerHTML += getTableHeader();
}

function getTableHeader() {
    let headers;
    let keys = Object.keys(filteredData[0]);
    if (keys.length == 1) {
        return '';
    }
    if (keys.includes('selected')) {
        keys = keys.slice(0, -1);
    }
    if (tableNameStr === 'trains') {
        if (keys.length > 2) {
            if (keys.includes('client_full_name')) {
                headers = ['training_client', 'client_full_name'];
            } else {
                headers = ['training_client'];
            }
        } else {
            headers = keys.slice(1);
        }
    } else {
        headers = keys.slice(1);
    }
    let header = '<tr>';
    header += `<th data="select_all"><input type="checkbox" id="select-all"></th>`;
    for (const key of headers) {
        header += `<th data="${key === 'training_client' ? 'trains_id' : key}"><i class="bi-arrow-up"></i> ${getHeaderName(key)}</th>`;
    }
    header += `<th data="actions">Действия</th>`;
    header += '</tr>';
    return header;
}

function createPagination(totalPages) {
    const pagesList = document.getElementById('pages-list');
    pagesList.innerHTML = '';
    const prevBtn = document.createElement('li');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="bi-chevron-left"></i>';
    prevBtn.addEventListener('click', () => changePage(currentPage - 1, totalPages));
    pagesList.appendChild(prevBtn);

    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        if (currentPage <= 4) {
            for (let i = 2; i <= 5; i++) {
                pages.push(i);
            }
            if (totalPages > 6) {
                pages.push('...');
                pages.push(totalPages);
            }
        } else if (currentPage > 4 && currentPage < totalPages - 3) {
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else {
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i);
            }
        }
    }

    pages.forEach(page => {
        const pageItem = document.createElement('li');
        pageItem.className = typeof page === 'number' ? 'page-number' : 'page-dots';
        pageItem.textContent = page;
        if (page === currentPage) {
            pageItem.classList.add('active');
        }
        if (typeof page === 'number') {
            pageItem.addEventListener('click', () => changePage(page, totalPages));
        }
        pagesList.appendChild(pageItem);
    });

    const nextBtn = document.createElement('li');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="bi-chevron-right"></i>';
    nextBtn.addEventListener('click', () => changePage(currentPage + 1, totalPages));
    pagesList.appendChild(nextBtn);
    updatePaginationDisplay();
}

function changePage(page, totalPages) {
    if (page < 1 || page > totalPages) {
        return;
    }
    currentPage = page;
    createPagination(totalPages);
    tableContent.innerHTML = '';
    displayBody();
    updatePaginationDisplay();
}

function updatePaginationDisplay() {
    const pageNumbers = document.getElementById('pages-list').getElementsByClassName('page-number');
    [...pageNumbers].forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.textContent) === currentPage) {
            item.classList.add('active');
        }
    });
}

function displayBody() {
    const limit = tableNameStr === 'trains' ? 2 : 12;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalRecords);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const recordsStart = document.getElementById('records-start'),
          recordsEnd = document.getElementById('records-end'),
          recordsTotal = document.getElementById('records-total');

    if (Object.keys(filteredData[0]).length === 1) {
        recordsStart.textContent = 0;
        recordsEnd.textContent = 0;
        recordsTotal.textContent = 0;
        createPagination(0);
        return;
    }
    recordsStart.textContent = startIndex + 1;
    recordsEnd.textContent = endIndex;
    recordsTotal.textContent = totalRecords;
    createPagination(Math.ceil(totalRecords / (tableNameStr === 'trains' ? 2 : 12)));

    paginatedData.forEach(item => {
        let keys = Object.keys(item);
        if (keys.includes('selected')) {
            keys = keys.slice(0, -1);
        }
        let row = `<tr data-id="${item[keys[0]]}">`;
        keys = keys.slice(1);
        row += `<td><input type="checkbox" class="row-checkbox" ${item.selected ? 'checked' : ''}></td>`;
        if (tableNameStr === 'trains') {
            if (keys.length > 1 && keys.includes('client_full_name')) {
                row += createInnerTable(item, keys);
                row += `<td>${item[keys[keys.length - 1]]}</td>`;
            } else if (keys.length > 1 && !keys.includes('client_full_name')) {
                row += createInnerTable(item, keys);
            } else if (keys.length !== 0) {
                row += `<td>${item[keys[0]]}</td>`;
            }
        } else {
            for (const key of keys) {
                const value = item[key];
                if (typeof value === 'boolean' && key === 'subscription_status') {
                    row += `<td>${value ? 'Активен' : 'Неактивен'}</td>`;
                } else if (typeof value === 'boolean' && key === 'training_session_type') {
                    row += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
                } else if (typeof value === 'number' && key === 'hall_category') {
                    row += `<td>${getHallCategory(value)}</td>`;
                } else if (value === null) {
                    row += `<td class="null">[${value}]</td>`;
                } else if (typeof value === 'string' && value.match(/[-T]/) && !isNaN(Date.parse(value))) {
                    row += `<td>${formatDate(value)}</td>`;
                } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
                    row += `<td>${value.slice(0, -3)}</td>`;
                } else {
                    row += `<td>${value}</td>`;
                }
            }
        }
        row += `<td>
        <div class="actions-group">
            <button class="edit-row-btn"><i class="bi-pen"></i></button>
            <button class="delete-row-btn"><i class="bi-trash"></i></button>
        </div>
        </td>`
        row += '</tr>';
        tableContent.innerHTML += row;
        const editRowBtns = document.getElementsByClassName('edit-row-btn');
        for (const btn of editRowBtns) {
            btn.addEventListener('click', () => {
                const parentRow = btn.closest('tr');
                switchToEditMode(parentRow);
            });
        }
        const deleteRowBtns = document.getElementsByClassName('delete-row-btn');
        for (const btn of deleteRowBtns) {
            btn.addEventListener('click', () => {
                const parentRow = btn.closest('tr');
                switchToDeleteMode(parentRow);
            });
        }
    });
    const rowCheckbox = document.getElementsByClassName('row-checkbox');
    for (const checkbox of rowCheckbox) {
        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            let id;
            if (tableNameStr !== 'trains') {
                id = parseInt(checkbox.parentElement.parentElement.getAttribute('data-id'));
            } else {
                id = checkbox.parentElement.parentElement.getAttribute('data-id');
            }
            const item = filteredData.find(item =>
                Object.entries(item).some(([key, value]) => key.includes('_id') && value === id)
            );
            if (item) {
                item.selected = isChecked;
            }
        });
    }
    const selectAllCheckbox = document.getElementById('select-all');
    selectAllCheckbox.addEventListener('change', () => {
        const isChecked = selectAllCheckbox.checked;
        const rowCheckboxes = document.getElementsByClassName('row-checkbox');
        [...rowCheckboxes].forEach(checkbox => {
            checkbox.checked = isChecked;
            filteredData.forEach(item => item.selected = isChecked);
        });
    });
}

function switchToEditMode(row) {
    const headersToEdit = tableHeader.querySelectorAll('th:not(:first-child):not(:last-child)');
    const cells = row.querySelectorAll('td:not(:first-child):not(:last-child)');
    let keys = []
    for (const key of headersToEdit) {
        keys.push(key.attributes[0].value);
    }
    cells.forEach((cell, index) => {
        let originalValue;
        if (keys[index] === 'trains_id') {
            const labels = ["Зал", "Администратор", "Тренер", "Дата", "Время начала", "Продолжительность, мин.", "Тип", "Максимум участников"];
            labels.forEach((label, index) => {
                const regex = new RegExp(label, 'g');
                if (index === 0) {
                    cell.textContent = cell.textContent.replace(regex, `${label}: `);
                } else {
                    cell.textContent = cell.textContent.replace(regex, ` | ${label}: `);
                }
            });
        }
        originalValue = cell.textContent;
        switch (getEditFieldType(keys[index])) {
            case 'input':
                cell.innerHTML = `<input type="${keys[index].includes('_date') || keys[index].includes('birthday') ? 'date' : 'text'}" value="${originalValue}">`;
                break;
            case 'dropdown':
                if (keys[index] === 'client_full_name') {
                    let clientID;
                    if (tableNameStr === 'subscriptions') {
                        const clientIDPromise = getID(`subscriptions/${row.attributes[0].value}/client_id`)
                        .then(value => {
                            clientID = value[0]['client_id'];
                            cell.setAttribute('data-selected-value', clientID);
                        });
                    } else if (tableNameStr === 'trains') {
                        cell.setAttribute('data-selected-value', parseInt(row.attributes[0].value.slice(-8)));
                    }
                } else if (keys[index] === 'administrator_full_name') {
                    let administratorID;
                    if (tableNameStr === 'training_sessions') {
                        const administratorIDPromise = getID(`training_sessions/${row.attributes[0].value}/administrator_id`)
                        .then(value => {
                            administratorID = value[0]['administrator_id'];
                            cell.setAttribute('data-selected-value', administratorID);
                        });
                    }
                } else if (keys[index] === 'coach_full_name') {
                    let coachID;
                    if (tableNameStr === 'training_sessions') {
                        const administratorIDPromise = getID(`training_sessions/${row.attributes[0].value}/coach_id`)
                        .then(value => {
                            coachID = value[0]['coach_id'];
                            cell.setAttribute('data-selected-value', coachID);
                        });
                    }
                } else if (keys[index] === 'trains_id') {
                    cell.setAttribute('data-selected-value', parseInt(row.attributes[0].value.slice(8)));
                } else if (keys[index] === 'hall_category') {
                    let hallID;
                    if (tableNameStr === 'training_sessions') {
                        const hallIDPromise = getID(`halls/${row.attributes[0].value}/hall_id`)
                        .then(value => {
                            hallID = value[0]['hall_id'];
                            cell.setAttribute('data-selected-value', hallID);
                        });
                    }
                }
                const dropdownPromise = generateDropdown(keys[index], originalValue)
                .then(dropdown => {
                    cell.innerHTML = dropdown;
                    const dropdownBtn = cell.querySelector('.dropdown-row button');
                    const dropdownContent = cell.querySelector('.dropdown-row-content');
                    dropdownBtn.addEventListener('click', () => {
                        dropdownContent.classList.toggle('show');
                        dropdownBtn.parentElement.querySelector('.arrow').classList.toggle('rotated');
                    })
                    const tableRows = dropdownContent.querySelectorAll('tr');
                    tableRows.forEach(row => {
                        row.addEventListener('click', () => {
                            const record = row.querySelectorAll('td');
                            const btnText = dropdownBtn.querySelector('span');
                            if (keys[index] === 'subscription_status' || keys[index] === 'training_session_type') {
                                btnText.textContent = record[0].innerText;
                                cell.setAttribute('data-selected-value', record[0].innerText);
                            } else if (keys[index] === 'trains_id') {
                                const headers = row.parentNode.querySelectorAll('tr > th');
                                btnText.textContent = '';
                                for (let i = 1; i < headers.length; i++) {
                                    btnText.textContent += headers[i].innerText + ': ';
                                    btnText.textContent += record[i].innerText;
                                    if (i !== headers.length - 1) {
                                        btnText.textContent += ' | ';
                                    }
                                }
                                cell.setAttribute('data-selected-value', record[0].innerText);
                            } else {
                                btnText.textContent = record[1].innerText;
                                cell.setAttribute('data-selected-value', record[0].innerText);
                            }
                            dropdownContent.classList.toggle('show');
                        });
                    });
                });
                break;
        }
    });
    const actionsGroup = row.querySelector('.actions-group');
    actionsGroup.innerHTML = `
        <button class="save-row-btn"><i class="bi-floppy"></i></button>
        <button class="cancel-row-btn"><i class="bi-x-lg"></i></button>
    `;
    actionsGroup.querySelector('.save-row-btn').addEventListener('click', () => {
        saveChanges(row);
    });
    actionsGroup.querySelector('.cancel-row-btn').addEventListener('click', () => {
        resetToDefault(row);
    });
}

async function getDropdownData(key) {
    try {
        let requestStr;
        switch (key) {
            case 'client_full_name':
                requestStr = 'clients';
                break;
            case 'administrator_full_name':
                requestStr = 'administrators';
                break;
            case 'coach_full_name':
                requestStr = 'coaches';
                break;
            case 'hall_category':
                requestStr = tableNameStr === 'halls' ? 'halls/hall_categories' : 'halls/all';
                break;
            case 'training_session_type':
                requestStr = 'training_sessions/training_session_types';
                break;
            case 'subscription_status':
                requestStr = 'subscriptions/subscription_statuses';
                break;
            case 'trains_id':
                requestStr = 'training_sessions';
                break;
        }
        const response = await fetch(serverLink + requestStr, {
            method: 'GET'
        });
        return response.json();
    } catch (err) {
        console.error(err.message);
    }
}

async function generateDropdown(key, originalValue) {
    const dropdownData = await getDropdownData(key);
    let str = `<div class="dropdown-row">
    <button><span>${originalValue}</span><i class="bi-chevron-down arrow"></i></button>
    <div class="dropdown-row-content">
    <table class="dropdown-table">`;
    if (key !== 'subscription_status' && key !== 'training_session_type' && (key === 'hall_category' && tableNameStr !== 'halls')) {
        str += '<tr>';
        for (const key of Object.keys(Object.values(dropdownData)[0])) {
            str += `<th>${key.includes('_id') ? 'ID' : getHeaderName(key)}</th>`;
        }
        str += '<tr>';
    }
    dropdownData.forEach(item => {
        const keys = Object.keys(item);
        str += '<tr>';
        for (const key of keys) {
            const value = item[key];
            if (typeof value === 'boolean' && key === 'subscription_status') {
                str += `<td>${value ? 'Активен' : 'Неактивен'}</td>`;
            } else if (typeof value === 'boolean' && key === 'training_session_type') {
                str += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
            } else if (typeof value === 'number' && key === 'hall_category') {
                str += `<td>${getHallCategory(value)}</td>`;
            } else if (value === null) {
                str += `<td class="null">[${value}]</td>`;
            } else if (typeof value === 'string' && value.match(/[-T]/) && !isNaN(Date.parse(value))) {
                str += `<td>${formatDate(value)}</td>`;
            } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
                str += `<td>${value.slice(0, -3)}</td>`;
            } else {
                str += `<td>${value}</td>`;
            }
        }
        str += '</tr>';
    })
    str += `</table></div></div>`;
    return str;
}

async function getID(requestStr) {
    try {
        const response = await fetch(serverLink + requestStr, {
            method: 'GET'
        });
        return response.json();
    } catch (err) {
        console.error(err.message);
    }
}

function getEditFieldType(key) {
    switch (key) {
        case 'client_full_name':
            return tableNameStr === 'clients' ? 'input' : 'dropdown';
        case 'administrator_full_name':
            return tableNameStr === 'administrators' ? 'input' : 'dropdown';
        case 'coach_full_name':
            return tableNameStr === 'coaches' ? 'input' : 'dropdown';
        case 'hall_category':
        case 'training_session_type':
        case 'subscription_status':
        case 'trains_id':
            return 'dropdown';
        case 'client_birthday':
        case 'administrator_phone_number':
        case 'coach_phone_number':
        case 'client_phone_number':
        case 'coach_specialization':
        case 'hall_number':
        case 'training_session_date':
        case 'training_session_start_time':
        case 'training_session_duration':
        case 'training_session_max_members':
        case 'subscription_purchase_date':
        case 'subscription_start_date':
        case 'subscription_validity_period':
        case 'subscription_price':
        case 'administrator_password':
        case 'coach_password':
            return 'input';
    }
}

function saveChanges(row) {
    const cells = [...row.children].slice(1, -1);
    const headersToEdit = tableHeader.querySelectorAll('th:not(:first-child):not(:last-child)');
    let updatedData = {};
    cells.forEach((cell, index) => {
        const input = cell.querySelector('input');
        const dropdown = cell.querySelector('.dropdown-row button span')
        let columnName = headersToEdit[index].attributes[0].value;
        let value = '';

        if (input) {
            value = input.value;
        } else if (dropdown) {
            value = cell.getAttribute('data-selected-value') || dropdown.innerText;
        }

        if (value === 'Активен' || value === 'Групповая') {
            value = true;
        } else if (value === 'Неактивен' || value === 'Индивидуальная') {
            value = false;
        }

        if (columnName === 'client_full_name' && tableNameStr !== 'clients') {
            columnName = 'client_id';
            value = parseInt(value);
        }

        if (columnName === 'administrator_full_name' && tableNameStr !== 'administrators') {
            columnName = 'administrator_id';
            value = parseInt(value);
        }

        if (columnName === 'coach_full_name' && tableNameStr !== 'coaches') {
            columnName = 'coach_id';
            value = parseInt(value);
        }

        if (columnName === 'hall_category' && tableNameStr !== 'halls' || columnName === 'hall_number') {
            columnName = 'hall_id';
            value = parseInt(value);
        }

        if (columnName === 'hall_number') {
            columnName = 'hall_id';
            value = parseInt(value);
        }

        if (columnName === 'trains_id') {
            columnName = 'training_session_id';
            value = parseInt(value);
        }

        if (typeof value === 'string' && !isNaN(parseInt(value)) && !value.match(/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/) && !value.match(/^\d{2}:\d{2}$/) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            value = parseInt(value);
        }

        if (value === "[null]") {
            value = null;
        }

        updatedData[columnName] = value;
    });
    updateRow(row.attributes[0].value, updatedData).then(res => {
        loadTable();
    });
    resetToDefault(row);
}

async function updateRow(rowID, updatedData) {
    try {
        let requestStr = tableNameStr === 'trains' ? serverLink + `trains/${parseInt(rowID.slice(8))}/${parseInt(rowID.slice(-8))}` : serverLink + `${tableNameStr}/${parseInt(rowID)}`;
        const response = await fetch(requestStr, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updatedData)
        });
    } catch (err) {
        console.error(err.message);
    }
}

function resetToDefault(row) {
    displayTable();
    const actionsGroup = row.querySelector('.actions-group');
    actionsGroup.innerHTML = `
        <button class="edit-row-btn"><i class="bi-pen"></i></button>
        <button class="delete-row-btn"><i class="bi-trash"></i></button>
    `;
    actionsGroup.querySelector('.edit-row-btn').addEventListener('click', () => {
        switchToEditMode(row);
    });
    actionsGroup.querySelector('.delete-row-btn').addEventListener('click', () => {
        switchToDeleteMode(row);
    });
}

function switchToDeleteMode(row) {
    const actionsGroup = row.querySelector('.actions-group');
    actionsGroup.innerHTML = `
        <button class="cancel-del-row-btn"><i class="bi-x-lg"></i></button>
        <button class="confirm-row-btn"><i class="bi-check-lg"></i></button>
    `;
    
    const confirmBtn = actionsGroup.querySelector('.confirm-row-btn');
    const cancelBtn = actionsGroup.querySelector('.cancel-del-row-btn');

    confirmBtn.addEventListener('click', () => {
        confirmDeleteRow(row);
    });

    cancelBtn.addEventListener('click', () => {
        resetToDefault(row);
    });
}

function confirmDeleteRow(row) {
    deleteRow(row.attributes[0].value).then(res => {
        loadTable();
    });
    resetToDefault(row);
}

async function deleteRow(rowID) {
    try {
        let requestStr = tableNameStr === 'trains' ? serverLink + `trains/${parseInt(rowID.slice(8))}/${parseInt(rowID.slice(-8))}` : serverLink + `${tableNameStr}/${parseInt(rowID)}`;
        const response = await fetch(requestStr, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) {
            showModal(result);
        }
    } catch (err) {
        console.error(err.message);
    }
}

function createInnerTable(item, keys) {
    const headings = ['Зал', 'Администратор', 'Тренер', 'Дата', 'Время начала', 'Продолжительность, мин.', 'Тип', 'Максимум участников']
    let tableRow = '<td width="50%"><table>';
    const len = keys[keys.length - 1] === 'client_full_name' ? keys.length - 1 : keys.length;
    for (let i = 0; i < len; i++) {
        tableRow += `<tr><th>${headings[i]}</th>`;
        let value = item[keys[i]];
        if (typeof value === 'boolean' && keys[i] === 'training_session_type') {
            tableRow += `<td>${value ? 'Групповая' : 'Индивидуальная'}</td>`;
        } else if (typeof value === 'number' && keys[i] === 'hall_category') {
            tableRow += `<td>${getHallCategory(value)}</td>`;
        } else if (value === null) {
            tableRow += `<td class="null">[${value}]</td>`;
        } else if (typeof value === 'string' && value.match(/[-T]/) && !isNaN(Date.parse(value))) {
            tableRow += `<td>${formatDate(value)}</td>`;
        } else if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
            tableRow += `<td>${value.slice(0, -3)}</td>`;
        } else {
            tableRow += `<td>${value}</td>`;
        }
        tableRow += `</tr>`;
    }
    tableRow += '</table></td>';
    return tableRow;
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

function formatDate(dateString) {
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
}

function sortTable(sortAsc, key) {
    filteredData.sort((a, b) => {
        let firstRow;
        let secondRow;
        if (key === 'hall_category') {
            firstRow = getHallCategory(a[key]);
            secondRow = getHallCategory(b[key]);
        } else {
            firstRow = a[key];
            secondRow = b[key];
        }
        const convertedFirst = convertToType(firstRow);
        const convertedSecond = convertToType(secondRow);
        return sortAsc ? (convertedFirst < convertedSecond ? 1 : -1) : (convertedFirst > convertedSecond ? 1 : -1);
    });
    tableContent.innerHTML = '';
    displayBody();
}

function convertToType(value) {
    if (typeof value === 'string' && value.match(/[TZ]/)) {
        return Date.parse(value);
    }
    if (typeof value === 'string' && value.match(/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/)) {
        return value.replace(/[\(\)\-]/g, '');
    }
    if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return value.replace(/:/, '');
    }
    const int = parseInt(value);
    if (!isNaN(int)) {
        return int;
    }
    if (typeof value === 'boolean' || value === null) {
        return value;
    }
    return value.toLowerCase();
}

for (const table of tables.children) {
    table.addEventListener('click', (e) => {
        if (e.target.tagName == 'SPAN' && !e.target.parentElement.classList.contains('sub-menu-header')) {
            tableName.innerText = e.target.innerText;
            tableNameStr = e.target.attributes.value.value;
            searchInput.value = '';
            loadTable();
            document.querySelector('.add-record-container').classList.remove('show');
            document.querySelector('.edit-record-container').classList.remove('show');
            document.querySelector('.filter-dropdown-content').classList.remove('show');
            activeFilters = [];
            [...document.querySelector('.filter-body').children].forEach(item => {
                item.remove();
            });
            if (startInfo.style.display != 'none') {
                mainWindow.style.display = 'flex';
                startInfo.style.display = 'none';
            }
            if (reportWindow.style.display != 'none') {
                mainWindow.style.display = 'flex';
                reportWindow.style.display = 'none';
            }
            if (profileWindow.style.display != 'none') {
                mainWindow.style.display = 'flex';
                profileWindow.style.display = 'none';
            }
        }
    });
}

document.addEventListener('click', (e) => {
    let isClicked = false;
    for (const item of document.getElementById('show-column-content').children) {
        if (item.contains(e.target)) {
            isClicked = true;
        }
    }
    for (const item of tables.children) {
        if (item.contains(e.target) && item === e.target) {
            isClicked = true;
        }
    }
    if (!isClicked && !(filterBtn.contains(e.target) || document.querySelector('.filter-dropdown-content').contains(e.target))) {
        document.querySelector('.filter-dropdown-content').classList.remove('show');
    }
    if (!isClicked && !(editRecordBtn.contains(e.target) || document.querySelector('.edit-record-container').contains(e.target))) {
        document.querySelector('.edit-record-container').classList.remove('show');
    }
    if (!isClicked && !(addRecordBtn.contains(e.target) || document.querySelector('.add-record-container').contains(e.target))) {
        document.querySelector('.add-record-container').classList.remove('show');
    }
    if (!isClicked && !(showColumnBtn.contains(e.target) || document.getElementById('show-column-content').contains(e.target))) {
        document.getElementById('show-column-content').classList.remove('show');
    }
});