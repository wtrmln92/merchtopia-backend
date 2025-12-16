import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

describe('ShopController', () => {
  let controller: ShopController;
  let mockShopService: jest.Mocked<ShopService>;

  beforeEach(async () => {
    mockShopService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<ShopService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopController],
      providers: [
        {
          provide: ShopService,
          useValue: mockShopService,
        },
      ],
    }).compile();

    controller = module.get<ShopController>(ShopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products on sale', async () => {
      const products = [
        { uuid: '1', sku: 'SKU-001', displayName: 'Product 1', isOnSale: true },
        { uuid: '2', sku: 'SKU-002', displayName: 'Product 2', isOnSale: true },
      ];
      mockShopService.findAll.mockResolvedValue(products as any);

      const result = await controller.findAll();

      expect(mockShopService.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });

    it('should return empty array when no products are on sale', async () => {
      mockShopService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should return a product when found', async () => {
      const expectedProduct = {
        uuid: mockUuid,
        sku: 'SKU-001',
        displayName: 'Test Product',
        isOnSale: true,
      };
      mockShopService.findOne.mockResolvedValue(expectedProduct as any);

      const result = await controller.findOne(mockUuid);

      expect(mockShopService.findOne).toHaveBeenCalledWith(mockUuid);
      expect(result).toEqual(expectedProduct);
    });

    it('should propagate NotFoundException from service', async () => {
      mockShopService.findOne.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.findOne(mockUuid)).rejects.toThrow(NotFoundException);
    });
  });
});
