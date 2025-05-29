const WebSocket = require("ws");

// Конфигурация тестирования
const CONFIG = {
  serverUrl: "ws://localhost:3000/ws/chat",
  totalUsers: 2000, // количество пользователей
  connectionsPerUser: 2, // соединения на пользователя
  messagesPerConnection: 2, //  количество сообщений
  messageInterval: 4000, //  интервал
  testToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODJkYmJlMTYyNjkxYjhhYmZlNzVlYzEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDg1MTYyMTksImV4cCI6MTc1MDI0NDIxOX0.R5_Ifd3uP9ykQNjQozCaBddOVal0mTYghneVPLWp4IQ",
  debug: false, //  детальная отладка
};

class LoadTester {
  constructor(config) {
    this.config = config;
    this.connections = [];
    this.authenticatedConnections = 0;
    this.chatsCreated = 0;
    this.stats = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      authErrors: 0,
      rateLimitErrors: 0,
      startTime: null,
      endTime: null,
    };
  }

  async runTest() {
    console.log("🚀 Начинаем нагрузочное тестирование WebSocket сервера");
    console.log(`📊 Конфигурация:
    - Пользователей: ${this.config.totalUsers}
    - Соединений на пользователя: ${this.config.connectionsPerUser}
    - Сообщений на соединение: ${this.config.messagesPerConnection}
    - Интервал между сообщениями: ${this.config.messageInterval}мс
    `);

    this.stats.startTime = Date.now();

    // соединения для каждого пользователя
    for (let userId = 1; userId <= this.config.totalUsers; userId++) {
      await this.createUserConnections(userId);

      // задержка между пользователями
      await this.sleep(100); // задержка
    }

    console.log(
      `✅ Создано ${this.stats.successfulConnections} соединений из ${this.stats.totalConnections} попыток`
    );
    console.log(
      `🔐 Аутентифицировано соединений: ${this.authenticatedConnections}`
    );
    console.log(`💬 Создано чатов: ${this.chatsCreated}`);

    // Ждем больше времени для аутентификации
    console.log("⏳ Ждем завершения аутентификации...");
    await this.sleep(5000);

    // Ждем создания чатов
    console.log("⏳ Ждем создания чатов...");
    await this.sleep(3000);

    // Начинаем отправку сообщений
    await this.startMessaging();

    // Ждем завершения всех сообщений
    await this.sleep(
      this.config.messagesPerConnection * this.config.messageInterval + 10000
    );

    this.stats.endTime = Date.now();
    this.printResults();
    this.cleanup();
  }

  async createUserConnections(userId) {
    const chatTypes = ["messages", "documents"];

    for (let i = 0; i < this.config.connectionsPerUser; i++) {
      const chatType = chatTypes[i % chatTypes.length];
      await this.createConnection(userId, chatType, i);
    }
  }

  createConnection(userId, chatType, connectionIndex) {
    return new Promise((resolve) => {
      const ws = new WebSocket(this.config.serverUrl);
      const connectionId = `user${userId}_${chatType}_${connectionIndex}`;

      this.stats.totalConnections++;

      let isAuthenticated = false;
      let hasJoinedChat = false;

      ws.on("open", () => {
        if (this.config.debug) {
          console.log(`🔗 Соединение ${connectionId} установлено`);
        }
        this.stats.successfulConnections++;

        // Аутентификация
        ws.send(
          JSON.stringify({
            type: "join_chat",
            data: {
              token: this.config.testToken,
              chatType: chatType,
            },
          })
        );

        this.connections.push({
          ws,
          userId,
          chatType,
          connectionId,
          messagesSent: 0,
          isAuthenticated: false,
          hasJoinedChat: false,
        });

        resolve();
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.stats.messagesReceived++;

          if (this.config.debug) {
            console.log(`📨 ${connectionId} получил:`, message.type);
          }

          // Отслеживаем состояние аутентификации
          if (message.type === "authenticated") {
            isAuthenticated = true;
            this.authenticatedConnections++;
            const connection = this.connections.find(
              (c) => c.connectionId === connectionId
            );
            if (connection) {
              connection.isAuthenticated = true;

              // После аутентификации создаем чат
              if (this.config.debug) {
                console.log(
                  `🔐 ${connectionId}: аутентифицирован, создаем чат`
                );
              }

              ws.send(
                JSON.stringify({
                  type: "create_chat",
                  data: {
                    chatType: chatType,
                  },
                })
              );
            }
          }

          if (
            message.type === "chat_joined" ||
            message.type === "chat_created"
          ) {
            hasJoinedChat = true;
            this.chatsCreated++;
            const connection = this.connections.find(
              (c) => c.connectionId === connectionId
            );
            if (connection) {
              connection.hasJoinedChat = true;

              if (this.config.debug) {
                console.log(`💬 ${connectionId}: присоединился к чату`);
              }
            }
          }

          if (message.type === "error") {
            console.error(`❌ Ошибка в ${connectionId}:`, message.data.message);
            this.stats.errors++;

            if (
              message.data.message.includes("Authentication") ||
              message.data.message.includes("token")
            ) {
              this.stats.authErrors++;
            }

            if (message.data.message.includes("Rate limit")) {
              this.stats.rateLimitErrors++;
            }
          }
        } catch (error) {
          console.error(
            `❌ Ошибка парсинга сообщения в ${connectionId}:`,
            error
          );
          this.stats.errors++;
        }
      });

      ws.on("error", (error) => {
        console.error(`❌ Ошибка соединения ${connectionId}:`, error.message);
        this.stats.failedConnections++;
        this.stats.errors++;
        resolve();
      });

      ws.on("close", () => {
        if (this.config.debug) {
          console.log(`🔌 Соединение ${connectionId} закрыто`);
        }
      });

      // Таймаут для соединения
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error(`⏰ Таймаут соединения ${connectionId}`);
          this.stats.failedConnections++;
          ws.terminate();
          resolve();
        }
      }, 15000); // Увеличим таймаут
    });
  }

  async startMessaging() {
    console.log("📤 Начинаем отправку сообщений...");

    // Фильтруем только готовые соединения
    const readyConnections = this.connections.filter(
      (connection) =>
        connection.ws.readyState === WebSocket.OPEN &&
        (connection.isAuthenticated || connection.hasJoinedChat)
    );

    console.log(
      `📊 Готовых соединений для отправки сообщений: ${readyConnections.length} из ${this.connections.length}`
    );

    if (readyConnections.length === 0) {
      console.error("❌ Нет готовых соединений для отправки сообщений!");
      return;
    }

    const messagingPromises = readyConnections.map(async (connection) => {
      for (let i = 0; i < this.config.messagesPerConnection; i++) {
        // Добавляем случайную задержку
        await this.sleep(Math.random() * this.config.messageInterval + 1000);

        if (connection.ws.readyState === WebSocket.OPEN) {
          const testMessage = this.generateTestMessage(connection.chatType, i);

          if (this.config.debug) {
            console.log(
              `📤 ${connection.connectionId}: отправляем сообщение "${testMessage}"`
            );
          }

          connection.ws.send(
            JSON.stringify({
              type: "message",
              data: {
                message: testMessage,
              },
            })
          );

          connection.messagesSent++;
          this.stats.messagesSent++;

          console.log(
            `📨 ${connection.connectionId}: отправлено сообщение ${i + 1}/${
              this.config.messagesPerConnection
            }`
          );
        } else {
          console.warn(
            `⚠️ ${connection.connectionId}: соединение не готово для отправки`
          );
        }
      }
    });

    await Promise.all(messagingPromises);
  }

  generateTestMessage(chatType, messageIndex) {
    const documentMessages = [
      "Помогите проанализировать этот договор аренды",
      "Какие документы нужны для получения визы?",
      "Проверьте правильность заполнения заявления",
    ];

    const generalMessages = [
      "Какие права у арендатора при расторжении договора?",
      "Как подать апелляцию на решение суда?",
      "Что делать при нарушении трудовых прав?",
    ];

    const messages =
      chatType === "documents" ? documentMessages : generalMessages;
    return messages[messageIndex % messages.length];
  }

  printResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const successRate = (
      (this.stats.successfulConnections / this.stats.totalConnections) *
      100
    ).toFixed(2);
    const messagesPerSecond = (this.stats.messagesSent / duration).toFixed(2);
    const expectedMessages =
      this.config.totalUsers *
      this.config.connectionsPerUser *
      this.config.messagesPerConnection;

    console.log("\n📊 РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ");
    console.log("=".repeat(60));
    console.log(`⏱️  Длительность теста: ${duration.toFixed(2)} секунд`);
    console.log(`🔗 Соединения:`);
    console.log(`   - Всего попыток: ${this.stats.totalConnections}`);
    console.log(`   - Успешных: ${this.stats.successfulConnections}`);
    console.log(`   - Неудачных: ${this.stats.failedConnections}`);
    console.log(`   - Успешность: ${successRate}%`);
    console.log(`   - Аутентифицировано: ${this.authenticatedConnections}`);
    console.log(`   - Создано чатов: ${this.chatsCreated}`);
    console.log(`📤 Сообщения:`);
    console.log(`   - Ожидалось: ${expectedMessages}`);
    console.log(`   - Отправлено: ${this.stats.messagesSent}`);
    console.log(`   - Получено: ${this.stats.messagesReceived}`);
    console.log(`   - Сообщений/сек: ${messagesPerSecond}`);
    console.log(`❌ Ошибки:`);
    console.log(`   - Всего: ${this.stats.errors}`);
    console.log(`   - Аутентификация: ${this.stats.authErrors}`);
    console.log(`   - Rate limiting: ${this.stats.rateLimitErrors}`);
    console.log("=".repeat(60));

    if (successRate < 95) {
      console.log("⚠️  ВНИМАНИЕ: Низкий процент успешных соединений!");
    }

    if (this.stats.messagesSent < expectedMessages * 0.8) {
      console.log("⚠️  ВНИМАНИЕ: Отправлено меньше сообщений чем ожидалось!");
    }

    if (this.stats.errors > this.stats.messagesSent * 0.05) {
      console.log("⚠️  ВНИМАНИЕ: Высокий процент ошибок!");
    }

    if (
      successRate >= 95 &&
      this.stats.errors <= this.stats.messagesSent * 0.05 &&
      this.stats.messagesSent >= expectedMessages * 0.8
    ) {
      console.log("✅ Тест прошел успешно!");
    }

    // Рекомендации
    console.log("\n💡 РЕКОМЕНДАЦИИ:");
    if (this.stats.authErrors > 0) {
      console.log("- Проверьте валидность JWT токена");
    }
    if (this.stats.rateLimitErrors > 0) {
      console.log(
        "- Увеличьте интервалы между сообщениями или настройте rate limiting"
      );
    }
    if (this.authenticatedConnections < this.stats.successfulConnections) {
      console.log("- Не все соединения прошли аутентификацию");
    }
  }

  cleanup() {
    console.log("🧹 Закрываем соединения...");
    this.connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Запуск тестирования
async function main() {
  const tester = new LoadTester(CONFIG);

  try {
    await tester.runTest();
  } catch (error) {
    console.error("❌ Ошибка во время тестирования:", error);
  }

  process.exit(0);
}

// Обработка сигналов для корректного завершения
process.on("SIGINT", () => {
  console.log("\n🛑 Получен сигнал прерывания, завершаем тест...");
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = LoadTester;
