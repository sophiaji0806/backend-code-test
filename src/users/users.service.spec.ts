import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserMapping } from './user-mapping.entity';
import { RedisService } from './redis.service';

describe('UsersService', () => {
  let service: UsersService;

  const mappings = {
    findOneBy: jest.fn(),
    insert: jest.fn(),
  };

  const cache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue(undefined);

    mappings.insert.mockResolvedValue({
      identifiers: [],
      generatedMaps: [],
      raw: {},
    });

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserMapping),
          useValue: mappings,
        },
        {
          provide: RedisService,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('新组合：生成 UUID v4，并保存相同的编号', async () => {
    mappings.findOneBy.mockResolvedValue(null);

    const result = await service.resolve('ABC123', 'XYZ456');

    expect(result.userID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(mappings.insert).toHaveBeenCalledWith({
      id1: 'ABC123',
      id2: 'XYZ456',
      userID: result.userID,
    });
  });

  it('已有组合：返回原编号，不新增记录', async () => {
    const userID = '550e8400-e29b-41d4-a716-446655440000';

    mappings.findOneBy.mockResolvedValue({ userID });

    const result = await service.resolve('ABC123', 'XYZ456');

    expect(result).toEqual({ userID });
    expect(mappings.insert).not.toHaveBeenCalled();
  });
});
