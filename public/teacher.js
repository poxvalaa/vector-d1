document.addEventListener("DOMContentLoaded", function () {
  function redirectToMain(tabName) {
    window.location.href = `index.html?tab=${tabName}`;
  }

  const tab1 = document.getElementById("tab1");
  const tab2 = document.getElementById("tab2");
  const tab3 = document.getElementById("tab3");
  const profileBtn = document.getElementById("profile-button");
  const logoutBtn = document.getElementById("logout-button");

  if (tab1) tab1.addEventListener("click", () => redirectToMain("statistics"));
  if (tab2) tab2.addEventListener("click", () => redirectToMain("schedule"));
  if (tab3) tab3.addEventListener("click", () => redirectToMain("grades"));
  if (profileBtn) profileBtn.addEventListener("click", () => redirectToMain("profile"));
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  let originalData = {};
  let currentStudent = '';
  let currentMonth = '';

  // Получение списка учеников для учителя
  fetch('/api/my-students')
    .then(res => {
      if (!res.ok) throw new Error('Ошибка доступа: ' + res.status);
      return res.json();
    })
    .then(students => {
      const select = document.getElementById('studentSelect');
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.username;
        opt.textContent = s.username;
        select.appendChild(opt);
      });
    });
   
   // Обработчик события для кнопки создания домашнего задания
const createHomeworkButton = document.getElementById('createHomeworkButton');
if (createHomeworkButton) {
  createHomeworkButton.addEventListener('click', () => {
    // Показать форму для выбора недели
    const weekSelection = document.getElementById('weekSelection');
    weekSelection.style.display = 'block';  // Показать форму для выбора недели
  });
}


  // Загрузка оценок
  const loadButton = document.getElementById('loadButton');
  if (loadButton) {
    loadButton.addEventListener('click', () => {
      currentStudent = document.getElementById('studentSelect').value;
      currentMonth = document.getElementById('monthSelect').value;

      fetch(`/api/grades/${currentStudent}/${currentMonth}`)
        .then(res => res.json())
        .then(data => {
          originalData = data;
          renderGradesTable(data);
          document.getElementById('editButton').disabled = false;
        });
    });
  }

  // Рендер таблицы с оценками
  function renderGradesTable(data) {
    const container = document.getElementById('gradesTableContainer');
    container.innerHTML = '';

    const subjects = Object.keys(data);
    if (!subjects.length) {
        container.innerHTML = '<p>Нет данных по предметам</p>';
        return;
    }

    const daysInMonth = getDaysInMonth(currentMonth);
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.innerHTML = '<th>Предмет</th>';

    // Добавление столбцов для дней месяца
    const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    for (let day = 1; day <= daysInMonth; day++) {
        headRow.innerHTML += `<th>${daysOfWeek[(day - 1) % daysOfWeek.length]} ${day}</th>`;
    }

    headRow.innerHTML += `<th>Средняя</th>`;
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const subject of subjects) {
        const row = document.createElement('tr');
        row.setAttribute('data-subject', subject);
        row.innerHTML = `<td>${subject}</td>`;

        let grades = [];
        // Рендер ячеек для каждого дня и урока
        for (let day = 1; day <= daysInMonth; day++) {
            const date = day.toString();
            const grade = data[subject]?.[date] || '';

            if (!isNaN(parseFloat(grade))) {
                grades.push(parseFloat(grade));
            }

            // Добавляем ячейку для каждого дня
            row.innerHTML += `<td data-subject="${subject}" data-date="${date}">${grade}</td>`;
        }

        // Вычисление среднего балла
        const avg = grades.length ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(2) : '';
        row.innerHTML += `<td class="average" data-subject="${subject}">${avg}</td>`;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  // Функция для получения количества дней в месяце
  function getDaysInMonth(monthName) {
    const daysInMonths = {
        'Сентябрь': 30, 'Октябрь': 31, 'Ноябрь': 30, 'Декабрь': 31,
        'Январь': 31, 'Февраль': 28, 'Март': 31, 'Апрель': 30, 'Май': 31
    };
    return daysInMonths[monthName] || 30;
  }

  // Функция для рендера таблицы с домашними заданиями
  function renderHomeworkTable(weekDate, schedule) {
    const container = document.getElementById('homeworkTableContainer');
    container.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.innerHTML = '<th>День</th><th>Уроки</th><th>ДЗ</th>';
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

    daysOfWeek.forEach((day, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${day}</td><td>${schedule[index].join(', ')}</td><td contenteditable="true" data-day="${day}" data-week="${weekDate}"></td>`;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    container.style.display = 'block';
  }

  // Функция для загрузки расписания и домашнего задания
  const applyWeekButton = document.getElementById('applyWeek');
  if (applyWeekButton) {
    applyWeekButton.addEventListener('click', () => {
      const weekDate = document.getElementById('weekDate').value;
      if (!weekDate) {
        alert('Введите правильную дату!');
        return;
      }

      // Загрузка расписания из schedule.json
      fetch('/api/schedule') // Предполагаем, что у вас есть API для получения расписания
        .then(res => res.json())
        .then(schedule => {
          // Загрузка данных о домашнем задании
          fetch('/api/homework') // Предполагаем, что у вас есть API для получения данных домашнего задания
            .then(res => res.json())
            .then(homeworkData => {
              // Применяем данные к таблице
              const homeworkWeek = homeworkData[currentMonth][weekDate];
              renderHomeworkTable(weekDate, schedule);
            });
        });
    });
  }

  // Сохранение измененного домашнего задания
  const saveHomeworkButton = document.getElementById('saveHomeworkButton');
  if (saveHomeworkButton) {
    saveHomeworkButton.addEventListener('click', () => {
      const updatedHomework = {};

      document.querySelectorAll('td[contenteditable="true"]').forEach(td => {
        const day = td.dataset.day;
        const week = td.dataset.week;
        const homeworkText = td.textContent.trim();
        
        if (!updatedHomework[week]) {
          updatedHomework[week] = {};
        }

        updatedHomework[week][day] = homeworkText;
      });

      // Сохраняем обновленные данные
      fetch(`/api/homework/${currentMonth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHomework)
      }).then(res => {
        if (res.ok) alert('Домашнее задание сохранено!');
      });
    });
  }
});

let currentUsername = '';
let currentClass = '';
let currentSchedule = {};
let currentWeek = '';

document.getElementById('create-homework-button').addEventListener('click', async () => {
  document.getElementById('homework-controls').style.display = 'block';

  // Загружаем текущего пользователя
  const userRes = await fetch('/user');
  const userData = await userRes.json();
  currentUsername = userData.username;

  // Загружаем classes.json и находим класс учителя
  const classRes = await fetch('/classes.json');
  const classes = await classRes.json();
  const teacherClass = classes.find(c => c.teacher === currentUsername);

  if (!teacherClass) {
    alert('Класс не найден для этого учителя.');
    return;
  }

  currentClass = teacherClass.className;

  // Загружаем расписание
  const scheduleRes = await fetch('/data/schedules.json');
  const schedules = await scheduleRes.json();
  currentSchedule = schedules[currentClass] || {};
});

document.getElementById('apply-week-button').addEventListener('click', () => {
  const weekInput = document.getElementById('weekSelect').value.trim();
  if (!weekInput) {
    alert('Укажите неделю в формате 02.09-06.09');
    return;
  }

  currentWeek = weekInput;
  generateHomeworkTables(currentSchedule);
});

function generateHomeworkTables(schedule) {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
  const container = document.getElementById('homework-tables');
  container.innerHTML = ''; // очистить предыдущие

  days.forEach(day => {
    const daySubjects = schedule[day] || [];

    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.textContent = day;
    table.appendChild(caption);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Урок</th><th>Домашнее задание</th>';
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    daySubjects.forEach(subject => {
      const row = document.createElement('tr');

      const subjectCell = document.createElement('td');
      subjectCell.textContent = subject;

      const homeworkCell = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.subject = subject;
      input.dataset.day = day;
      input.style.width = '100%';

      row.appendChild(subjectCell);
      row.appendChild(homeworkCell);
      homeworkCell.appendChild(input);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  });

  // Кнопка сохранить
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Сохранить';
  saveButton.addEventListener('click', saveHomework);
  container.appendChild(saveButton);
}

async function saveHomework() {
  const inputs = document.querySelectorAll('#homework-tables input');
  const homework = {
    [currentClass]: {
      [currentWeek]: {
        "Общее": {},
        "Понедельник": {},
        "Вторник": {},
        "Среда": {},
        "Четверг": {},
        "Пятница": {}
      }
    }
  };

  inputs.forEach(input => {
    const day = input.dataset.day;
    const subject = input.dataset.subject;
    const text = input.value.trim();

    if (text) {
      homework[currentClass][currentWeek][day][subject] = text;
    }
  });

  const res = await fetch('/api/homework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(homework)
  });

  if (res.ok) {
    alert('Домашнее задание сохранено.');
  } else {
    alert('Ошибка при сохранении домашнего задания.');
  }
}
