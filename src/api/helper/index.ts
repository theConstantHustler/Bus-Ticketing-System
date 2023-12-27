export const HttpMethods = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
} as const;

export enum TicketStatus {
  OPEN = "open",
  CLOSED = "closed",
}
