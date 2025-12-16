import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ShopService', () => {
  let service: ShopService;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(async () => {
    mockEntityManager = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return only products that are on sale', async () => {
      const products = [
        { uuid: '1', sku: 'SKU-001', displayName: 'Product 1', isOnSale: true },
        { uuid: '2', sku: 'SKU-002', displayName: 'Product 2', isOnSale: true },
      ];
      (mockEntityManager.findAll as jest.Mock).mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(mockEntityManager.findAll).toHaveBeenCalledWith(Product, {
        where: { isOnSale: true },
      });
    });

    it('should return empty array when no products are on sale', async () => {
      (mockEntityManager.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockEntityManager.findAll).toHaveBeenCalledWith(Product, {
        where: { isOnSale: true },
      });
    });
  });

  describe('findOne', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should return a product when found and on sale', async () => {
      const mockProduct = {
        uuid: mockUuid,
        sku: 'SKU-001',
        displayName: 'Test Product',
        isOnSale: true,
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUuid);

      expect(result).toEqual(mockProduct);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        uuid: mockUuid,
        isOnSale: true,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockUuid)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUuid)).rejects.toThrow('Product not found');
    });

    it('should throw NotFoundException when product exists but is not on sale', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockUuid)).rejects.toThrow(NotFoundException);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        uuid: mockUuid,
        isOnSale: true,
      });
    });
  });
});
