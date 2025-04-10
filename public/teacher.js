// teacher.js
document.addEventListener('DOMContentLoaded', function () {
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
    })
    
// Функция для обновления средней оценки для предмета
function updateAverage(subject) {
  const rows = document.querySelectorAll(`tr[data-subject="${subject}"]`);
  rows.forEach(row => {
    let grades = [];
    row.querySelectorAll(`td[data-subject="${subject}"]`).forEach(td => {
      const grade = parseFloat(td.textContent.trim());
      if (!isNaN(grade)) {
        grades.push(grade);
      }
    });

    // Пересчитываем среднее
    const avg = grades.length ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(2) : '';
    row.querySelector('.average').textContent = avg;
  });
}


  // Обработчик загрузки данных об оценках
  document.getElementById('loadButton').addEventListener('click', () => {
    currentStudent = document.getElementById('studentSelect').value;
    currentMonth = document.getElementById('monthSelect').value;

    fetch(`/api/grades/${currentStudent}/${currentMonth}`)
      .then(res => res.json())
      .then(data => {
        originalData = data;
        renderTable(data);
        document.getElementById('editButton').disabled = false;
      });
  });

  // Функция для рендера таблицы оценок
  function renderTable(data) {
  const container = document.getElementById('gradesTableContainer');
  container.innerHTML = '';

  const subjects = Object.keys(data);
  if (!subjects.length) {
    container.innerHTML = '<p>Нет данных по предметам</p>';
    return;
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const table = document.createElement('table');

  // Заголовок таблицы
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Предмет</th>';
  for (let day = 1; day <= daysInMonth; day++) {
    headRow.innerHTML += `<th>${day}</th>`;
  }
  headRow.innerHTML += `<th>Средняя</th>`;
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Тело таблицы
  const tbody = document.createElement('tbody');
  for (const subject of subjects) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${subject}</td>`;

    let grades = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = day.toString();
      const grade = data[subject]?.[date] || '';
      if (!isNaN(parseFloat(grade))) {
        grades.push(parseFloat(grade));
      }
      row.innerHTML += `<td data-subject="${subject}" data-date="${date}">${grade}</td>`;
    }

    const avg = grades.length ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(2) : '';
    row.innerHTML += `<td class="average" data-subject="${subject}">${avg}</td>`;
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

function getDaysInMonth(monthName) {
  const daysInMonths = {
    'Сентябрь': 30, 'Октябрь': 31, 'Ноябрь': 30, 'Декабрь': 31,
    'Январь': 31, 'Февраль': 28, 'Март': 31, 'Апрель': 30, 'Май': 31
  };
  return daysInMonths[monthName] || 30;
}


  // Обработчик для редактирования оценок
  document.getElementById('editButton').addEventListener('click', () => {
  document.querySelectorAll('td[data-subject]').forEach(td => {
    td.contentEditable = true;

    td.addEventListener('input', function () {
      updateAverage(td.dataset.subject);  // Теперь вызов функции корректен
    });
  });

  document.getElementById('saveButton').disabled = false;
});



  // Сохранение изменений в таблице
  document.getElementById('saveButton').addEventListener('click', () => {
    const updated = JSON.parse(JSON.stringify(originalData));

    document.querySelectorAll('td[data-subject]').forEach(td => {
      const subject = td.dataset.subject;
      const date = td.dataset.date;
      updated[subject][date] = td.textContent.trim();
    });

    fetch(`/api/grades/${currentStudent}/${currentMonth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).then(res => {
      if (res.ok) alert('Сохранено!');
    });
  });
});
