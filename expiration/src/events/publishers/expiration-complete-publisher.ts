import { Publisher, ExpirationCompleteEvent, Subjects } from "@kh-micro-srv/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
