import { BadRequestError } from "@kh-micro-srv/common";
import {
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  KV,
  RetentionPolicy,
  StorageType,
} from "nats";
import { QueueUpdatePublisher } from "./events/publishers/queue-update-publisher";

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
  // private js: JetStreamClient;
  private nc!: NatsConnection;
  private kv!: KV;

  // constructor(nc: NatsConnection) {
  //   this.nc = nc;
  //   // this.js = nc.jetstream();
  //   // this.jsm = await this.nc.jetstreamManager();
  // }

  async connect(nc: NatsConnection) {
    this.nc = nc;
    await this.initialize();
  }

  async initialize() {
    const jsm: JetStreamManager = await this.nc.jetstreamManager();
    const js: JetStreamClient = this.nc.jetstream();
    // Ensure the KV bucket exists
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

  async addToQueue(ticketId: string, userId: string): Promise<QueueStatus> {
    const key = `ticket-${ticketId}`;
    const queue = await this.getQueue(key);
    console.log(queue);

    // Check if user is already in queue
    if (queue.some((entry) => entry.userId === userId)) {
      throw new BadRequestError("User already in queue");
    }

    // Add user to queue
    queue.push({ userId, timestamp: Date.now(), ticketId });
    await this.kv.put(key, JSON.stringify(queue));

    // Get queue status
    const status = await this.getQueueStatus(ticketId, userId);

    // Publish queue update event
    // await this.nc.publish(
    //   "ticket:queue-update",
    //   JSON.stringify({ ticketId, queueLength: queue.length })
    // );
    await new QueueUpdatePublisher(this.nc).publish({
      ticketId,
      queueLength: queue.length,
    });

    return status;
  }

  async removeFromQueue(ticketId: string, userId: string): Promise<void> {
    const key = `ticket-${ticketId}`;
    let queue = await this.getQueue(key);

    // Remove user from queue
    queue = queue.filter((entry) => entry.userId !== userId);
    await this.kv.put(key, JSON.stringify(queue));

    // Publish queue update event
    await this.nc.publish(
      "ticket:queue-leave",
      JSON.stringify({ ticketId, userId, queueLength: queue.length })
    );

    // If there are users still in queue, notify the next person
    if (queue.length > 0) {
      // await this.notifyNextInQueue(ticketId);
    }
  }

  async getQueueStatus(ticketId: string, userId: string): Promise<QueueStatus> {
    const queue = await this.getQueue(`ticket-${ticketId}`);
    const position = queue.findIndex((entry) => entry.userId === userId) + 1;
    const estimatedWaitTime = position * 3 * 60 * 1000; // 3 minutes per person

    return {
      position,
      estimatedWaitTime,
      totalInQueue: queue.length,
    };
  }

  // async processNextInQueue(ticketId: string): Promise<string | null> {
  //   const key = `ticket:${ticketId}`;
  //   const queue = await this.getQueue(key);
  //   if (queue.length > 0) {
  //     const nextUser = queue.shift();
  //     await this.kv.put(key, JSON.stringify(queue));
  //     await this.nc.publish(
  //       "ticket:queue-turn",
  //       JSON.stringify({ ticketId, userId: nextUser?.userId })
  //     );
  //     return nextUser?.userId ?? null;
  //   }
  //   return null;
  // }

  private async getQueue(key: string): Promise<QueueEntry[]> {
    try {
      const entry = await this.kv.get(key);
      return entry ? JSON.parse(entry.string()) : [];
    } catch {
      return [];
    }
  }

  async deleteQueue(ticketId: string): Promise<void> {
    // Clear the queue for this ticket
    console.log({ ticketId: `ticket-${ticketId}` });

    await this.kv.delete(`ticket-${ticketId}`);

    // Notify all users in queue that ticket is no longer available
    // await this.nc.publish('ticket:unavailable',
    //   JSON.stringify({ ticketId, message: 'Ticket has been purchased' })
    // );
    // await
  }

  async notifyNextInQueue(ticketId: string): Promise<void> {
    const queue = await this.getQueue(`ticket:${ticketId}`);
    if (queue.length > 0) {
      const nextUser = queue[0];
      await this.nc.publish(
        "ticket:queue-turn",
        JSON.stringify({
          ticketId,
          userId: nextUser.userId,
        })
      );
    }
  }
}
// export default QueueManagementService;
export const queueService = new QueueManagementService();
