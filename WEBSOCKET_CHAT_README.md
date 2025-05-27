# WebSocket Chat Integration

Этот проект включает полнофункциональный WebSocket чат с потоковой передачей сообщений от OpenAI.

## Архитектура

### Серверная часть (Backend)

1. **WebSocket Server** (`server/src/controllers/websocketController.ts`)
   - Класс `ChatWebSocketServer` для управления WebSocket соединениями
   - Аутентификация пользователей через JWT токены
   - Управление чатами и сообщениями
   - Потоковая передача ответов от OpenAI

2. **Основные функции:**
   - Подключение и аутентификация пользователей
   - Создание новых чатов
   - Присоединение к существующим чатам
   - Отправка сообщений с потоковым ответом от ИИ
   - Сохранение сообщений в базе данных

### Клиентская часть (Frontend)

1. **WebSocket Service** (`client/services/websocketService.ts`)
   - Класс `WebSocketChatService` для управления соединением
   - Автоматическое переподключение при разрыве связи
   - Обработка различных типов сообщений

2. **React Hook** (`client/hooks/useWebSocketChat.ts`)
   - Хук `useWebSocketChat` для удобного использования в React компонентах
   - Управление состоянием соединения
   - Обработка потоковых сообщений

3. **React Component** (`client/components/WebSocketChat.tsx`)
   - Готовый компонент чата с красивым UI
   - Отображение сообщений в реальном времени
   - Индикатор печатания ассистента

## Использование

### 1. Запуск сервера

```bash
cd server
npm install
npm run dev
```

Сервер будет доступен на `http://localhost:3000`
WebSocket сервер: `ws://localhost:3000/ws/chat`

### 2. Использование в React компоненте

```tsx
import React from 'react';
import { WebSocketChat } from './components/WebSocketChat';

const App = () => {
  const userToken = 'your-jwt-token'; // Получите токен после авторизации
  
  return (
    <div className="h-screen p-4">
      <WebSocketChat 
        token={userToken}
        className="h-full max-w-4xl mx-auto"
      />
    </div>
  );
};
```

### 3. Использование хука напрямую

```tsx
import { useWebSocketChat } from '../hooks/useWebSocketChat';

const ChatComponent = () => {
  const {
    isConnected,
    isTyping,
    streamingMessage,
    sendMessage,
    createChat,
    currentChatId
  } = useWebSocketChat({
    token: 'your-jwt-token',
    onMessage: (message) => {
      console.log('New message:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const handleSend = () => {
    if (!currentChatId) {
      createChat();
    }
    sendMessage('Привет!');
  };

  return (
    <div>
      <p>Статус: {isConnected ? 'Подключено' : 'Отключено'}</p>
      {isTyping && <p>Ассистент печатает: {streamingMessage}</p>}
      <button onClick={handleSend}>Отправить сообщение</button>
    </div>
  );
};
```

## Протокол WebSocket

### Сообщения от клиента к серверу:

1. **Присоединение к чату:**
```json
{
  "type": "join_chat",
  "data": {
    "token": "jwt-token",
    "chatId": "optional-chat-id"
  }
}
```

2. **Создание нового чата:**
```json
{
  "type": "create_chat",
  "data": {
    "token": "jwt-token"
  }
}
```

3. **Отправка сообщения:**
```json
{
  "type": "message",
  "data": {
    "message": "Текст сообщения"
  }
}
```

### Сообщения от сервера к клиенту:

1. **Подключение установлено:**
```json
{
  "type": "connected",
  "data": { "message": "WebSocket connection established" }
}
```

2. **Пользователь аутентифицирован:**
```json
{
  "type": "authenticated",
  "data": { "userId": "user-id" }
}
```

3. **Присоединение к чату:**
```json
{
  "type": "chat_joined",
  "data": {
    "chatId": "chat-id",
    "messages": [...],
    "title": "Chat title"
  }
}
```

4. **Чат создан:**
```json
{
  "type": "chat_created",
  "data": {
    "chatId": "new-chat-id",
    "title": "Новый чат"
  }
}
```

5. **Сообщение пользователя:**
```json
{
  "type": "user_message",
  "data": {
    "messageId": "message-id",
    "content": "Текст сообщения",
    "role": "user",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

6. **Начало ответа ассистента:**
```json
{
  "type": "assistant_message_start",
  "data": { "message": "Ассистент печатает..." }
}
```

7. **Токен потокового ответа:**
```json
{
  "type": "assistant_message_token",
  "data": { "token": "часть" }
}
```

8. **Завершение ответа ассистента:**
```json
{
  "type": "assistant_message_complete",
  "data": {
    "messageId": "message-id",
    "content": "Полный текст ответа",
    "role": "assistant",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

9. **Ошибка:**
```json
{
  "type": "error",
  "data": { "message": "Описание ошибки" }
}
```

## Особенности

### Потоковая передача
- Ответы от OpenAI передаются токен за токеном в реальном времени
- Пользователь видит, как ассистент "печатает" ответ
- Улучшенный пользовательский опыт

### Аутентификация
- Все WebSocket соединения требуют JWT токен
- Проверка существования пользователя в базе данных
- Безопасное управление сессиями

### Управление чатами
- Создание новых чатов
- Присоединение к существующим чатам
- Сохранение истории сообщений
- Автоматическое обновление заголовков чатов

### Переподключение
- Автоматическое переподключение при разрыве связи
- Экспоненциальная задержка между попытками
- Максимальное количество попыток переподключения

## Требования

### Backend:
- Node.js
- Express.js
- WebSocket (ws)
- OpenAI API
- MongoDB/Mongoose
- JWT

### Frontend:
- React
- TypeScript
- Tailwind CSS (для стилей)

## Конфигурация

Убедитесь, что в `.env` файле сервера указаны:

```env
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-connection-string
```

## Тестирование

Для тестирования WebSocket соединения можно использовать браузерные инструменты разработчика или специальные WebSocket клиенты.

Пример тестирования в браузере:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join_chat',
    data: { token: 'your-jwt-token' }
  }));
};
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
``` 