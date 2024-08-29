import orders from "./orders";
import { Express } from "express";

const routes = [
  {
    path: "/api",
    handler: orders,
  },
];

const setRoutes = (app: Express) => {
  routes.forEach((route) => {
    if (route.path === "/") {
      app.get(route.path, route.handler);
    } else {
      app.use(route.path, route.handler);
    }
  });
};

export default setRoutes;
