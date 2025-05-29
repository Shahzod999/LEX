export interface WebSocketConfig {
  maxConnections: number;
  maxConnectionsPerUser: number;
  rateLimitWindow: number; // в миллисекундах
  rateLimitMaxMessages: number;
  cleanupInterval: number; // в миллисекундах
  inactiveTimeout: number; // в миллисекундах
  maxPayload: number; // в байтах
  maxMessageLength: number; // в символах
  maxTokens: number; // для OpenAI ответов
}

export const defaultWebSocketConfig: WebSocketConfig = {
  maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || "2000"),
  maxConnectionsPerUser: parseInt(
    process.env.WS_MAX_CONNECTIONS_PER_USER || "5"
  ),
  rateLimitWindow: parseInt(process.env.WS_RATE_LIMIT_WINDOW || "60000"), // 1 минута
  rateLimitMaxMessages: parseInt(
    process.env.WS_RATE_LIMIT_MAX_MESSAGES || "30"
  ),
  cleanupInterval: parseInt(process.env.WS_CLEANUP_INTERVAL || "300000"), // 5 минут
  inactiveTimeout: parseInt(process.env.WS_INACTIVE_TIMEOUT || "1800000"), // 30 минут
  maxPayload: parseInt(process.env.WS_MAX_PAYLOAD || "16384"), // 16KB
  maxMessageLength: parseInt(process.env.WS_MAX_MESSAGE_LENGTH || "4000"),
  maxTokens: parseInt(process.env.WS_MAX_TOKENS || "2000"),
};

export const getWebSocketConfig = (): WebSocketConfig => {
  return {
    ...defaultWebSocketConfig,
    // Дополнительные проверки для продакшена
    maxConnections: Math.min(defaultWebSocketConfig.maxConnections, 5000),
    maxConnectionsPerUser: Math.min(
      defaultWebSocketConfig.maxConnectionsPerUser,
      10
    ),
    rateLimitMaxMessages: Math.min(
      defaultWebSocketConfig.rateLimitMaxMessages,
      100
    ),
  };
};


// shoha