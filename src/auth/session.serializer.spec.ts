import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { SessionSerializer } from './session.serializer';
import { User } from '../entities/user.entity';

describe('SessionSerializer', () => {
  let serializer: SessionSerializer;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockOrm: jest.Mocked<MikroORM>;

  const mockUser: User = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashedpassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockOrm = {
      em: {
        fork: jest.fn().mockReturnValue(mockEntityManager),
      },
    } as unknown as jest.Mocked<MikroORM>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionSerializer,
        {
          provide: MikroORM,
          useValue: mockOrm,
        },
      ],
    }).compile();

    serializer = module.get<SessionSerializer>(SessionSerializer);
  });

  it('should be defined', () => {
    expect(serializer).toBeDefined();
  });

  describe('serializeUser', () => {
    it('should serialize user by storing email', () => {
      const done = jest.fn();

      serializer.serializeUser(mockUser, done);

      expect(done).toHaveBeenCalledWith(null, mockUser.email);
    });
  });

  describe('deserializeUser', () => {
    it('should deserialize user by email and strip password', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      const done = jest.fn();

      await serializer.deserializeUser('test@example.com', done);

      expect(mockOrm.em.fork).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: 'test@example.com',
      });
      expect(done).toHaveBeenCalledWith(null, {
        uuid: mockUser.uuid,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      // Verify password is not included
      const resultUser = done.mock.calls[0][1];
      expect(resultUser).not.toHaveProperty('passwordHash');
    });

    it('should return null when user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);
      const done = jest.fn();

      await serializer.deserializeUser('nonexistent@example.com', done);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: 'nonexistent@example.com',
      });
      expect(done).toHaveBeenCalledWith(null, null);
    });
  });
});
