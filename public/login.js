// public/login.js
document.querySelector('form').addEventListener('submit', function (event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Переход на другую страницу после успешного входа
      window.location.href = '/';
    } else {
      document.getElementById('error-message').textContent = 'Неверный логин или пароль';
    }
  })
  .catch(error => {
    console.error('Ошибка:', error);
  });
});

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Тут обычно проверка на сервере, для примера считаем, что вход всегда успешен:
    localStorage.setItem('currentUser', username); // Сохраняем текущего пользователя
    // После успешной аутентификации (например, при входе)
localStorage.setItem('auth_token', 'your_generated_token_here');


    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
  }