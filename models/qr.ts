export type QrPayload = {
  activityId: string;
  generatedAt: number;
  validUntil: number;
  generatedById: string;
  type: "PARTICIPANT" | "MANAGER";
};
