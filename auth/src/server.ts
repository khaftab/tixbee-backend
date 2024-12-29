import mongoose from "mongoose";
import app from "./app";
import { checkEnvVariables, logger } from "@kh-micro-srv/common";

const start = async () => {
  checkEnvVariables(["JWT_KEY", "MONGO_URI", "TIXBEE_SOURCE_TOKEN", "SERVICE_NAME", "ORIGIN_URL"]);
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Connected to MongoDB");
    app.listen(3000, () => {
      logger.info("Auth service running on port 3000");
    });
  } catch (err) {
    logger.error(err);
  }
};

start();
