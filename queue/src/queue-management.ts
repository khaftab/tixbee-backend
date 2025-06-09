import {
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  KV,
  RetentionPolicy,
  StorageType,
} from "nats";

interface QueueEntry {
  userId: string;
  timestamp: number;
  ticketId: string;
}

interface QueueStatus {
  position: number;
  estimatedWaitTime: number;
  totalInQueue: number;
}

class QueueManagementService {
  private nc!: NatsConnection;
  private kv!: KV;

  async connect(nc: NatsConnection) {
    this.nc = nc;
    await this.initialize();
  }

  async initialize() {
    const jsm: JetStreamManager = await this.nc.jetstreamManager();
    const js: JetStreamClient = this.nc.jetstream();

    const bucketName = "ticketQueues";
    try {
      await jsm.streams.info(bucketName);
    } catch {
      await jsm.streams.add({
        name: bucketName,
        subjects: [`kv.${bucketName}.*`],
        retention: RetentionPolicy.Workqueue,
        storage: StorageType.File,
      });
    }
    this.kv = await js.views.kv(bucketName);
  }

  async addToQueue(
    ticketId: string,
    userId: string,
    queueType: "ticket" | "queueTurn"
  ): Promise<QueueStatus | void> {
    const key = `${queueType}-${ticketId}`;
    const queue = await this.getQueue(key);

    if (queue.some((entry) => entry.userId === userId)) {
      // When user opens the queue page multiple times in a tab, and then redirects to the the payment page it tries to save the details in KV multiple times (One is sufficient). (So, that even after going back to queue page, it will redirect to payment page)
      return;
    }
    queue.push({ userId, timestamp: Date.now(), ticketId });
    await this.kv.put(key, JSON.stringify(queue));
    if (queueType === "ticket") {
      return this.getQueueStatus(ticketId, userId);
    }
  }

  async removeFromQueue(
    ticketId: string,
    queueType: "ticket" | "queueTurn",
    userId?: string
  ): Promise<void> {
    const key = `${queueType}-${ticketId}`;
    let queue = await this.getQueue(key);
    if (!queue.length) {
      return;
    }
    const userIdToRemove = userId ?? queue[0].userId;
    queue = queue.filter((entry) => entry.userId !== userIdToRemove);
    await this.kv.put(key, JSON.stringify(queue));
  }

  async getQueueStatus(ticketId: string, userId: string): Promise<QueueStatus> {
    const queue = await this.getQueue(`ticket-${ticketId}`);
    const position = queue.findIndex((entry) => entry.userId === userId) + 1;
    const expirationDate = await this.getOrderExpirationDate(ticketId);
    const esTime = this.getTimeLeft(position, expirationDate);

    return {
      position,
      estimatedWaitTime: esTime,
      totalInQueue: queue.length,
    };
  }

  async getQueueTurnEvent(ticketId: string, userId: string): Promise<QueueEntry | null> {
    const key = `queueTurn-${ticketId}`;
    const queue = await this.getQueue(key);
    return queue.find((entry) => entry.userId === userId) ?? null;
  }

  async addOrderExipirationDate(ticketId: string, expiration?: string): Promise<void> {
    const key = `orderExpiration-${ticketId}`;
    if (expiration) {
      await this.kv.put(key, JSON.stringify({ expiration }));
    } else {
      await this.kv.delete(key);
    }
  }

  async getOrderExpirationDate(ticketId: string): Promise<string | null> {
    const key = `orderExpiration-${ticketId}`;
    try {
      const entry = await this.kv.get(key);
      return entry ? JSON.parse(entry.string()).expiration : null;
    } catch {
      return null;
    }
  }

  async removeOrderExpirationDate(ticketId: string): Promise<void> {
    const key = `orderExpiration-${ticketId}`;
    await this.kv.delete(key);
  }

  async clearAllQueues(): Promise<void> {
    await this.kv.destroy();
    await this.initialize();
  }

  getTimeLeft(position: number, expirationDate: string | null): number {
    if (!expirationDate || position === 0) return 0;

    const interval = 180 * (position - 1);
    const delay = (new Date(expirationDate).getTime() - new Date().getTime()) / 1000;
    const timeLeft = Math.floor(delay + interval);

    return timeLeft > 0 ? timeLeft : 0;
  }

  private async getQueue(key: string): Promise<QueueEntry[]> {
    try {
      const entry = await this.kv.get(key);
      return entry ? JSON.parse(entry.string()) : [];
    } catch {
      return [];
    }
  }
}

export const queueService = new QueueManagementService();
