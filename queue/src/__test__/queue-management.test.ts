import { queueService } from "../queue-management";
import { NatsConnection, JetStreamClient, JetStreamManager } from "nats";

describe("QueueManagementService", () => {
  let mockNatsConnection: Partial<NatsConnection>;
  let mockJetStreamClient: Partial<JetStreamClient>;
  let mockJetStreamManager: Partial<JetStreamManager>;
  let mockKV: any;

  beforeEach(async () => {
    // Create mock implementations
    mockKV = {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      destroy: jest.fn(),
    };

    mockJetStreamClient = {
      views: {
        kv: jest.fn().mockResolvedValue(mockKV),
        os: jest.fn(),
      },
    };

    mockJetStreamManager = {
      streams: {
        info: jest.fn(),
        add: jest.fn(),
        update: jest.fn(),
        purge: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        deleteMessage: jest.fn(),
        getMessage: jest.fn(),
        find: jest.fn(),
        listKvs: jest.fn(),
        listObjectStores: jest.fn(),
        names: jest.fn(),
        get: jest.fn(),
      },
    };

    mockNatsConnection = {
      jetstreamManager: jest.fn().mockResolvedValue(mockJetStreamManager),
      jetstream: jest.fn().mockReturnValue(mockJetStreamClient),
    };

    // Reset the service and connect with mock connection
    await queueService.connect(mockNatsConnection as NatsConnection);
  });

  describe("addToQueue", () => {
    it("should add a user to the queue", async () => {
      // Mock existing queue
      mockKV.get.mockResolvedValue({
        string: () => JSON.stringify([]),
      });

      const userId = "user1";
      const ticketId = "ticket1";

      // Mock getOrderExpirationDate
      queueService.getOrderExpirationDate = jest.fn().mockResolvedValue("2024-12-31");

      const result = await queueService.addToQueue(ticketId, userId, "ticket");

      expect(mockKV.put).toHaveBeenCalled();
      expect(result).toHaveProperty("position");
      expect(result).toHaveProperty("estimatedWaitTime");
      expect(result).toHaveProperty("totalInQueue");
    });
  });

  describe("removeFromQueue", () => {
    it("should remove the first user from the queue", async () => {
      // Mock existing queue
      mockKV.get.mockResolvedValue({
        string: () =>
          JSON.stringify([
            { userId: "user1", timestamp: Date.now(), ticketId: "ticket1" },
            { userId: "user2", timestamp: Date.now(), ticketId: "ticket1" },
          ]),
      });

      await queueService.removeFromQueue("ticket1", "ticket");

      expect(mockKV.put).toHaveBeenCalled();
      // Verify the first user was removed
      const putCall = mockKV.put.mock.calls[0];
      const updatedQueue = JSON.parse(putCall[1]);
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].userId).toBe("user2");
    });
  });

  describe("getQueueStatus", () => {
    it("should return correct queue status", async () => {
      // Mock queue and expiration date
      mockKV.get.mockResolvedValue({
        string: () =>
          JSON.stringify([
            { userId: "user1", timestamp: Date.now(), ticketId: "ticket1" },
            { userId: "user2", timestamp: Date.now(), ticketId: "ticket1" },
          ]),
      });
      queueService.getOrderExpirationDate = jest.fn().mockResolvedValue("2024-12-31");

      const status = await queueService.getQueueStatus("ticket1", "user2");

      expect(status).toEqual({
        position: 2,
        estimatedWaitTime: expect.any(Number),
        totalInQueue: 2,
      });
    });
  });

  describe("clearAllQueues", () => {
    it("should destroy the KV store and reinitialize", async () => {
      await queueService.clearAllQueues();

      expect(mockKV.destroy).toHaveBeenCalled();
    });
  });
});
