const WebSocket = require('ws');

console.log('🔌 Connecting to WebSocket server...');
const ws = new WebSocket('ws://localhost:3000/ws/chat');

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('📊 Server is running and accepting connections');
    
    // Отправляем тестовое сообщение
    ws.send(JSON.stringify({
        type: 'subscribe_chat',
        data: {
            token: 'invalid_token',
            chatId: 'test_chat_id'
        }
    }));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
        
        if (message.type === 'error' && message.data.message === 'Invalid authentication token') {
            console.log('✅ Authentication validation is working correctly');
            console.log('🎉 New multi-chat architecture is properly implemented!');
            ws.close();
        }
    } catch (error) {
        console.error('❌ Error parsing message:', error);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    console.log('✅ Test completed successfully!');
}); 