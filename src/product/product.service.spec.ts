import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(async () => {
    mockEntityManager = {
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with sku and displayName', async () => {
      const createProductDto = { sku: 'SKU-001', displayName: 'Test Product' };

      const result = await service.create(createProductDto);

      expect(result).toBeInstanceOf(Product);
      expect(result.sku).toBe('SKU-001');
      expect(result.displayName).toBe('Test Product');
    });

    it('should persist and flush the product', async () => {
      const createProductDto = { sku: 'SKU-002', displayName: 'Another Product' };

      await service.create(createProductDto);

      expect(mockEntityManager.persist).toHaveBeenCalledWith(expect.any(Product));
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [
        { uuid: '1', sku: 'SKU-001', displayName: 'Product 1' },
        { uuid: '2', sku: 'SKU-002', displayName: 'Product 2' },
      ];
      (mockEntityManager.findAll! as jest.Mock).mockResolvedValue(products as Product[]);

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(mockEntityManager.findAll).toHaveBeenCalledWith(Product);
    });

    it('should return empty array when no products exist', async () => {
      (mockEntityManager.findAll! as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockEntityManager.findAll).toHaveBeenCalledWith(Product);
    });
  });
});
