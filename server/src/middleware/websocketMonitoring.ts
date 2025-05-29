import { Request, Response, NextFunction } from 'express';

interface WebSocketMetrics {
  totalConnections: number;
  totalUsers: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

class WebSocketMonitor {
  private metrics: WebSocketMetrics = {
    totalConnections: 0,
    totalUsers: 0,
    messagesPerMinute: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: Date.now()
  };

  private messageCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private lastMinuteReset = Date.now();

  public updateConnectionCount(connections: number, users: number): void {
    this.metrics.totalConnections = connections;
    this.metrics.totalUsers = users;
  }

  public recordMessage(): void {
    this.messageCount++;
    this.updateMinutelyStats();
  }

  public recordError(): void {
    this.errorCount++;
    this.updateMinutelyStats();
  }

  public recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift(); // Храним только последние 100 измерений
    }
    this.updateAverageResponseTime();
  }

  private updateMinutelyStats(): void {
    const now = Date.now();
    const timeSinceReset = now - this.lastMinuteReset;
    
    if (timeSinceReset >= 60000) { // 1 минута
      this.metrics.messagesPerMinute = this.messageCount;
      this.metrics.errorRate = this.errorCount / Math.max(this.messageCount, 1);
      
      // Сброс счетчиков
      this.messageCount = 0;
      this.errorCount = 0;
      this.lastMinuteReset = now;
    }
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.responseTimes.length;
    }
  }

  public getMetrics(): WebSocketMetrics {
    this.metrics.uptime = Date.now() - this.metrics.uptime;
    return { ...this.metrics };
  }

  public getHealthStatus(): { status: 'healthy' | 'warning' | 'critical', issues: string[] } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Проверка нагрузки
    if (this.metrics.totalConnections > 1500) {
      issues.push('High connection count');
      status = 'warning';
    }

    if (this.metrics.totalConnections > 1800) {
      issues.push('Critical connection count');
      status = 'critical';
    }

    // Проверка времени ответа
    if (this.metrics.averageResponseTime > 5000) {
      issues.push('High response time');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (this.metrics.averageResponseTime > 10000) {
      issues.push('Critical response time');
      status = 'critical';
    }

    // Проверка ошибок
    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (this.metrics.errorRate > 0.2) {
      issues.push('Critical error rate');
      status = 'critical';
    }

    return { status, issues };
  }
}

export const wsMonitor = new WebSocketMonitor();

export const websocketHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = wsMonitor.getMetrics();
    const health = wsMonitor.getHealthStatus();

    res.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      metrics,
      issues: health.issues
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
};

export const websocketMetrics = (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = wsMonitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      error: 'Failed to get metrics'
    });
  }
}; 


// shoha