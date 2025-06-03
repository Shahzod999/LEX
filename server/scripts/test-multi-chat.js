const WebSocket = require('ws');

// Тестовый токен (замените на реальный)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzZlNTQ5N2YzN2UzODlmODAzYmVkYTYiLCJlbWFpbCI6InVzZXJAZ21haWwuY29tIiwiaWF0IjoxNzM1MzgxMTUyLCJleHAiOjE3MzU5ODU5NTJ9.TJ8FH83bLRiPTajdNX5rDhNE9hsjSjEKp5p_CvYLh08';

// Тестовые ID чатов (замените на реальные)
const CHAT_A_ID = '676e5510f37e389f803bed18';
const CHAT_B_ID = '676e5510f37e389f803bed19';

class ChatTester {
    constructor() {
        this.ws = null;
        this.subscribedChats = new Set();
        this.receivedMessages = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to WebSocket...');
            this.ws = new WebSocket('ws://localhost:3000/ws/chat');

            this.ws.on('open', () => {
                console.log('✅ Connected to WebSocket');
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ Error parsing message:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('🔌 WebSocket disconnected');
            });
        });
    }

    handleMessage(message) {
        console.log(`📨 Received: ${message.type}`, message.data);
        this.receivedMessages.push(message);

        switch (message.type) {
            case 'connected':
                console.log('✅ Connection established');
                break;
            case 'authenticated':
                console.log(`✅ Authenticated as user: ${message.data.userId}`);
                break;
            case 'chat_subscribed':
                this.subscribedChats.add(message.data.chatId);
                console.log(`✅ Subscribed to chat: ${message.data.chatId}`);
                break;
            case 'chat_unsubscribed':
                this.subscribedChats.delete(message.data.chatId);
                console.log(`✅ Unsubscribed from chat: ${message.data.chatId}`);
                break;
            case 'user_message':
                console.log(`📤 User message in chat ${message.data.chatId}: ${message.data.content}`);
                break;
            case 'assistant_message_start':
                console.log(`🤖 Assistant started typing in chat: ${message.data.chatId}`);
                break;
            case 'assistant_message_token':
                process.stdout.write(message.data.token);
                break;
            case 'assistant_message_complete':
                console.log(`\n✅ Assistant completed message in chat: ${message.data.chatId}`);
                break;
            case 'error':
                console.error(`❌ Server error: ${message.data.message}`);
                break;
        }
    }

    send(messageType, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = { type: messageType, data };
            this.ws.send(JSON.stringify(message));
            console.log(`📤 Sent: ${messageType}`, data);
        } else {
            console.error('❌ WebSocket not connected');
        }
    }

    subscribeToChat(chatId) {
        this.send('subscribe_chat', {
            token: TEST_TOKEN,
            chatId: chatId
        });
    }

    unsubscribeFromChat(chatId) {
        this.send('unsubscribe_chat', {
            chatId: chatId
        });
    }

    sendMessage(chatId, message) {
        this.send('message', {
            chatId: chatId,
            message: message
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runTest() {
        try {
            // 1. Подключение
            await this.connect();
            await this.sleep(1000);

            // 2. Подписка на первый чат
            console.log('\n🟦 === ТЕСТ 1: Подписка на Chat A ===');
            this.subscribeToChat(CHAT_A_ID);
            await this.sleep(2000);

            // 3. Отправка сообщения в первый чат
            console.log('\n🟦 === ТЕСТ 2: Отправка сообщения в Chat A ===');
            this.sendMessage(CHAT_A_ID, 'Hello from Chat A!');
            await this.sleep(5000);

            // 4. Подписка на второй чат (параллельно с первым)
            console.log('\n🟩 === ТЕСТ 3: Подписка на Chat B (параллельно) ===');
            this.subscribeToChat(CHAT_B_ID);
            await this.sleep(2000);

            // 5. Отправка сообщения во второй чат
            console.log('\n🟩 === ТЕСТ 4: Отправка сообщения в Chat B ===');
            this.sendMessage(CHAT_B_ID, 'Hello from Chat B!');
            await this.sleep(5000);

            // 6. Проверка изоляции - отправка в разные чаты быстро
            console.log('\n🔄 === ТЕСТ 5: Быстрое переключение между чатами ===');
            this.sendMessage(CHAT_A_ID, 'Quick message to A');
            await this.sleep(500);
            this.sendMessage(CHAT_B_ID, 'Quick message to B');
            await this.sleep(500);
            this.sendMessage(CHAT_A_ID, 'Another message to A');
            await this.sleep(5000);

            // 7. Отписка от первого чата
            console.log('\n🔴 === ТЕСТ 6: Отписка от Chat A ===');
            this.unsubscribeFromChat(CHAT_A_ID);
            await this.sleep(1000);

            // 8. Попытка отправки сообщения в отписанный чат
            console.log('\n❌ === ТЕСТ 7: Попытка отправки в отписанный чат ===');
            this.sendMessage(CHAT_A_ID, 'This should fail');
            await this.sleep(2000);

            // 9. Отписка от второго чата
            console.log('\n🔴 === ТЕСТ 8: Отписка от Chat B ===');
            this.unsubscribeFromChat(CHAT_B_ID);
            await this.sleep(1000);

            console.log('\n✅ === ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
            console.log(`📊 Подписанные чаты: ${Array.from(this.subscribedChats).join(', ')}`);
            console.log(`📊 Всего сообщений получено: ${this.receivedMessages.length}`);

            this.ws.close();

        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    }
}

// Запуск тестов
const tester = new ChatTester();
tester.runTest(); 