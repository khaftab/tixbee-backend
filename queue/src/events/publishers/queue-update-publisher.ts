import { Publisher, Subjects } from "@kh-micro-srv/common";

interface ExpirationCompleteEvent {
  subject: "ticket:queue-update";
  data: {
    ticketId: string;
    queueLength: number;
  };
}

export class QueueUpdatePublisher extends Publisher<ExpirationCompleteEvent> {
  // @ts-ignore
  subject = "ticket:queue-update";
}
