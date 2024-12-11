import { logger } from "@kh-micro-srv/common";
import { connect, NatsConnection } from "nats";
class NatsWrapper {
  private nc?: NatsConnection;

  get client() {
    if (!this.nc) {
      throw new Error("Cannot access NATS client before connecting");
    }
    return this.nc;
  }
  async connect(url: string) {
    if (this.nc) return;
    this.nc = await connect({
      servers: url,
    });
    logger.info("Connected to NATS");
  }

  async shutdown() {
    logger.info("Shutting down gracefully...");
    try {
      await this.client.drain(); // Ensure all messages are processed
      logger.info("All messages processed.");
    } catch (err) {
      logger.error("Error during draining:", err);
    } finally {
      await this.client.close(); // Close the NATS connection
      logger.info("NATS connection closed.");
      process.exit(0); // Exit the process
    }
  }
}

export const natsWrapper = new NatsWrapper();
