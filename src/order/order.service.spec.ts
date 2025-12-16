import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { EntityManager, LockMode } from '@mikro-orm/postgresql';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { StockTransaction, StockTransactionType } from '../entities/stock-transaction.entity';

describe('OrderService', () => {
  let service: OrderService;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;
  let mockQueryBuilder: {
    select: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };

  const mockProductUuid1 = '550e8400-e29b-41d4-a716-446655440001';
  const mockProductUuid2 = '550e8400-e29b-41d4-a716-446655440002';
  const mockOrderUuid = '550e8400-e29b-41d4-a716-446655440099';

  const mockProduct1 = {
    uuid: mockProductUuid1,
    sku: 'SKU-001',
    displayName: 'Test Product 1',
    price: '29.99',
  } as Product;

  const mockProduct2 = {
    uuid: mockProductUuid2,
    sku: 'SKU-002',
    displayName: 'Test Product 2',
    price: '49.99',
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
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      transactional: jest.fn().mockImplementation((fn) => fn(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [
        { productUuid: mockProductUuid1, quantity: 2 },
        { productUuid: mockProductUuid2, quantity: 1 },
      ],
    };

    it('should create an order with items and deduct stock', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1, mockProduct2]);
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ total: '10' }) // Stock for product 1
        .mockResolvedValueOnce({ total: '5' });  // Stock for product 2
      (mockEntityManager.findOneOrFail as jest.Mock).mockResolvedValue({
        uuid: mockOrderUuid,
        customerEmail: 'john@example.com',
        items: [],
      });

      const result = await service.create(createOrderDto);

      expect(mockEntityManager.transactional).toHaveBeenCalled();
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        Product,
        { uuid: { $in: [mockProductUuid1, mockProductUuid2] } },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      // Should persist order, 2 order items, and 2 stock transactions
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(5);
      expect(result.uuid).toBe(mockOrderUuid);
    });

    it('should snapshot product price in order item', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1]);
      mockQueryBuilder.execute.mockResolvedValue({ total: '10' });

      let persistedOrderItem: OrderItem | undefined;
      (mockEntityManager.persist as jest.Mock).mockImplementation((entity) => {
        if (entity instanceof OrderItem) {
          persistedOrderItem = entity;
        }
        return mockEntityManager;
      });
      (mockEntityManager.findOneOrFail as jest.Mock).mockResolvedValue({ uuid: mockOrderUuid });

      await service.create({
        customerEmail: 'test@example.com',
        items: [{ productUuid: mockProductUuid1, quantity: 1 }],
      });

      expect(persistedOrderItem?.unitPrice).toBe('29.99');
    });

    it('should create negative stock transactions for each item', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1]);
      mockQueryBuilder.execute.mockResolvedValue({ total: '10' });

      let persistedStockTransaction: StockTransaction | undefined;
      (mockEntityManager.persist as jest.Mock).mockImplementation((entity) => {
        if (entity instanceof StockTransaction) {
          persistedStockTransaction = entity;
        }
        return mockEntityManager;
      });
      (mockEntityManager.findOneOrFail as jest.Mock).mockResolvedValue({ uuid: mockOrderUuid });

      await service.create({
        customerEmail: 'test@example.com',
        items: [{ productUuid: mockProductUuid1, quantity: 3 }],
      });

      expect(persistedStockTransaction?.quantity).toBe(-3);
      expect(persistedStockTransaction?.type).toBe(StockTransactionType.OUTGOING_ORDER);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1]); // Only returns product 1

      await expect(service.create(createOrderDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createOrderDto)).rejects.toThrow(
        `Products not found: ${mockProductUuid2}`,
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1, mockProduct2]);
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ total: '1' })  // Only 1 in stock, need 2
        .mockResolvedValueOnce({ total: '5' }); // Sufficient

      try {
        await service.create(createOrderDto);
        fail('Expected BadRequestException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.error).toBe('INSUFFICIENT_STOCK');
        expect(e.response.items).toHaveLength(1);
        expect(e.response.items[0]).toEqual({
          productUuid: mockProductUuid1,
          available: 1,
          requested: 2,
        });
      }
    });

    it('should collect all insufficient stock errors', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([mockProduct1, mockProduct2]);
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ total: '1' })  // Only 1 in stock, need 2
        .mockResolvedValueOnce({ total: '0' }); // 0 in stock, need 1

      try {
        await service.create(createOrderDto);
      } catch (e) {
        expect(e.response.items).toHaveLength(2);
      }
    });
  });

  describe('findAll', () => {
    it('should return all orders with items populated', async () => {
      const mockOrders = [
        { uuid: '1', customerEmail: 'a@test.com', items: [] },
        { uuid: '2', customerEmail: 'b@test.com', items: [] },
      ];
      (mockEntityManager.find as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        Order,
        {},
        {
          orderBy: { createdAt: 'DESC' },
          populate: ['items', 'items.product'],
        },
      );
    });

    it('should return empty array when no orders exist', async () => {
      (mockEntityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return order with items populated', async () => {
      const mockOrder = {
        uuid: mockOrderUuid,
        customerEmail: 'test@example.com',
        items: [{ uuid: '1', quantity: 2 }],
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.findOne(mockOrderUuid);

      expect(result).toEqual(mockOrder);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Order,
        mockOrderUuid,
        { populate: ['items', 'items.product'] },
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockOrderUuid)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockOrderUuid)).rejects.toThrow('Order not found');
    });
  });

  describe('lookup', () => {
    const customerEmail = 'customer@example.com';

    it('should return order when uuid and email match', async () => {
      const mockOrder = {
        uuid: mockOrderUuid,
        customerEmail,
        items: [{ uuid: '1', quantity: 2 }],
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.lookup(mockOrderUuid, customerEmail);

      expect(result).toEqual(mockOrder);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Order,
        { uuid: mockOrderUuid, customerEmail },
        { populate: ['items', 'items.product'] },
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.lookup(mockOrderUuid, customerEmail)).rejects.toThrow(NotFoundException);
      await expect(service.lookup(mockOrderUuid, customerEmail)).rejects.toThrow('Order not found');
    });

    it('should throw NotFoundException when email does not match', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.lookup(mockOrderUuid, 'wrong@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        uuid: mockOrderUuid,
        status: OrderStatus.PENDING,
        customerEmail: 'test@example.com',
      };
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOrder) // First call for update
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.CONFIRMED }); // Second call for return

      const result = await service.updateStatus(mockOrderUuid, {
        status: OrderStatus.CONFIRMED,
      });

      expect(mockOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus(mockOrderUuid, { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateStatus(mockOrderUuid, { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow('Order not found');
    });

    it('should restore stock when order is cancelled', async () => {
      const mockOrder = {
        uuid: mockOrderUuid,
        status: OrderStatus.PENDING,
      };
      const mockOrderItems = [
        { uuid: '1', quantity: 2, product: mockProduct1 },
        { uuid: '2', quantity: 1, product: mockProduct2 },
      ];

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.CANCELLED });
      (mockEntityManager.find as jest.Mock).mockResolvedValue(mockOrderItems);

      const persistedTransactions: StockTransaction[] = [];
      (mockEntityManager.persist as jest.Mock).mockImplementation((entity) => {
        if (entity instanceof StockTransaction) {
          persistedTransactions.push(entity);
        }
        return mockEntityManager;
      });

      await service.updateStatus(mockOrderUuid, { status: OrderStatus.CANCELLED });

      expect(mockEntityManager.find).toHaveBeenCalledWith(
        OrderItem,
        { order: mockOrderUuid },
        { populate: ['product'] },
      );
      expect(persistedTransactions).toHaveLength(2);
      expect(persistedTransactions[0].quantity).toBe(2); // Positive to restore
      expect(persistedTransactions[1].quantity).toBe(1);
      expect(persistedTransactions[0].type).toBe(StockTransactionType.ADJUSTMENT);
      expect(persistedTransactions[0].notes).toBe('Stock restored due to order cancellation');
    });

    it('should not restore stock if order is already cancelled', async () => {
      const mockOrder = {
        uuid: mockOrderUuid,
        status: OrderStatus.CANCELLED, // Already cancelled
      };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);

      await service.updateStatus(mockOrderUuid, { status: OrderStatus.CANCELLED });

      // find should not be called because we don't restore stock for already cancelled orders
      expect(mockEntityManager.find).not.toHaveBeenCalledWith(
        OrderItem,
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
