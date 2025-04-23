// Получаем информацию о пользователе при загрузке страницы
fetch('/user')
  .then(res => {
    if (!res.ok) {
      window.location.href = '/login'; // если не авторизован — на логин
    }
    return res.json();
  })
  .then(data => {
    document.getElementById('user').textContent = data.username;
    document.getElementById('role').textContent = data.role;

    // Показываем/скрываем элементы в зависимости от роли
    if (data.role === 'student') {
      document.getElementById('student-grades-section').style.display = 'block';
    } else {
      document.getElementById('student-grades-section').style.display = 'none';
    }

    if (data.role === 'admin') {
      document.getElementById('edit-class-button-container').style.display = 'block';
    }

    if (data.role === 'teacher') {
      document.getElementById('my-class-button-container').style.display = 'block';
    }
  })
  .catch(err => {
    console.error('Ошибка при получении данных пользователя:', err);
  });

// Функция для смены контента
function showPage(pageId) {
  document.getElementById('profile').classList.remove('active');
  document.getElementById('profile').classList.add('hidden');

  const pages = document.querySelectorAll('.content-page');
  pages.forEach(page => {
    page.classList.remove('active');
    page.classList.add('hidden');
  });

  const pageToShow = document.getElementById(pageId);
  if (pageToShow) {
    pageToShow.classList.remove('hidden');
    pageToShow.classList.add('active');
  }
}

// Обработчики для вкладок
document.getElementById('tab1').addEventListener('click', () => {
  showPage('page1');
  hideStatsForTeachersAndAdmins();
});
document.getElementById('tab2').addEventListener('click', () => showPage('page2'));
document.getElementById('tab3').addEventListener('click', () => showPage('page3'));

// Обработчик для кнопки "Профиль"
document.getElementById('profile-button').addEventListener('click', () => {
  showPage('profile');
});

// Обработчик для кнопки "Выйти"
document.getElementById('logout-button').addEventListener('click', () => {
  window.location.href = '/login'; // Выход
});

// Функция для скрытия статистики для преподавателей и администраторов
function hideStatsForTeachersAndAdmins() {
  const role = document.getElementById('role').textContent;
  if (role !== 'student') {
    document.getElementById('page1').innerHTML = '<h2>Страница 1</h2><p>Это статистика.</p>';
  }
}

// Обработчик для кнопки "Загрузить оценки"
document.getElementById('load-grades-button').addEventListener('click', () => {
  const selectedMonth = document.getElementById('month-select').value;
  const username = document.getElementById('user').textContent;

  // Загрузка данных через API с сервером
  fetch(`/api/grades/${username}/${selectedMonth}`)
    .then(res => {
      if (!res.ok) {
        throw new Error('Не удалось загрузить оценки');
      }
      return res.json();
    })
    .then(gradesData => {
      if (!gradesData) {
        console.error('Нет данных для выбранного месяца');
        return;
      }

      // Генерация таблицы с оценками
      const table = document.createElement('table');
      table.classList.add('grades-table');

      // Заголовок таблицы
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const subjectHeader = document.createElement('th');
      subjectHeader.textContent = 'Предмет';
      headerRow.appendChild(subjectHeader);

      for (let day = 1; day <= 31; day++) {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
      }

      const avgHeader = document.createElement('th');
      avgHeader.textContent = 'Средняя';
      headerRow.appendChild(avgHeader);

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Тело таблицы с оценками
      const tbody = document.createElement('tbody');
      let averages = {};  // Для хранения средних оценок по каждому предмету

      for (const subject in gradesData) {
        const subjectData = gradesData[subject];
        const row = document.createElement('tr');

        const subjectCell = document.createElement('td');
        subjectCell.textContent = subject;
        row.appendChild(subjectCell);

        let total = 0;
        let count = 0;

        for (let day = 1; day <= 31; day++) {
          const td = document.createElement('td');
          td.textContent = subjectData[day] || '';
          row.appendChild(td);

          if (subjectData[day]) {
            total += parseFloat(subjectData[day]);
            count++;
          }
        }

        const avgCell = document.createElement('td');
        const average = total / count || 0;
        avgCell.textContent = average.toFixed(2);
        row.appendChild(avgCell);

        averages[subject] = average;  // Сохраняем среднюю оценку

        tbody.appendChild(row);
      }

      table.appendChild(tbody);

      const container = document.getElementById('grades-table-container');
      container.innerHTML = ''; // Очистка старого содержимого
      container.appendChild(table);
      container.style.display = 'block';

      // Отображаем графики
      displayCharts(averages);
    })
    .catch(err => {
      console.error('Ошибка при загрузке оценок:', err);
      alert('Ошибка при загрузке оценок');
    });
});

// Функция для отображения графиков
// Функция для отображения графиков
function displayCharts(averages) {
  // Очистим контейнер для графиков
  const chartsContainer = document.getElementById('charts-container');
  chartsContainer.innerHTML = ''; // Очистка старого содержимого

  // Месяцы, которые будут отображаться на графиках
  const months = ["сентябрь", "октябрь", "ноябрь", "декабрь", "январь", "февраль", "март", "апрель", "май"];

  // Выводим весь объект averages, чтобы понять его структуру
  console.log('Полные данные averages:', averages);

  // Создаем графики для каждого предмета
  Object.keys(averages).forEach(subject => {
    const canvas = document.createElement('canvas');
    chartsContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Создаем массив данных для каждого месяца
    const subjectData = months.map(month => {
      // Проверяем, что в averages есть данные для этого месяца по текущему предмету
      const monthGrades = averages[subject] && averages[subject][month];
      console.log(`Оценки за ${month} по предмету "${subject}":`, monthGrades);

      return monthGrades || 0; // Если данных нет для месяца, ставим 0
    });

    console.log(`Данные для предмета "${subject}":`, subjectData); // Отладочная информация

    // Данные для графика: месяц и средняя оценка
    const chartData = {
      labels: months,
      datasets: [{
        label: `Средняя оценка по предмету ${subject}`,
        data: subjectData, // Массив данных для каждого месяца
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
        pointRadius: 5, // Увеличиваем радиус точек, чтобы они были видны
        pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Цвет точек
        borderWidth: 2
      }]
    };

    // Создание графика
    new Chart(ctx, {
      type: 'line', // Тип графика: линия
      data: chartData,
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Месяц'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Средняя оценка'
            },
            min: 1,
            max: 5
          }
        }
      }
    });
  });
}
