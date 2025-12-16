import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { NotFoundException } from '@nestjs/common';
import {
  StockTransaction,
  StockTransactionType,
} from '../entities/stock-transaction.entity';
import { Product } from '../entities/product.entity';

describe('StockService', () => {
  let service: StockService;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;
  let mockQueryBuilder: {
    select: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };

  const mockProductUuid = '550e8400-e29b-41d4-a716-446655440000';
  const mockProduct = {
    uuid: mockProductUuid,
    sku: 'SKU-001',
    displayName: 'Test Product',
  } as Product;

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockEntityManager = {
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addIncoming', () => {
    it('should create an INCOMING stock transaction', async () => {
      const addStockDto = {
        productUuid: mockProductUuid,
        quantity: 10,
        notes: 'Initial stock',
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.addIncoming(addStockDto);

      expect(result).toBeInstanceOf(StockTransaction);
      expect(result.product).toBe(mockProduct);
      expect(result.quantity).toBe(10);
      expect(result.type).toBe(StockTransactionType.INCOMING);
      expect(result.notes).toBe('Initial stock');
      expect(mockEntityManager.persist).toHaveBeenCalledWith(
        expect.any(StockTransaction),
      );
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const addStockDto = {
        productUuid: mockProductUuid,
        quantity: 10,
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.addIncoming(addStockDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addIncoming(addStockDto)).rejects.toThrow(
        'Product not found',
      );
      expect(mockEntityManager.persist).not.toHaveBeenCalled();
    });
  });

  describe('adjust', () => {
    it('should create an ADJUSTMENT stock transaction with positive quantity', async () => {
      const adjustStockDto = {
        productUuid: mockProductUuid,
        quantity: 5,
        notes: 'Found extra stock',
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.adjust(adjustStockDto);

      expect(result).toBeInstanceOf(StockTransaction);
      expect(result.product).toBe(mockProduct);
      expect(result.quantity).toBe(5);
      expect(result.type).toBe(StockTransactionType.ADJUSTMENT);
      expect(result.notes).toBe('Found extra stock');
    });

    it('should create an ADJUSTMENT stock transaction with negative quantity', async () => {
      const adjustStockDto = {
        productUuid: mockProductUuid,
        quantity: -3,
        notes: 'Damaged items removed',
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.adjust(adjustStockDto);

      expect(result.quantity).toBe(-3);
      expect(result.type).toBe(StockTransactionType.ADJUSTMENT);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const adjustStockDto = {
        productUuid: mockProductUuid,
        quantity: 5,
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.adjust(adjustStockDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.adjust(adjustStockDto)).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('getStockLevel', () => {
    it('should return the sum of all stock transactions', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);
      mockQueryBuilder.execute.mockResolvedValue({ stock: '25' });

      const result = await service.getStockLevel(mockProductUuid);

      expect(result).toEqual({
        productUuid: mockProductUuid,
        stock: 25,
      });
      expect(mockEntityManager.createQueryBuilder).toHaveBeenCalledWith(
        StockTransaction,
        'st',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        product: mockProductUuid,
      });
    });

    it('should return 0 when no transactions exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);
      mockQueryBuilder.execute.mockResolvedValue({ stock: null });

      const result = await service.getStockLevel(mockProductUuid);

      expect(result).toEqual({
        productUuid: mockProductUuid,
        stock: 0,
      });
    });

    it('should return 0 when result is undefined', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      const result = await service.getStockLevel(mockProductUuid);

      expect(result).toEqual({
        productUuid: mockProductUuid,
        stock: 0,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getStockLevel(mockProductUuid)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStockLevel(mockProductUuid)).rejects.toThrow(
        'Product not found',
      );
      expect(mockEntityManager.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should return transactions ordered by createdAt DESC', async () => {
      const mockTransactions = [
        { uuid: '1', quantity: 10, type: StockTransactionType.INCOMING },
        { uuid: '2', quantity: -5, type: StockTransactionType.ADJUSTMENT },
      ];
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (mockEntityManager.find as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await service.getTransactions(mockProductUuid);

      expect(result).toEqual(mockTransactions);
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        StockTransaction,
        { product: mockProductUuid },
        { orderBy: { createdAt: 'DESC' } },
      );
    });

    it('should return empty array when no transactions exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (mockEntityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getTransactions(mockProductUuid);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getTransactions(mockProductUuid)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTransactions(mockProductUuid)).rejects.toThrow(
        'Product not found',
      );
      expect(mockEntityManager.find).not.toHaveBeenCalled();
    });
  });
});
