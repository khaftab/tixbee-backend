import { Publisher, Subjects } from "@kh-micro-srv/common";

interface QueueTurnEvent {
  subject: "ticket:queue-turn";
  data: {
    ticketId: string;
    userId: string;
  };
}

export class QueueTurnPublisher extends Publisher<QueueTurnEvent> {
  // @ts-ignore
  subject = "ticket:queue-turn";
}
