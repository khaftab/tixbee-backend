import mongoose from "mongoose";
import app from "./app";

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined for tickets");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined for tickets");
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Tickets service running on port 3000");
    });
  } catch (err) {
    console.error(err);
  }
};

start();

// We are setting jwt secret key in k8s secret objects. We don't list them in config file rather directly paste them in the cluster. So, that we don't expose the key in config files.
// kubectl create secret generic jwt-secret --from-literal JWT_KEY=dd37cf85ecf33cc4
// kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml