# Скрипты тестирования WebSocket сервера

## Нагрузочное тестирование

### Установка зависимостей

```bash
npm install ws
```

### Запуск тестирования

```bash
node scripts/loadTest.js
```

### Конфигурация

Отредактируйте переменные в начале файла `loadTest.js`:

```javascript
const CONFIG = {
  serverUrl: 'ws://localhost:3000/ws/chat',
  totalUsers: 100,              // Количество пользователей
  connectionsPerUser: 2,        // Соединений на пользователя
  messagesPerConnection: 5,     // Сообщений на соединение
  messageInterval: 2000,        // Интервал между сообщениями (мс)
  testToken: 'your-jwt-token'   // JWT токен для аутентификации
};
```

### Получение тестового токена

1. Зарегистрируйтесь или войдите через API:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

2. Скопируйте токен из ответа и вставьте в `CONFIG.testToken`

### Сценарии тестирования

#### Базовое тестирование (100 пользователей)
```javascript
const CONFIG = {
  totalUsers: 100,
  connectionsPerUser: 2,
  messagesPerConnection: 3,
  messageInterval: 3000
};
```

#### Средняя нагрузка (500 пользователей)
```javascript
const CONFIG = {
  totalUsers: 500,
  connectionsPerUser: 2,
  messagesPerConnection: 5,
  messageInterval: 2000
};
```

#### Высокая нагрузка (1000 пользователей)
```javascript
const CONFIG = {
  totalUsers: 1000,
  connectionsPerUser: 3,
  messagesPerConnection: 5,
  messageInterval: 1500
};
```

### Интерпретация результатов

#### Успешный тест:
- Успешность соединений: > 95%
- Процент ошибок: < 5%
- Время ответа: < 3 секунды

#### Предупреждения:
- Успешность соединений: 90-95%
- Процент ошибок: 5-10%
- Время ответа: 3-5 секунд

#### Критические проблемы:
- Успешность соединений: < 90%
- Процент ошибок: > 10%
- Время ответа: > 5 секунд

### Мониторинг во время тестирования

Откройте в браузере:
- Health check: http://localhost:3000/api/websocket/health
- Метрики: http://localhost:3000/api/websocket/metrics
- Статистика: http://localhost:3000/api/websocket/stats

### Устранение проблем

#### "Authentication token required"
- Убедитесь, что `testToken` содержит валидный JWT токен
- Проверьте, что пользователь существует в базе данных

#### "Server at capacity"
- Увеличьте `WS_MAX_CONNECTIONS` в .env файле
- Уменьшите количество тестовых пользователей

#### "Too many connections for user"
- Увеличьте `WS_MAX_CONNECTIONS_PER_USER` в .env файле
- Уменьшите `connectionsPerUser` в конфигурации теста

#### Высокий процент ошибок
- Проверьте логи сервера
- Уменьшите интенсивность тестирования
- Проверьте доступность OpenAI API

### Создание собственных тестов

```javascript
const LoadTester = require('./loadTest');

const customConfig = {
  serverUrl: 'ws://localhost:3000/ws/chat',
  totalUsers: 50,
  connectionsPerUser: 1,
  messagesPerConnection: 10,
  messageInterval: 1000,
  testToken: 'your-token'
};

const tester = new LoadTester(customConfig);
tester.runTest();
```

### Автоматизация тестирования

Создайте скрипт для регулярного тестирования:

```bash
#!/bin/bash
# test-schedule.sh

echo "Запуск ежедневного нагрузочного тестирования"
node scripts/loadTest.js > logs/load-test-$(date +%Y%m%d).log 2>&1

# Отправка результатов по email (опционально)
# mail -s "Load Test Results" admin@example.com < logs/load-test-$(date +%Y%m%d).log
```

Добавьте в crontab:
```bash
# Запуск каждый день в 2:00 AM
0 2 * * * /path/to/your/project/test-schedule.sh
``` 