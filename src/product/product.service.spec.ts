import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(async () => {
    mockEntityManager = {
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      assign: jest.fn(),
      remove: jest.fn().mockReturnThis(),
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

  describe('findOne', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should return a product when found', async () => {
      const mockProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Test Product' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUuid);

      expect(result).toEqual(mockProduct);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, mockUuid);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockUuid)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUuid)).rejects.toThrow('Product not found');
    });
  });

  describe('update', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';
    const existingProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Original Name' };

    it('should update and return the product when found', async () => {
      const updateDto = { sku: 'SKU-002', displayName: 'Updated Name' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue({ ...existingProduct });

      const result = await service.update(mockUuid, updateDto);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, mockUuid);
      expect(mockEntityManager.assign).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: mockUuid }),
        updateDto
      );
      expect(mockEntityManager.flush).toHaveBeenCalled();
      expect(result.uuid).toBe(mockUuid);
    });

    it('should handle partial update with only sku', async () => {
      const updateDto = { sku: 'SKU-UPDATED' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue({ ...existingProduct });

      await service.update(mockUuid, updateDto);

      expect(mockEntityManager.assign).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: mockUuid }),
        updateDto
      );
    });

    it('should handle partial update with only displayName', async () => {
      const updateDto = { displayName: 'New Display Name' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue({ ...existingProduct });

      await service.update(mockUuid, updateDto);

      expect(mockEntityManager.assign).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: mockUuid }),
        updateDto
      );
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockUuid, { sku: 'SKU-002' })).rejects.toThrow(NotFoundException);
      await expect(service.update(mockUuid, { sku: 'SKU-002' })).rejects.toThrow('Product not found');
      expect(mockEntityManager.assign).not.toHaveBeenCalled();
      expect(mockEntityManager.flush).not.toHaveBeenCalled();
    });

    it('should handle empty update dto', async () => {
      const updateDto = {};
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue({ ...existingProduct });

      const result = await service.update(mockUuid, updateDto);

      expect(mockEntityManager.assign).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: mockUuid }),
        updateDto
      );
      expect(result.uuid).toBe(mockUuid);
    });
  });

  describe('remove', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should soft delete the product when found', async () => {
      const mockProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Test Product' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await service.remove(mockUuid);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, mockUuid);
      expect(mockProduct.deletedAt).toBeInstanceOf(Date);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockUuid)).rejects.toThrow(NotFoundException);
      await expect(service.remove(mockUuid)).rejects.toThrow('Product not found');
      expect(mockEntityManager.flush).not.toHaveBeenCalled();
    });

    it('should call findOne internally to validate existence', async () => {
      const mockProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Test Product' };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await service.remove(mockUuid);

      // Verify findOne was called (through the service's findOne method)
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, mockUuid);
    });
  });
});
