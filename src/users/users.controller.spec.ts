import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('用户编号接口', () => {
  let app: INestApplication;

  const userID = '550e8400-e29b-41d4-a716-446655440000';
  const service = { resolve: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    app = module.createNestApplication({ logger: false });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    service.resolve.mockReset();
    service.resolve.mockResolvedValue({ userID });
  });

  afterAll(async () => {
    await app.close();
  });

  it('完整参数：返回 200 和用户编号', async () => {
    await request(app.getHttpServer())
      .post('/users/resolve')
      .send({ id1: 'ABC123', id2: 'XYZ456' })
      .expect(200)
      .expect({ userID });

    expect(service.resolve).toHaveBeenCalledWith('ABC123', 'XYZ456');
  });

  it('缺少 id2：返回 400，不调用业务服务', async () => {
    await request(app.getHttpServer())
      .post('/users/resolve')
      .send({ id1: 'ABC123' })
      .expect(400);

    expect(service.resolve).not.toHaveBeenCalled();
  });

  it('内部错误：返回 500，不暴露内部错误内容', async () => {
    service.resolve.mockRejectedValue(new Error('internal-test-error'));

    await request(app.getHttpServer())
      .post('/users/resolve')
      .send({ id1: 'ABC123', id2: 'XYZ456' })
      .expect(500)
      .expect({
        statusCode: 500,
        message: 'Internal server error',
      });
  });
});
