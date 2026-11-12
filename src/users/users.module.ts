import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMapping } from './user-mapping.entity';
import { RedisService } from './redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserMapping])],
  controllers: [UsersController],
  providers: [UsersService, RedisService],
})
export class UsersModule {}
