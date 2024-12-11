import { logger } from "@kh-micro-srv/common";
import { natsWrapper } from "../nats-wrapper";

export const handleShutdown = async () => {
  try {
    await natsWrapper.shutdown(); // Wait for shutdown to complete
    logger.info("NATS shutdown completed.");
  } catch (error) {
    logger.error("Error during NATS shutdown:", error);
  } finally {
    process.exit(0); // Exit the process after shutdown
  }
};

export const getCookieValue = (cookieString: string, cookieName: string) => {
  const cookies = cookieString.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }
  return ""; // If the cookie is not found
};

export const checkEnvVariables = (envVariables: string[]) => {
  for (let envVariable of envVariables) {
    if (!process.env[envVariable]) {
      throw new Error(`${envVariable} must be defined for ${process.env.SERVICE_NAME}`);
    }
  }
};
