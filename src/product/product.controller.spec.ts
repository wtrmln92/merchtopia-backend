import { Test, TestingModule } from '@nestjs/testing';
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
});
