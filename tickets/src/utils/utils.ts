import { logger } from "@kh-micro-srv/common";
import { natsWrapper } from "../nats-wrapper";

export const handleShutdown = async () => {
  try {
    await natsWrapper.shutdown();
    logger.info("NATS shutdown completed.");
  } catch (error) {
    logger.error("Error during NATS shutdown:", error);
  } finally {
    process.exit(0);
  }
};
