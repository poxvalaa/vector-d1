const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');


const classesFilePath = path.join(__dirname, 'classes.json');
const schedules = JSON.parse(fs.readFileSync(path.join(__dirname, 'schedules.json')));
const gradesFile = path.join(__dirname, 'grades.json');

const app = express();
app.use(cors());
const PORT = 3000;

console.log('Старт сервера...');

app.use(express.json());

// Пользователи (можно заменить на реальную базу данных в будущем)
const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'teacher', password: 'teach123', role: 'teacher' },
  { username: 'student', password: 'stud123', role: 'student' },
  { username: 'student2', password: 'stud2123', role: 'student' }
];

const subjects = [
    'Русский язык',
    'Английский язык',
    'Математика',
    'Литература',
    'Физкультура'
  ];

let classes = [];
try {
  const data = fs.readFileSync(classesFilePath, 'utf8');
  classes = JSON.parse(data);
} catch (err) {
  console.error('Ошибка при чтении classes.json:', err);
  classes = []; // по умолчанию
}



// Отдача классов
app.get('/classes', (req, res) => {
  fs.readFile('classes.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка чтения файла:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    try {
      const classes = JSON.parse(data);
      res.json(classes);
    } catch (e) {
      res.status(500).json({ error: 'Ошибка разбора JSON' });
    }
  });
});

// Сохранение классов
app.post('/classes', (req, res) => {
  classes = req.body;
  fs.writeFile(classesFilePath, JSON.stringify(classes, null, 2), err => {
    if (err) {
      console.error('Ошибка при записи в файл:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении данных' });
    }
    res.json({ message: 'Классы сохранены' });
  });
});

app.get('/schedules', (req, res) => {
  fs.readFile('schedules.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
    res.json(JSON.parse(data));
  });
});

// Сохранить расписание
app.post('/schedules', (req, res) => {
  const schedules = req.body;

  fs.writeFile('schedules.json', JSON.stringify(schedules, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Ошибка при сохранении расписания' });
    res.json({ message: 'Расписание сохранено' });
  });
});

// Сохранить классы


app.get('/users', (req, res) => {
  res.json(users); // Отдаем данные в формате JSON
});
// Получить классы
app.get('/classes', (req, res) => {
  res.json(classes);
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));



// Middleware для проверки входа
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Главная страница (доступна только после входа)
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница логина
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Обработка входа
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = user;
    return res.redirect('/');
  } else {
    return res.send('Неверный логин или пароль. <a href="/login">Попробовать снова</a>');
  }
});

// Выход из системы
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Ошибка при выходе:', err);
    }
    res.redirect('/login');
  });
});



// Отправка данных о пользователе для профиля
app.get('/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  res.json({
    username: req.session.user.username,
    role: req.session.user.role
  });

});


app.get('/admin', requireLogin, (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    res.sendFile(path.join(__dirname, 'public', 'admin.html')); // или используйте путь к вашему HTML-файлу
  } else {
    res.redirect('/login'); // если не авторизован, редирект на логин
  }
});

app.get('/students', (req, res) => {
  const teacherId = req.query.teacherId; // Получаем id учителя из параметров запроса

  // Находим классы, где этот учитель преподает
  const teacherClasses = schedules.classes.filter(classItem => classItem.teacher === teacherId);

  if (teacherClasses.length === 0) {
    return res.status(404).json({ error: 'Учитель не найден в расписаниях.' });
  }

  // Извлекаем учеников из всех классов, где преподает этот учитель
  const students = teacherClasses.flatMap(classItem => classItem.students);

  res.json(students);
});


app.get('/api/my-students', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'teacher') return res.status(403).send('Forbidden');

  const classes = JSON.parse(fs.readFileSync('./classes.json', 'utf-8'));
  const myClass = Object.values(classes).find(c => c.teacher === user.username);

  if (!myClass) return res.json([]);
  const students = myClass.students.map(username => ({ username })); // можно добавить name

  res.json(students);
});

app.post('/api/grades/:username/:month', express.json(), (req, res) => {
  const { username, month } = req.params;
  const newData = req.body;

  const gradesPath = './grades.json';
  const grades = JSON.parse(fs.readFileSync(gradesPath, 'utf-8'));

  if (!grades[username]) grades[username] = {};
  grades[username][month] = newData;

  fs.writeFileSync(gradesPath, JSON.stringify(grades, null, 2), 'utf-8');
  res.sendStatus(200);
});


// Получить оценки ученика по месяцам
app.get('/api/grades/:username/:month', (req, res) => {
  const { username, month } = req.params;
  
  // Читаем файл grades.json
  fs.readFile(gradesFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка при чтении файла:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    const gradesData = JSON.parse(data);
    const studentGrades = gradesData[username];

    if (!studentGrades) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    const monthGrades = studentGrades[month];
    
    if (!monthGrades) {
      return res.status(404).json({ error: 'Оценки за этот месяц не найдены' });
    }

    res.json(monthGrades);
  });
});




// Автоматическое создание структуры оценок
function initializeGrades() {
  const gradesPath = path.join(__dirname, 'grades.json');

  // Проверяем, если файл уже существует и не пустой — не трогаем
  if (fs.existsSync(gradesPath)) {
    const currentData = fs.readFileSync(gradesPath, 'utf8');
    if (currentData.trim() !== '' && currentData.trim() !== '{}') {
      console.log('grades.json уже существует и не пустой — пропускаем генерацию');
      return;
    }
  }

  const months = [
    'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май'
  ];


  const gradesData = {};

  for (const user of users) {
    if (user.role === 'student') {
      const studentGrades = {};
      for (const month of months) {
        studentGrades[month] = {};
        for (const subject of subjects) {
          studentGrades[month][subject] = {}; // позже тут появятся оценки по датам
        }
      }
      gradesData[user.username] = studentGrades;
    }
  }

  fs.writeFileSync(gradesPath, JSON.stringify(gradesData, null, 2), 'utf8');
  console.log('✅ Файл grades.json сгенерирован');
}

const diagramsFilePath = path.join(__dirname, 'diagrams.json');

// Функция для инициализации diagrams.json
function initializeDiagrams() {
  const diagramsData = {};

  const months = [
    'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май'
  ];

  // Генерация диаграмм для каждого ученика
  users.forEach(user => {
    if (user.role === 'student') {
      diagramsData[user.username] = {};

      // Создаем структуру диаграмм для каждого предмета
      subjects.forEach(subject => {
        diagramsData[user.username][subject] = {};

        months.forEach(month => {
          diagramsData[user.username][subject][month] = {
            grades: [1, 2, 3, 4, 5], // возможные оценки
            average: 0 // сюда позже будут записываться средние оценки за месяц
          };
        });
      });
    }
  });

  // Записываем данные в файл diagrams.json
  fs.writeFileSync(diagramsFilePath, JSON.stringify(diagramsData, null, 2), 'utf-8');
  console.log('✅ Файл diagrams.json сгенерирован');
}

// Вызываем функцию инициализации при старте сервера
initializeDiagrams();


function safeReadJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) return {};
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error(`Ошибка в JSON ${filePath}:`, err.message);
    return {};
  }
}

// Вызываем инициализацию после определения всех переменных
initializeGrades();


app.get('/api/statistics', (req, res) => {
  try {
    // Пытаемся вернуть статистику
    res.json(subjects); // Это должно быть в формате JSON
  } catch (err) {
    console.error('Ошибка при отправке статистики:', err);
    res.status(500).json({ error: 'Ошибка на сервере' }); // Если ошибка, отправляем 500
  }
});

console.log('Старт сервера...');
app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});
