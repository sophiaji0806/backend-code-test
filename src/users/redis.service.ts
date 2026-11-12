import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: ReturnType<typeof createClient>;

  constructor(config: ConfigService) {
    this.client = createClient({
      socket: {
        host: config.getOrThrow<string>('REDIS_HOST'),
        port: Number(config.getOrThrow<string>('REDIS_PORT')),
        connectTimeout: 1500,
        reconnectStrategy: 1000,
      },
      password: config.getOrThrow<string>('REDIS_PASSWORD'),
      disableOfflineQueue: true,
      commandOptions: {
        timeout: 1000,
      },
    });

    this.client.on('ready', () => {
      this.logger.log('Redis 连接成功');
    });

    this.client.on('error', () => {
      this.logger.warn('Redis 暂不可用，继续使用 MySQL');
    });
  }

  onModuleInit(): void {
    void this.client.connect().catch(() => {
      this.logger.warn('Redis 未连接，继续使用 MySQL');
    });
  }

  onModuleDestroy(): void {
    if (this.client.isOpen) {
      this.client.destroy();
    }
  }
  async get(key: string): Promise<string | null> {
    if (!this.client.isReady) {
      return null;
    }

    try {
      const value = await this.client.get(key);

      this.logger.log(value === null ? '缓存未命中' : '缓存命中');

      return value;
    } catch {
      this.logger.warn('读取缓存失败，继续查询 MySQL');
      return null;
    }
  }

  async set(key: string, userID: string): Promise<void> {
    if (!this.client.isReady) {
      return;
    }

    try {
      await this.client.set(key, userID, {
        expiration: {
          type: 'EX',
          value: 300,
        },
      });
    } catch {
      this.logger.warn('写入缓存失败，MySQL 中的数据不受影响');
    }
  }
}
