import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    mockProductService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call productService.create with the dto', async () => {
      const createProductDto: CreateProductDto = {
        sku: 'SKU-001',
        displayName: 'Test Product',
      };
      const expectedProduct = {
        uuid: 'test-uuid',
        sku: 'SKU-001',
        displayName: 'Test Product',
      };
      mockProductService.create.mockResolvedValue(expectedProduct as any);

      const result = await controller.create(createProductDto);

      expect(mockProductService.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [
        { uuid: '1', sku: 'SKU-001', displayName: 'Product 1' },
        { uuid: '2', sku: 'SKU-002', displayName: 'Product 2' },
      ];
      mockProductService.findAll.mockResolvedValue(products as any);

      const result = await controller.findAll();

      expect(mockProductService.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });

    it('should return empty array when no products exist', async () => {
      mockProductService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should call productService.findOne with the uuid', async () => {
      const expectedProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Test Product' };
      mockProductService.findOne.mockResolvedValue(expectedProduct as any);

      const result = await controller.findOne(mockUuid);

      expect(mockProductService.findOne).toHaveBeenCalledWith(mockUuid);
      expect(result).toEqual(expectedProduct);
    });

    it('should propagate NotFoundException from service', async () => {
      mockProductService.findOne.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.findOne(mockUuid)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should call productService.update with uuid and dto', async () => {
      const updateDto: UpdateProductDto = { sku: 'SKU-UPDATED', displayName: 'Updated Name' };
      const expectedProduct = { uuid: mockUuid, ...updateDto };
      mockProductService.update.mockResolvedValue(expectedProduct as any);

      const result = await controller.update(mockUuid, updateDto);

      expect(mockProductService.update).toHaveBeenCalledWith(mockUuid, updateDto);
      expect(result).toEqual(expectedProduct);
    });

    it('should handle partial update dto', async () => {
      const updateDto: UpdateProductDto = { displayName: 'Only Name Updated' };
      const expectedProduct = { uuid: mockUuid, sku: 'SKU-001', displayName: 'Only Name Updated' };
      mockProductService.update.mockResolvedValue(expectedProduct as any);

      const result = await controller.update(mockUuid, updateDto);

      expect(mockProductService.update).toHaveBeenCalledWith(mockUuid, updateDto);
      expect(result).toEqual(expectedProduct);
    });

    it('should propagate NotFoundException from service', async () => {
      mockProductService.update.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.update(mockUuid, { sku: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should call productService.remove with the uuid', async () => {
      mockProductService.remove.mockResolvedValue(undefined);

      await controller.remove(mockUuid);

      expect(mockProductService.remove).toHaveBeenCalledWith(mockUuid);
    });

    it('should propagate NotFoundException from service', async () => {
      mockProductService.remove.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.remove(mockUuid)).rejects.toThrow(NotFoundException);
    });
  });
});
