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

    // Если пользователь — студент, показываем диаграммы
    if (data.role === 'student') {
      fetch('/api/statistics')
        .then(res => res.json())
        .then(subjects => {
          fetch('/api/diagrams/' + data.username)
            .then(res => res.json())
            .then(diagrams => {
              const page1 = document.getElementById('page1');
              page1.innerHTML = ''; // Очищаем старые данные

              // Для каждого предмета создаем диаграмму
              subjects.forEach(subject => {
                const subjectData = diagrams[data.username][subject];
                const chartContainer = document.createElement('div');
                chartContainer.classList.add('chart-container');

                // Создаем контейнер для диаграммы
                const chartTitle = document.createElement('h3');
                chartTitle.textContent = subject;
                chartContainer.appendChild(chartTitle);

                const chartCanvas = document.createElement('canvas');
                chartContainer.appendChild(chartCanvas);
                page1.appendChild(chartContainer);

                // Данные для диаграммы
                const months = [
                  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
                  'Январь', 'Февраль', 'Март', 'Апрель', 'Май'
                ];

                const labels = months;
                const dataPoints = months.map(month => {
                  const grades = subjectData[month].grades; // Оценки
                  const average = subjectData[month].average; // Средняя оценка
                  return average;
                });

                // Генерация диаграммы
                const chart = new Chart(chartCanvas, {
                  type: 'line',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Средний балл',
                      data: dataPoints,
                      borderColor: '#4CAF50',
                      fill: false
                    }]
                  },
                  options: {
                    responsive: true,
                    scales: {
                      y: { min: 1, max: 5, ticks: { stepSize: 1 } }
                    }
                  }
                });
              });
            });
        });
    }

    // Показываем кнопку редактирования классов, если роль админ
    if (data.role === 'admin') {
      document.getElementById('edit-class-button-container').style.display = 'block'; // Показываем кнопку для админа
    }
    // Показываем кнопку "Мой класс", если роль учитель
    if (data.role === 'teacher') {
      document.getElementById('my-class-button-container').style.display = 'block'; // Показываем кнопку для учителя
    }
  })
  .catch(err => {
    console.error('Ошибка при получении данных пользователя:', err);
  });


function createCharts(subjects) {
  // Отображаем диаграммы для каждого предмета
  const page1 = document.getElementById('page1');
  page1.innerHTML = ''; // Очищаем страницу

  const months = ['Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май'];
  subjects.forEach(subject => {
    const chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');
    const chartTitle = document.createElement('h3');
    chartTitle.textContent = subject;
    chartContainer.appendChild(chartTitle);

    // Создаем диаграмму для каждого предмета
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    page1.appendChild(chartContainer);

    const chartData = {
      labels: months,
      datasets: [{
        label: `Средний балл по предмету ${subject}`,
        data: months.map(month => Math.random() * 5), // Здесь данные для диаграммы (замените на реальные данные)
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }]
    };

    new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
          },
        },
      },
    });
  });
}

// Функция для смены контента
function showPage(pageId) {
  // Скрываем профиль
  document.getElementById('profile').classList.remove('active');
  document.getElementById('profile').classList.add('hidden');

  // Скрываем все страницы контента
  const pages = document.querySelectorAll('.content-page');
  pages.forEach(page => {
    page.classList.remove('active');
    page.classList.add('hidden');
  });

  // Показать выбранную страницу
  const pageToShow = document.getElementById(pageId);
  if (pageToShow) {
    pageToShow.classList.remove('hidden');
    pageToShow.classList.add('active');
  }

  // Загружаем диаграммы, если это страница "Статистика" для ученика
  if (pageId === 'page1' && document.getElementById('role').textContent === 'student') {
    loadStudentCharts(); // Загружаем диаграммы для ученика
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
// Обработчик для кнопки "Профиль"
document.getElementById('profile-button').addEventListener('click', () => {
  // Скрываем страницы 1, 2, 3
  document.getElementById('page1').classList.add('hidden');
  document.getElementById('page2').classList.add('hidden');
  document.getElementById('page3').classList.add('hidden');

  // Показываем профиль
  document.getElementById('profile').classList.remove('hidden');
  document.getElementById('profile').classList.add('active');
});


// Обработчик для кнопки "Выйти"
document.getElementById('logout-button').addEventListener('click', () => {
  window.location.href = '/login'; // Выход
});

function hideStatsForTeachersAndAdmins() {
  // Если роль не студент, скрываем диаграммы
  const role = document.getElementById('role').textContent;
  if (role !== 'student') {
    document.getElementById('page1').innerHTML = '<h2>Страница 1</h2><p>Это статистика.</p>';
  }
}


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
function loadStudentCharts() {
  fetch('/api/statistics')  // Получаем данные о статистике с сервера
    .then(res => res.json())
    .then(subjects => {
      // Очищаем контейнер для диаграмм
      const page1 = document.getElementById('page1');
      page1.innerHTML = ''; 

      // Список месяцев
      const months = ['Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май'];

      // Проходим по каждому предмету из ответа сервера
      subjects.forEach(subject => {
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container');

        const chartTitle = document.createElement('h3');
        chartTitle.textContent = subject.name; // Предполагаем, что сервер возвращает объект с полем 'name' для каждого предмета
        chartContainer.appendChild(chartTitle);

        // Создаем элемент <canvas> для диаграммы
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        page1.appendChild(chartContainer);

        const chartData = {
          labels: months,
          datasets: [{
            label: `Средний балл по предмету ${subject.name}`,
            data: months.map(() => Math.random() * 5),  // Вместо Math.random() используйте реальные данные, полученные с сервера
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          }]
        };

        // Создаем диаграмму для предмета
        new Chart(canvas, {
          type: 'line',
          data: chartData,
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 5,
              },
            },
          },
        });
      });
    })
    .catch(err => console.error('Ошибка при загрузке статистики:', err));
}



    // Обработчики для вкладок
    document.getElementById('tab1').addEventListener('click', () => showPage('page1'));
    document.getElementById('tab2').addEventListener('click', () => showPage('page2'));
    document.getElementById('tab3').addEventListener('click', () => showPage('page3'));

    // Обработчик для кнопки "Профиль"
    document.getElementById('profile-button').addEventListener('click', () => {
      document.getElementById('profile').classList.remove('hidden');
      document.getElementById('profile').classList.add('active');
    });

    // Обработчик для кнопки "Редактировать классы"
    document.getElementById('edit-class-button').addEventListener('click', () => {
      window.location.href = '/admin.html'; // Переход на страницу админа
    });

    // Обработчик для кнопки "Мой класс"
    document.getElementById('my-class-button').addEventListener('click', () => {
      window.location.href = '/teacher.html'; // Переход на страницу учителя
    });

    // Обработчик для кнопки "Выйти"
    document.getElementById('logout-button').addEventListener('click', () => {
      window.location.href = '/login'; // Выход
    });

// Функция для отображения таблицы с оценками
function loadGrades(month) {
  const username = document.getElementById('user').textContent;  // Получаем имя пользователя

  // Запросим данные о оценках за выбранный месяц
  fetch(`/api/grades/${username}/${month}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Создаем таблицу для отображения оценок
      const tableContainer = document.getElementById('grades-table-container');
      tableContainer.innerHTML = '';  // Очищаем контейнер

      const table = document.createElement('table');
      table.classList.add('grades-table');

      // Заголовок таблицы (даты 1-30/31)
      const headerRow = document.createElement('tr');
      const subjects = Object.keys(data);  // Получаем список предметов

      const dateHeader = document.createElement('th');
      dateHeader.textContent = 'Предмет';
      headerRow.appendChild(dateHeader);

      for (let i = 1; i <= 31; i++) {
        const dateHeader = document.createElement('th');
        dateHeader.textContent = i;
        headerRow.appendChild(dateHeader);
      }

      table.appendChild(headerRow);

      // Строки таблицы для каждого предмета
      subjects.forEach(subject => {
        const row = document.createElement('tr');
        
        // Название предмета
        const subjectCell = document.createElement('td');
        subjectCell.textContent = subject;
        row.appendChild(subjectCell);

        // Оценки за каждый день
        for (let i = 1; i <= 31; i++) {
          const gradeCell = document.createElement('td');
          const grade = data[subject][i] || '';  // Если оценки нет — оставляем пустое поле
          gradeCell.textContent = grade;
          row.appendChild(gradeCell);
        }

        table.appendChild(row);
      });

      // Добавляем таблицу в DOM
      tableContainer.appendChild(table);
    })
    .catch(err => {
      console.error('Ошибка при загрузке оценок:', err);
    });
}

document.getElementById('load-grades-button').addEventListener('click', () => {
  const month = document.getElementById('month-select').value;
  loadGrades(month);
});