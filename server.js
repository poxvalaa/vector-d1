const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const classesFilePath = path.join(__dirname, 'classes.json');
const gradesFile = path.join(__dirname, 'grades.json');
const schedules = JSON.parse(fs.readFileSync(path.join(__dirname, 'schedules.json')));

app.use(cors());
const PORT = 3000;
app.use(express.static(__dirname));
console.log('Старт сервера...');
app.use(express.json());

const users = require('./users');

function saveUsersToFile() {
  fs.writeFileSync(path.join(__dirname, 'users.js'), `const users = ${JSON.stringify(users, null, 2)};\n\nmodule.exports = users;`);
}


const subjects = [
  'Русский язык',
  'Английский язык',
  'Математика',
  'Литература',
  'Физкультура',
  "ИЗО"
];

let classes = [];
try {
  const data = fs.readFileSync(classesFilePath, 'utf8');
  classes = JSON.parse(data);
} catch (err) {
  console.error('Ошибка при чтении classes.json:', err);
  classes = [];
}

app.get('/classes', (req, res) => {
  fs.readFile('classes.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Ошибка разбора JSON' });
    }
  });
});

app.get('/api/schedule', (req, res) => {
  // Данные расписания (это может быть из базы данных или файла)
  const schedule = [
    { day: 'Понедельник', lessons: ['Математика', 'Физика'] },
    { day: 'Вторник', lessons: ['Химия', 'Биология'] },
    // Другие дни недели...
  ];
  res.json(schedule);  // Отправка данных в формате JSON
});

app.get('/grades.json', (req, res) => {
  fs.readFile('./grades.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка сервера');
    res.json(JSON.parse(data));
  });
});

app.post('/classes', (req, res) => {
  classes = req.body;
  fs.writeFile(classesFilePath, JSON.stringify(classes, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Ошибка при сохранении данных' });
    res.json({ message: 'Классы сохранены' });
  });
});

app.get('/schedules', (req, res) => {
  fs.readFile('schedules.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
    res.json(JSON.parse(data));
  });
});

app.post('/schedules', (req, res) => {
  const schedules = req.body;
  fs.writeFile('schedules.json', JSON.stringify(schedules, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Ошибка при сохранении расписания' });
    res.json({ message: 'Расписание сохранено' });
  });
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/api/add-user', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Все поля обязательны!' });
  }

  const exists = users.find(user => user.username === username);
  if (exists) {
    return res.status(409).json({ message: 'Пользователь уже существует!' });
  }

  users.push({ username, password, role });
  console.log('Добавлен пользователь:', { username, role });
  res.status(201).json({ message: 'Пользователь создан!' });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.post('/api/homework', (req, res) => {
  const newHomework = req.body;

  const filePath = path.join(__dirname, 'homework.json');
  let homeworkData = {};

  // Читаем текущий homework.json, если существует
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      homeworkData = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Ошибка чтения homework.json:', err.message);
      return res.status(500).json({ error: 'Ошибка чтения файла домашки' });
    }
  }


  // Обновляем нужную часть структуры
  const classKey = Object.keys(newHomework)[0];
  const weekKey = Object.keys(newHomework[classKey])[0];

  if (!homeworkData[classKey]) homeworkData[classKey] = {};
  homeworkData[classKey][weekKey] = newHomework[classKey][weekKey];

  // Сохраняем
  try {
    fs.writeFileSync(filePath, JSON.stringify(homeworkData, null, 2), 'utf8');
    res.json({ success: true, message: 'Домашнее задание обновлено' });
  } catch (err) {
    console.error('Ошибка записи homework.json:', err.message);
    res.status(500).json({ error: 'Ошибка записи файла' });
  }
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user;
    return res.redirect('/');
  }
  return res.send('Неверный логин или пароль. <a href="/login">Попробовать снова</a>');
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log('Ошибка при выходе:', err);
    res.redirect('/login');
  });
});

app.get('/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  res.json({
    username: req.session.user.username,
    role: req.session.user.role
  });
});

app.get('/admin', requireLogin, (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/students', (req, res) => {
  const teacherId = req.query.teacherId;
  const teacherClasses = schedules.classes.filter(classItem => classItem.teacher === teacherId);
  if (teacherClasses.length === 0) {
    return res.status(404).json({ error: 'Учитель не найден в расписаниях.' });
  }
  const students = teacherClasses.flatMap(classItem => classItem.students);
  res.json(students);
});

app.get('/api/my-students', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'teacher') return res.status(403).send('Forbidden');
  const classes = JSON.parse(fs.readFileSync('./classes.json', 'utf-8'));
  const myClass = Object.values(classes).find(c => c.teacher === user.username);
  if (!myClass) return res.json([]);
  const students = myClass.students.map(username => ({ username }));
  res.json(students);
});

app.post('/api/grades/:username/:month', express.json(), (req, res) => {
  const { username, month } = req.params;
  const newData = req.body;
  const grades = JSON.parse(fs.readFileSync(gradesFile, 'utf-8'));
  if (!grades[username]) grades[username] = {};
  grades[username][month] = newData;
  fs.writeFileSync(gradesFile, JSON.stringify(grades, null, 2), 'utf-8');
  res.sendStatus(200);
});

app.get('/api/grades/:username/:month', (req, res) => {
  const { username, month } = req.params;
  fs.readFile(gradesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    const gradesData = JSON.parse(data);
    const studentGrades = gradesData[username];
    if (!studentGrades) return res.status(404).json({ error: 'Студент не найден' });
    const monthGrades = studentGrades[month];
    if (!monthGrades) return res.status(404).json({ error: 'Оценки за этот месяц не найдены' });
    res.json(monthGrades);
  });
});

function initializeGrades() {
  if (fs.existsSync(gradesFile)) {
    const currentData = fs.readFileSync(gradesFile, 'utf8');
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
          studentGrades[month][subject] = {};
        }
      }
      gradesData[user.username] = studentGrades;
    }
  }

  fs.writeFileSync(gradesFile, JSON.stringify(gradesData, null, 2), 'utf8');
  console.log('✅ Файл grades.json сгенерирован');
}




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

initializeGrades();

app.get('/api/statistics', (req, res) => {
  try {
    res.json(subjects);
  } catch (err) {
    console.error('Ошибка при отправке статистики:', err);
    res.status(500).json({ error: 'Ошибка на сервере' });
  }
});

function generateHomeworkFromSchedule() {
  const schedulesPath = path.join(__dirname, 'schedules.json');
  const homeworkPath = path.join(__dirname, 'homework.json');

  if (!fs.existsSync(schedulesPath)) {
    console.error('Файл schedules.json не найден');
    return;
  }

  const schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
  const result = {};

  const startDate = new Date('2024-09-02'); // Пн
  const endDate = new Date('2025-05-31');

  const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

  function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  function generateWeeks(start, end) {
    const weeks = [];
    let current = new Date(start);
    while (current <= end) {
      const monday = new Date(current);
      const friday = new Date(current);
      friday.setDate(friday.getDate() + 4);
      weeks.push(`${formatDate(monday)}-${formatDate(friday)}`);
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }

  const weeks = generateWeeks(startDate, endDate);

  for (const classNum of Object.keys(schedules)) {
    const classSchedule = schedules[classNum]; // 5 дней расписания
    result[classNum] = {};

    for (const week of weeks) {
      result[classNum][week] = {
        "Общее": {}
      };

      weekdays.forEach((dayName, dayIndex) => {
        const subjects = classSchedule[dayIndex] || [];
        const filtered = subjects.filter(subj => subj && subj.trim() !== '');

        result[classNum][week][dayName] = {};
const subjectCount = {};

subjects.forEach(subject => {
  if (!subject || subject.trim() === '') return;

  const cleanSubj = subject.trim();
  subjectCount[cleanSubj] = (subjectCount[cleanSubj] || 0) + 1;

  const label = subjectCount[cleanSubj] > 1
    ? `${cleanSubj} (${subjectCount[cleanSubj]})`
    : cleanSubj;

  result[classNum][week][dayName][label] = "";
});

      });
    }
  }

  fs.writeFileSync(homeworkPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('✅ homework.json сгенерирован с учётом дней недели и расписания');
}

generateHomeworkFromSchedule();



app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
