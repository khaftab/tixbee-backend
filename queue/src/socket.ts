import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getCookieValue } from "./utils/utils";
import { queueService } from "./queue-management";
import { logger } from "@kh-micro-srv/common";

interface UserPayload {
  id: string;
  email: string;
  iat: number;
}

declare module "socket.io" {
  interface Socket {
    currentUser: UserPayload;
    ticketId: string;
  }
}

export const connectedSockets = new Map();

const io = new Server({
  path: "/api/queue", // Match the path in your ingress
  cors: {
    origin: process.env.ORIGIN_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  const position = await queueService.getQueueStatus(socket.ticketId, socket.currentUser.id);

  const queueTurn = await queueService.getQueueTurnEvent(socket.ticketId, socket.currentUser.id);
  if (queueTurn) {
    // If a user tries to go to the queue page after the order is created, then we need to send the queue-turn event to the user which will rediret the user to the order payment page.
    socket.emit("queue-turn", queueTurn);
  } else {
    socket.emit("queue-update", position);
  }
  connectedSockets.set(socket.id, {
    socket,
    userId: socket.currentUser.id,
    ticketId: socket.ticketId,
  });

  socket.on("disconnect", () => {
    connectedSockets.delete(socket.id);
  });
  socket.on("opt-out", async (ticketId) => {
    await queueService.removeFromQueue(ticketId, "ticket");
    emitEventToAll("queue-update", ticketId);
    socket.emit("opt-out-success", "You have been removed from the queue");
  });
});

logger.info(`WebSocket server listening on port 3000 `);

export const emitEvent = async (event: string, data: any, userId: string, ticketId: string) => {
  for (const {
    socket,
    userId: socketUserId,
    ticketId: socketTicketId,
  } of connectedSockets.values()) {
    if (socketUserId === userId && socketTicketId === ticketId) {
      socket.emit(event, data);
      await queueService.addToQueue(ticketId, userId, "queueTurn");
    }
  }
};

export const emitEventOnConnection = (
  event: string,
  data: any,
  userId: string,
  ticketId: string
) => {
  io.on("connection", (socket) => {
    socket.currentUser.id === userId && socket.ticketId === ticketId && socket.emit(event, data);
  });
};

export const hasConnectedClient = (userId: string, ticketId: string) => {
  return Array.from(connectedSockets.values()).some(
    (client) => client.userId === userId && client.ticketId === ticketId
  );
};

export const emitEventToAll = async (event: string, ticketId: string) => {
  for (const { socket, ticketId: socketTicketId } of connectedSockets.values()) {
    if (socketTicketId === ticketId) {
      const status = await queueService.getQueueStatus(ticketId, socket.currentUser.id);
      if (event === "queue-update" && status.position === 0) {
        // Whenever user opts out of the queue, status.position will be 0. So, we don't need to send the event to the user who opted out. (After opting out, user will not be on queue page in frontend)
      } else {
        socket.emit(event, status);
      }
    }
  }
};

io.use((socket, next) => {
  let cookie = socket.handshake.headers.cookie;
  socket.ticketId = socket.handshake.headers["ticket-id"] as string;
  if (!cookie) {
    socket.emit("error", "Please login to view this page");
    socket.disconnect();

    return;
  }
  cookie = getCookieValue(cookie, "session");

  var utf8encoded = Buffer.from(cookie, "base64").toString("utf8");

  try {
    const payload = jwt.verify(JSON.parse(utf8encoded).jwt, process.env.JWT_KEY!) as UserPayload;
    logger.info("User connected to socket", { email: payload.email, ticketId: socket.ticketId });
    socket.currentUser = payload;
  } catch (error) {
    socket.emit("error", "Please login to view this page");
    socket.disconnect();
    return;
  }
  next();
});
