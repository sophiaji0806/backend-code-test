import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { UserMapping } from './user-mapping.entity';
import { RedisService } from './redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserMapping)
    private readonly mappings: Repository<UserMapping>,
    private readonly cache: RedisService,
  ) {}

  async resolve(id1: string, id2: string): Promise<{ userID: string }> {
    const key = `user-mapping:${JSON.stringify([id1, id2])}`;

    const cached = await this.cache.get(key);

    if (cached !== null) {
      return { userID: cached };
    }

    const result = await this.resolveFromDatabase(id1, id2);

    await this.cache.set(key, result.userID);

    return result;
  }

  private async resolveFromDatabase(
    id1: string,
    id2: string,
  ): Promise<{ userID: string }> {
    const existing = await this.mappings.findOneBy({
      id1,
      id2,
    });

    if (existing) {
      return { userID: existing.userID };
    }

    const userID = randomUUID();

    try {
      await this.mappings.insert({
        id1,
        id2,
        userID,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        error.driverError.code === 'ER_DUP_ENTRY'
      ) {
        const saved = await this.mappings.findOneBy({
          id1,
          id2,
        });

        if (saved) {
          return { userID: saved.userID };
        }
      }

      throw error;
    }

    return { userID };
  }
}
