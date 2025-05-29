# WebSocket сервер - подробное объяснение

## Архитектура сервера

### 1. Инициализация WebSocket сервера

```javascript
// В main server файле
const server = createServer(app); // HTTP сервер
const chatWS = new ChatWebSocketServer(server); // WebSocket поверх HTTP

// В ChatWebSocketServer конструкторе
this.wss = new WebSocketServer({
  server, // Привязка к HTTP серверу
  path: "/ws/chat", // Эндпоинт для WebSocket соединений
});
```

**Ключевые моменты:**

- WebSocket работает поверх того же HTTP сервера
- Один порт для HTTP API и WebSocket
- Специальный путь `/ws/chat` для WebSocket соединений

### 2. Управление соединениями

```javascript
private clients: Map<string, AuthenticatedWebSocket> = new Map();
```

**Что это дает:**

- Быстрый доступ к конкретному пользователю по `userId`
- Возможность отправлять персональные сообщения
- Эффективное управление памятью

## Жизненный цикл соединения

### 1. Установка соединения

```javascript
this.wss.on("connection", this.handleConnection.bind(this));

private async handleConnection(ws: AuthenticatedWebSocket) {
  console.log("New WebSocket connection");

  // Настройка обработчиков событий
  ws.on("message", async (data) => { ... });
  ws.on("close", () => { ... });
  ws.on("error", (error) => { ... });

  // Отправка приветственного сообщения
  ws.send(JSON.stringify({
    type: "connected",
    data: { message: "WebSocket connection established" }
  }));
}
```

### 2. Обработка сообщений

```javascript
ws.on("message", async (data) => {
  try {
    const message: WebSocketMessage = JSON.parse(data.toString());
    await this.handleMessage(ws, message);
  } catch (error) {
    // Обработка ошибок парсинга
    ws.send(
      JSON.stringify({
        type: "error",
        data: { message: "Invalid message format" },
      })
    );
  }
});
```

### 3. Роутинг сообщений

```javascript
private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  switch (message.type) {
    case "join_chat":      // Присоединение к чату
      await this.handleJoinChat(ws, message);
      break;
    case "create_chat":    // Создание нового чата
      await this.handleCreateChat(ws, message);
      break;
    case "message":        // Отправка сообщения
      await this.handleChatMessage(ws, message);
      break;
    default:
      // Неизвестный тип сообщения
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Unknown message type" }
      }));
  }
}
```

## Аутентификация и авторизация

### 1. Процесс аутентификации

```javascript
private async authenticateUser(token: string): Promise<string | null> {
  try {
    // Проверяем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    // Проверяем существование пользователя в БД
    const user = await User.findById(decoded.userId);
    if (!user) return null;

    return decoded.userId;
  } catch (error) {
    return null;
  }
}
```

### 2. Присоединение к чату

```javascript
private async handleJoinChat(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  const { token, chatId } = message.data;

  // 1. Аутентификация пользователя
  const userId = await this.authenticateUser(token);
  if (!userId) {
    ws.send(JSON.stringify({
      type: "error",
      data: { message: "Invalid authentication token" }
    }));
    return;
  }

  // 2. Сохранение пользователя в соединении
  ws.userId = userId;
  this.clients.set(userId, ws);

  // 3. Присоединение к конкретному чату (если указан)
  if (chatId) {
    const chat = await Chat.findOne({ _id: chatId, userId }).populate("messages");
    if (!chat) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Chat not found or access denied" }
      }));
      return;
    }

    ws.chatId = chatId;
    // Отправляем историю сообщений
    ws.send(JSON.stringify({
      type: "chat_joined",
      data: {
        chatId,
        messages: chat.messages,
        title: chat.title
      }
    }));
  }
}
```

## Обработка сообщений чата

### 1. Получение сообщения от пользователя

```javascript
private async handleChatMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  // Проверки безопасности
  if (!ws.userId || !ws.chatId) {
    ws.send(JSON.stringify({
      type: "error",
      data: { message: "Not authenticated or not in a chat" }
    }));
    return;
  }

  const { message: userMessage } = message.data;

  try {
    // 1. Найти чат в БД
    const chat = await Chat.findOne({ _id: ws.chatId, userId: ws.userId });

    // 2. Создать сообщение пользователя в БД
    const userMessageDoc = await Message.create({
      content: userMessage,
      role: "user",
    });

    // 3. Добавить сообщение к чату
    chat.messages.push(userMessageDoc._id);
    chat.updatedAt = new Date();
    await chat.save();

    // 4. Подтвердить получение сообщения
    ws.send(JSON.stringify({
      type: "user_message",
      data: {
        messageId: userMessageDoc._id,
        content: userMessage,
        role: "user",
        timestamp: userMessageDoc.createdAt
      }
    }));

    // 5. Генерировать ответ ИИ
    await this.generateAIResponse(ws, chat);

  } catch (error) {
    // Обработка ошибок
  }
}
```

### 2. Потоковая генерация ответа ИИ

```javascript
// Уведомление о начале генерации
ws.send(
  JSON.stringify({
    type: "assistant_message_start",
    data: { message: "Ассистент печатает..." },
  })
);

let assistantMessageContent = "";

// Создание потока OpenAI
const stream = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: openaiMessages,
  stream: true, // Включаем потоковый режим
  temperature: 0.7,
});

// Обработка потока токенов
for await (const chunk of stream) {
  const token = chunk.choices?.[0]?.delta?.content || "";
  if (token) {
    assistantMessageContent += token;

    // Отправляем каждый токен клиенту немедленно
    ws.send(
      JSON.stringify({
        type: "assistant_message_token",
        data: { token },
      })
    );
  }
}

// Завершение генерации
const assistantMessageDoc = await Message.create({
  content: assistantMessageContent,
  role: "assistant",
});

chat.messages.push(assistantMessageDoc._id);
await chat.save();

// Уведомление о завершении
ws.send(
  JSON.stringify({
    type: "assistant_message_complete",
    data: {
      messageId: assistantMessageDoc._id,
      content: assistantMessageContent,
      role: "assistant",
      timestamp: assistantMessageDoc.createdAt,
    },
  })
);
```

## Управление состоянием чатов

### 1. Создание нового чата

```javascript
private async handleCreateChat(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: "error",
      data: { message: "Not authenticated" }
    }));
    return;
  }

  try {
    // Создаем новый чат в БД
    const chat = await Chat.create({
      userId: ws.userId,
      title: "Новый чат",
      description: "Новая беседа",
      messages: [],
    });

    // Привязываем чат к WebSocket соединению
    ws.chatId = chat._id.toString();

    // Уведомляем клиента
    ws.send(JSON.stringify({
      type: "chat_created",
      data: {
        chatId: chat._id,
        title: chat.title
      }
    }));

  } catch (error) {
    ws.send(JSON.stringify({
      type: "error",
      data: { message: "Failed to create chat" }
    }));
  }
}
```

### 2. Автоматическое обновление заголовка

```javascript
// Обновляем заголовок чата после первого обмена сообщениями
if (chat.messages.length === 2) {
  chat.title =
    userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
}
```

## Обработка ошибок и отключений

### 1. Обработка отключения клиента

```javascript
ws.on("close", () => {
  if (ws.userId) {
    this.clients.delete(ws.userId); // Удаляем из активных соединений
  }
  console.log("WebSocket connection closed");
});
```

### 2. Обработка ошибок WebSocket

```javascript
ws.on("error", (error) => {
  console.error("WebSocket error:", error);
  // Автоматическая очистка произойдет при закрытии соединения
});
```

### 3. Обработка ошибок OpenAI

```javascript
try {
  // Обычная генерация ответа
} catch (openaiError) {
  console.error("OpenAI error:", openaiError);

  const errorMessage =
    "Извините, произошла ошибка при обработке вашего сообщения.";

  // Создаем сообщение об ошибке в БД
  const assistantMessageDoc = await Message.create({
    content: errorMessage,
    role: "assistant",
  });

  chat.messages.push(assistantMessageDoc._id);
  await chat.save();

  // Отправляем сообщение об ошибке клиенту
  ws.send(
    JSON.stringify({
      type: "assistant_message_complete",
      data: {
        messageId: assistantMessageDoc._id,
        content: errorMessage,
        role: "assistant",
        timestamp: assistantMessageDoc.createdAt,
      },
    })
  );
}
```

## Дополнительные возможности

### 1. Рассылка сообщений

```javascript
// Отправка всем подключенным клиентам
public broadcast(message: any) {
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Отправка конкретному пользователю
public sendToUser(userId: string, message: any) {
  const client = this.clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}
```

### 2. Проверка состояния соединения

```javascript
if (client.readyState === WebSocket.OPEN) {
  // Соединение активно
} else if (client.readyState === WebSocket.CLOSED) {
  // Соединение закрыто
} else if (client.readyState === WebSocket.CONNECTING) {
  // Соединение устанавливается
}
```

## Безопасность

### 1. Аутентификация на каждое действие

- Проверка JWT токена при присоединении
- Проверка `userId` и `chatId` перед каждым действием
- Валидация доступа к чату через БД

### 2. Валидация данных

- Проверка формата входящих сообщений
- Санитизация пользовательского ввода
- Ограничение размера сообщений

### 3. Изоляция пользователей

- Каждый пользователь видит только свои чаты
- Проверка прав доступа на уровне БД
- Отдельные WebSocket соединения для каждого пользователя

## Масштабирование

### Текущие ограничения:

- Все соединения хранятся в памяти одного процесса
- При перезапуске сервера все соединения теряются

### Решения для продакшена:

- **Redis** для хранения активных соединений
- **Sticky sessions** для балансировки нагрузки
- **WebSocket кластеризация** для горизонтального масштабирования
- **Rate limiting** для предотвращения спама

Эта архитектура обеспечивает надежную, безопасную и масштабируемую систему реального времени для чата с ИИ.
