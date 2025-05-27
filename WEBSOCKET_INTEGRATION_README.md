# WebSocket Chat Integration

## Обзор

Чат теперь использует WebSocket для обеспечения реального времени общения между пользователем и AI ассистентом. Это обеспечивает:

- ✅ Мгновенную доставку сообщений
- ✅ Потоковую передачу ответов AI (streaming)
- ✅ Автоматическое переподключение при разрыве соединения
- ✅ Индикаторы статуса подключения
- ✅ Сохранение истории чата в базе данных

## Архитектура

### Клиентская часть

1. **WebSocket Service** (`client/services/websocketService.ts`)
   - Управляет WebSocket соединением
   - Обрабатывает аутентификацию
   - Автоматическое переподключение
   - Singleton паттерн для глобального доступа

2. **WebSocket Hook** (`client/hooks/useWebSocketChat.ts`)
   - React хук для интеграции WebSocket в компоненты
   - Управление состоянием подключения
   - Обработка сообщений и ошибок

3. **Chat Component** (`client/app/(tabs)/chat.tsx`)
   - Интегрирован с WebSocket
   - Отображение статуса подключения
   - Обработка потокового ввода

### Серверная часть

1. **WebSocket Controller** (`server/src/controllers/websocketController.ts`)
   - Обработка WebSocket соединений
   - Аутентификация пользователей
   - Управление чатами
   - Интеграция с OpenAI для потокового ответа

## Конфигурация

### Переменные окружения

**Клиент** (`client/.env`):
```env
EXPO_PUBLIC_WS_URL="wss://your-domain.com/ws/chat"
```

**Сервер** (`server/.env`):
```env
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

## Протокол WebSocket

### Типы сообщений от клиента

1. **join_chat** - Присоединение к чату
```json
{
  "type": "join_chat",
  "data": {
    "token": "jwt_token",
    "chatId": "optional_chat_id"
  }
}
```

2. **create_chat** - Создание нового чата
```json
{
  "type": "create_chat",
  "data": {
    "token": "jwt_token"
  }
}
```

3. **message** - Отправка сообщения
```json
{
  "type": "message",
  "data": {
    "message": "Текст сообщения"
  }
}
```

### Типы сообщений от сервера

1. **connected** - Подтверждение подключения
2. **authenticated** - Успешная аутентификация
3. **chat_joined** - Присоединение к чату
4. **chat_created** - Чат создан
5. **user_message** - Подтверждение получения сообщения пользователя
6. **assistant_message_start** - Начало ответа ассистента
7. **assistant_message_token** - Токен потокового ответа
8. **assistant_message_complete** - Завершение ответа ассистента
9. **error** - Ошибка

## Использование

### Инициализация WebSocket в компоненте

```typescript
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { useAppSelector } from '@/hooks/reduxHooks';
import { selectToken } from '@/redux/features/tokenSlice';

const MyComponent = () => {
  const token = useAppSelector(selectToken);
  
  const {
    isConnected,
    isConnecting,
    currentChatId,
    isTyping,
    streamingMessage,
    sendMessage,
    createChat,
    joinChat,
    connect,
  } = useWebSocketChat({
    token: token || "",
    onMessage: (message) => {
      console.log('Новое сообщение:', message);
    },
    onError: (error) => {
      console.error('WebSocket ошибка:', error);
    },
  });

  // Автоматическое подключение
  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      connect();
    }
  }, [token, isConnected, isConnecting, connect]);

  return (
    // Ваш UI
  );
};
```

### Отправка сообщения

```typescript
const handleSendMessage = () => {
  if (isConnected && inputText.trim()) {
    sendMessage(inputText);
    setInputText('');
  }
};
```

## Особенности реализации

### Потоковая передача ответов

Сервер использует OpenAI streaming API для отправки ответов по частям:

1. Отправляется `assistant_message_start`
2. Каждый токен отправляется как `assistant_message_token`
3. По завершении отправляется `assistant_message_complete`

### Автоматическое переподключение

WebSocket сервис автоматически пытается переподключиться при разрыве соединения:

- Максимум 5 попыток
- Увеличивающаяся задержка между попытками
- Автоматическая повторная аутентификация

### Управление состоянием

- Singleton паттерн для WebSocket сервиса
- React хук для интеграции с компонентами
- Автоматическая очистка при размонтировании

## Безопасность

- JWT аутентификация для каждого WebSocket соединения
- Проверка прав доступа к чатам
- Валидация всех входящих сообщений
- Автоматическое отключение при ошибках аутентификации

## Отладка

### Логи клиента

WebSocket события логируются в консоль браузера:
- Подключение/отключение
- Аутентификация
- Создание/присоединение к чатам
- Ошибки

### Логи сервера

WebSocket события логируются на сервере:
- Новые подключения
- Аутентификация пользователей
- Обработка сообщений
- Ошибки OpenAI

## Тестирование

1. Запустите сервер: `cd server && npm run dev`
2. Запустите клиент: `cd client && npm start`
3. Войдите в приложение
4. Откройте чат и отправьте сообщение
5. Проверьте индикатор статуса подключения

## Возможные проблемы

### WebSocket не подключается

1. Проверьте URL в `EXPO_PUBLIC_WS_URL`
2. Убедитесь, что сервер запущен
3. Проверьте JWT токен

### Сообщения не отправляются

1. Проверьте статус подключения
2. Убедитесь, что чат создан
3. Проверьте логи сервера

### Потоковые ответы не работают

1. Проверьте OpenAI API ключ
2. Убедитесь, что модель поддерживает streaming
3. Проверьте логи OpenAI запросов 