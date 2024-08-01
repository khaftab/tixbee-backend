import mongoose from "mongoose";
import app from "./app";

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }
  try {
    await mongoose.connect("mongodb://auth-mongo-srv:27017/auth");
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Auth service running on port 3000");
    });
  } catch (err) {
    console.error(err);
  }
};

start();

// We are setting jwt secret key in k8s secret objects. We don't list them in config file rather directly paste them in the cluster. So, that we don't expose the key in config files.
// kubectl create secret generic jwt-secret --from-literal JWT_KEY=dd37cf85ecf33cc4
// kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml
