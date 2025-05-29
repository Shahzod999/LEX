# Подробное объяснение WebSocket чата в React Native

## Архитектура системы

Система состоит из нескольких ключевых компонентов:

1. **ChatScreen** - основной экран чата
2. **ChatHistoryMenu** - боковое меню с историей чатов
3. **useWebSocketChat** - хук для управления WebSocket соединением
4. **WebSocketChatService** - сервис для работы с WebSocket

## Как работает WebSocket

### 1. Установка соединения

```javascript
// WebSocketChatService создает соединение
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:3000/ws/chat";
this.socket = new WebSocket(wsUrl);
```

### 2. Жизненный цикл соединения

**Подключение:**

- Создается WebSocket соединение
- При успешном подключении отправляется токен аутентификации
- Сервер отвечает подтверждением

**Обработка событий:**

```javascript
this.socket.onopen = () => {
  // Соединение установлено
  this.send({
    type: "join_chat",
    data: { token: this.token },
  });
};

this.socket.onmessage = (event) => {
  // Получение сообщений от сервера
  const response = JSON.parse(event.data);
  this.handleMessage(response);
};
```

### 3. Типы сообщений WebSocket

**От клиента к серверу:**

- `join_chat` - присоединиться к существующему чату
- `create_chat` - создать новый чат
- `message` - отправить сообщение

**От сервера к клиенту:**

- `connected` - соединение установлено
- `authenticated` - пользователь аутентифицирован
- `chat_joined` - присоединился к чату
- `chat_created` - чат создан
- `user_message` - получено сообщение пользователя
- `assistant_message_start` - ИИ начал отвечать
- `assistant_message_token` - получен токен ответа ИИ
- `assistant_message_complete` - ответ ИИ завершен
- `error` - произошла ошибка

## Потоковая передача сообщений (Streaming)

### Как работает потоковая передача:

1. **Начало ответа:** Сервер отправляет `assistant_message_start`
2. **Передача токенов:** Сервер отправляет множество `assistant_message_token` с частями ответа
3. **Завершение:** Сервер отправляет `assistant_message_complete` с полным ответом

```javascript
service.onMessage("assistant_message_start", () => {
  setIsTyping(true); // Показываем индикатор печати
  setStreamingMessage(""); // Очищаем буфер
});

service.onMessage("assistant_message_token", (data) => {
  // Добавляем новый токен к существующему тексту
  setStreamingMessage((prev) => prev + data.token);
});

service.onMessage("assistant_message_complete", (data) => {
  setIsTyping(false); // Скрываем индикатор
  setStreamingMessage(""); // Очищаем буфер
  // Добавляем финальное сообщение в чат
});
```

### Преимущества потоковой передачи:

- Пользователь видит ответ в реальном времени
- Создается ощущение "живого" разговора
- Быстрая обратная связь

## Управление состоянием

### useWebSocketChat хук

Этот хук инкапсулирует всю логику WebSocket:

```javascript
const {
  isConnected,        // Статус соединения
  isConnecting,       // Процесс подключения
  currentChatId,      // ID текущего чата
  isTyping,           // ИИ печатает ответ
  streamingMessage,   // Текущий потоковый текст
  sendMessage,        // Функция отправки сообщения
  createChat,         // Создание нового чата
  joinChat,           // Присоединение к чату
  connect,            // Подключение к WebSocket
  disconnect          // Отключение
} = useWebSocketChat({...});
```

### Состояния в ChatScreen

```javascript
const [messages, setMessages] = useState<Message[]>([...]);     // Сообщения чата
const [inputText, setInputText] = useState("");                 // Текст ввода
const [isSending, setIsSending] = useState(false);             // Отправка сообщения
const [connectionError, setConnectionError] = useState(null);   // Ошибки соединения
```

## Обработка сообщений

### Отправка сообщения

```javascript
const handleSendMessage = async () => {
  if (inputText.trim() === "" || !isConnected || isSending) return;

  setIsSending(true); // Блокируем повторную отправку
  sendWebSocketMessage(inputText); // Отправляем через WebSocket
  setInputText(""); // Очищаем поле ввода

  // Добавляем индикатор "печатает"
  const typingIndicator = {
    id: Date.now() + 1,
    text: "Thinking...",
    isBot: true,
    isTyping: true,
  };
  setMessages((prev) => [...prev, typingIndicator]);
};
```

### Получение сообщения

```javascript
onMessage: useCallback((wsMessage: ChatMessage) => {
  const newMessage = {
    id: Date.now(),
    text: wsMessage.content,
    isBot: wsMessage.role === "assistant",
    messageId: wsMessage.messageId,
    timestamp: wsMessage.timestamp,
  };

  setMessages((prev) => {
    // Удаляем индикатор печати
    const filteredMessages = prev.filter((m) => !m.isTyping);
    // Добавляем новое сообщение
    return [...filteredMessages, newMessage];
  });

  setIsSending(false); // Разблокируем отправку
}, []);
```

## Переподключение и обработка ошибок

### Автоматическое переподключение

```javascript
private handleReconnect() {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.reconnectDelay * this.reconnectAttempts); // Экспоненциальная задержка
  }
}
```

### Обработка ошибок

- **Ошибки соединения:** Показываются в статус-индикаторе
- **Ошибки отправки:** Сбрасывают состояние отправки
- **Таймауты:** Автоматически очищаются через 5 секунд

## История чатов

### Загрузка истории

```javascript
useEffect(() => {
  if (isConnected && !currentChatId && !hasLoadedInitialChat && chatHistory) {
    if (chatHistory.length > 0) {
      // Присоединяемся к последнему чату
      const lastChat = chatHistory[0];
      joinChat(lastChat._id);
    } else {
      // Создаем новый чат
      createChat();
    }
  }
}, [isConnected, currentChatId, hasLoadedInitialChat, chatHistory]);
```

### Переключение между чатами

```javascript
const handleSelectChat = (chatId: string) => {
  if (isConnected) {
    setMessages([]); // Очищаем текущие сообщения
    setIsSending(false); // Сбрасываем состояние отправки
    joinChat(chatId); // Присоединяемся к выбранному чату
  }
};
```

## Ключевые особенности реализации

### 1. Singleton паттерн для WebSocket

- Один экземпляр сервиса на всё приложение
- Переиспользование соединения между компонентами

### 2. Индикаторы состояния

- Статус соединения (подключен/отключен/ошибка)
- Индикатор печати ИИ
- Блокировка повторных отправок

### 3. Оптимизация UI

- Потоковое отображение ответов ИИ
- Анимированное боковое меню
- Swipe-жесты для навигации

### 4. Управление памятью

- Очистка обработчиков при переподключении
- Удаление временных сообщений (индикаторы печати)
- Правильная очистка состояния при смене чатов

## Поток данных

1. **Пользователь отправляет сообщение**
2. **WebSocket отправляет сообщение на сервер**
3. **Сервер сохраняет сообщение пользователя**
4. **Сервер начинает генерацию ответа ИИ**
5. **Сервер отправляет токены ответа по мере генерации**
6. **Клиент отображает потоковый ответ в реальном времени**
7. **Сервер завершает ответ и сохраняет его**
8. **Клиент получает финальную версию и обновляет историю**

Эта архитектура обеспечивает быстрый, отзывчивый интерфейс чата с поддержкой реального времени и надежным управлением состоянием.
