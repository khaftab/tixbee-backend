import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listeners";
import { ExpirationCompleteListener } from "./events/listeners/expiration-complete-listener";
import { PaymentCreatedListener } from "./events/listeners/payment-created-listener";

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined for tickets");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined for tickets");
  }
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be defined for tickets");
  }

  try {
    await natsWrapper.connect(process.env.NATS_URL);
    natsWrapper.client.closed().then(() => {
      console.log("NATS connection closed.");
      process.exit(0); // will exit the node server when nats connection is closed.
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);
    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Orders service running on port 3000");
    });
  } catch (err) {
    console.error(err);
  }
};

start();

// We are setting jwt secret key in k8s secret objects. We don't list them in config file rather directly paste them in the cluster. So, that we don't expose the key in config files.
// kubectl create secret generic jwt-secret --from-literal JWT_KEY=dd37cf85ecf33cc4
// kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml