import { natsWrapper } from "../nats-wrapper";

export const handleShutdown = async () => {
  try {
    await natsWrapper.shutdown(); // Wait for shutdown to complete
    console.log("NATS shutdown completed.");
  } catch (error) {
    console.error("Error during NATS shutdown:", error);
  } finally {
    process.exit(0); // Exit the process after shutdown
  }
};
