let users = [];
    let classes = [];

    // ✅ Удален дублирующийся fetch
Promise.all([
  fetch('http://localhost:3000/users').then(res => res.json()),
  fetch('http://localhost:3000/classes').then(res => res.json())
])
  .then(([userData, classData]) => {
    users = userData;
    classes = classData;
    console.log('Классы с сервера:', classes);
    updateUsersList();
    loadClassTable();
    populateClassSelector(); // правильно здесь
  })
  .catch(err => {
    console.error('Ошибка при загрузке данных:', err);
  });


    // Загрузка пользователей с сервера
    fetch('http://localhost:3000/users')
      .then(res => res.json())
      .then(data => {
        users = data;
        console.log('Пользователи:', users); // Логируем пользователей
        updateUsersList();
        loadClassTable();
      })
      .catch(err => {
        console.error('Ошибка при загрузке пользователей:', err);
      });

    // Функция для обновления списка пользователей
    function updateUsersList() {
      const usersList = document.getElementById('users-list');
      const usersOutsideClasses = users.filter(user => !isInAnyClass(user.username));

      usersList.innerHTML = usersOutsideClasses.map(user =>
  `<li draggable="true" ondragstart="drag(event)" id="user-${user.username}">${user.username} (${user.role})</li>`
).join('');

    }
document.getElementById('profile-button').addEventListener('click', () => {
  // Переход на главную страницу (index.html)
  window.location.href = 'index.html';
});

document.getElementById('logout-button').addEventListener('click', () => {
  // Переход на страницу входа (login.html)
  window.location.href = 'login.html';
});

    // Функция для проверки, состоит ли пользователь в классе
    function isInAnyClass(username) {
      return classes.some(cls => cls.teacher === username || cls.students.includes(username));
    }

    // Загрузка таблицы классов
    function loadClassTable() {
  const classTableBody = document.getElementById('classes-table').getElementsByTagName('tbody')[0];
  classTableBody.innerHTML = classes.map((cls, index) => {
    const teacherHTML = cls.teacher
  ? `<span draggable="true" ondragstart="drag(event)" id="user-${cls.teacher}">${cls.teacher}</span>`
  : '';


    const studentsHTML = cls.students.map(student =>
  `<span draggable="true" ondragstart="drag(event)" id="user-${student}" style="margin-right: 5px;">${student}</span>`
).join('');

    return `
  <tr>
    <td>${index + 1}</td>
    <td id="teacher-${index}" ondrop="drop(event, ${index})" ondragover="allowDrop(event)">
      ${teacherHTML}
    </td>
    <td id="students-${index}" ondrop="drop(event, ${index})" ondragover="allowDrop(event)">
      ${studentsHTML}
    </td>
  </tr>
`;

  }).join('');
}


    function populateClassSelector() {
  const select = document.getElementById('class-select');
  select.innerHTML = '<option disabled selected>Выберите класс</option>'; // сбрасываем старые опции
  classes.forEach((cls, index) => {
    const option = document.createElement('option');
    option.value = `${index + 1}`;
option.textContent = `${index + 1} класс`;

    select.appendChild(option);
  });
}


    // Функция для перетаскивания
    function drag(event) {
      event.dataTransfer.setData("text", event.target.id);
    }

    // Разрешение на сброс перетаскиваемых элементов
    function allowDrop(event) {
      event.preventDefault();
    }

    // Функция для сброса перетаскиваемых элементов в класс
    function drop(event, classIndex) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text");
    const userName = document.getElementById(userId).textContent.split(' ')[0];

    if (userId.startsWith('user-')) {
      const user = users.find(u => u.username === userName);

      // Удаляем из всех классов
      classes.forEach(cls => {
        if (cls.teacher === userName) cls.teacher = '';
        cls.students = cls.students.filter(s => s !== userName);
      });

      // Добавляем в нужную ячейку
      if (user.role === 'teacher' && !classes[classIndex].teacher) {
        classes[classIndex].teacher = userName;
      }

      if (user.role === 'student' && !classes[classIndex].students.includes(userName)) {
        classes[classIndex].students.push(userName);
      }

      loadClassTable();
      updateUsersList();
    }
  }

  // Обработка сброса в список вне классов
  function dropToUsers(event) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text");
    const userName = document.getElementById(userId).textContent.split(' ')[0];

    // Удаляем пользователя из классов
    classes.forEach(cls => {
      if (cls.teacher === userName) cls.teacher = '';
      cls.students = cls.students.filter(s => s !== userName);
    });

    loadClassTable();
    updateUsersList();
  }

    // Обработчик кнопки "Изменить"
document.getElementById('edit-button').addEventListener('click', () => {
  document.getElementById('edit-button').style.display = 'none';
  document.getElementById('save-button').style.display = 'inline-block';
  document.getElementById('classes-table').style.display = 'table';
  loadClassTable(); // <= на всякий случай можно обновить ещё раз

    });

    // Сохранить изменения
    function saveChanges() {
  fetch('http://localhost:3000/classes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(classes)
  })
  .then(res => res.json())
  .then(data => {
    alert('Изменения сохранены!');
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('classes-table').style.display = 'none';
  })
  .catch(err => {
    console.error('Ошибка при сохранении классов:', err);
    alert('Ошибка при сохранении!');
  });
}
let schedules = {};
let selectedClass = '';

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

// Загружаем все расписания
fetch('http://localhost:3000/schedules')
  .then(res => res.json())
  .then(data => {
    schedules = data;
    populateClassSelector();
  });

// Заполнить селектор классов
function populateClassSelector() {
  const select = document.getElementById('class-select');
  Object.keys(schedules).forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    select.appendChild(option);
  });
}

// Загрузить таблицу расписания
function loadSchedule() {
  selectedClass = document.getElementById('class-select').value;
  const tbody = document.getElementById('schedule-table').querySelector('tbody');
  tbody.innerHTML = '';
  document.getElementById('schedule-table').style.display = 'table';
  document.getElementById('save-schedule').style.display = 'inline-block';

  schedules[selectedClass].forEach((daySchedule, dayIndex) => {
    const row = document.createElement('tr');

    // Название дня
    const dayCell = document.createElement('td');
    dayCell.textContent = days[dayIndex];
    row.appendChild(dayCell);

    // Уроки
    const lessonsCell = document.createElement('td');
    lessonsCell.style.display = 'flex';
    lessonsCell.style.flexDirection = 'column';

    for (let i = 0; i < 8; i++) {
      const input = document.createElement('input');
      input.placeholder = `Урок ${i + 1}`;

      input.value = daySchedule[i] || '';
      input.dataset.day = dayIndex;
      input.dataset.lesson = i;
      lessonsCell.appendChild(input);
    }

    row.appendChild(lessonsCell);
    tbody.appendChild(row);
  });
}

async function createUser() {
  const username = document.getElementById('new-username').value;
  const password = document.getElementById('new-password').value;
  const role = document.getElementById('new-role').value;

  try {
    const response = await fetch('/api/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();
    alert(data.message);
  } catch (error) {
    alert('Ошибка соединения с сервером');
  }
}



// Сохранить расписание
function saveSchedule() {
  const inputs = document.querySelectorAll('#schedule-table input');
  const newSchedule = [[], [], [], [], []];

  inputs.forEach(input => {
    const day = input.dataset.day;
    const lesson = input.dataset.lesson;
    newSchedule[day][lesson] = input.value;
  });

  schedules[selectedClass] = newSchedule;

  fetch('http://localhost:3000/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedules)
  })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(err => alert('Ошибка при сохранении расписания'));
}
Promise.all([
  fetch('http://localhost:3000/users').then(res => res.json()),
  fetch('http://localhost:3000/classes').then(res => res.json())
])
  .then(([userData, classData]) => {
    users = userData;
    classes = classData;
    console.log('Классы с сервера:', classes);
    updateUsersList();
    loadClassTable();
    populateClassSelector(); // <== добавь это
  });