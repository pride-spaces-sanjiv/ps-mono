export type NotificationType = "operator" | "centre";
export type NotificationAction = "add" | "delete" | "update";

export type NotificationStatic = {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  entityId: string;
  entityName: string;
  operatorName?: string;
  timestamp: string;
  details: string;
  read: boolean;
};

export const notifications: NotificationStatic[] = [
  {
    id: "1",
    type: "operator",
    action: "add",
    entityId: "8f6d4b2",
    entityName: "Awfis Space Solutions Limited",
    timestamp: "2026-05-23T09:30:00.000Z",
    details: "New operator was added.",
    read: false,
  },
  {
    id: "2",
    type: "operator",
    action: "delete",
    entityId: "d23a45c",
    entityName: "Bflex by Bagmane",
    timestamp: "2026-05-22T15:12:00.000Z",
    details: "Operator removed from the platform.",
    read: false,
  },
  {
    id: "3",
    type: "centre",
    action: "add",
    entityId: "c12f46d",
    entityName: "Andheri Adventure Hub",
    operatorName: "Awfis Space Solutions Limited",
    timestamp: "2026-05-22T11:05:00.000Z",
    details: "New centre added under Awfis Space Solutions Limited.",
    read: true,
  },
  {
    id: "4",
    type: "centre",
    action: "delete",
    entityId: "e33b17a",
    entityName: "MG Road Work Loft",
    operatorName: "Bflex by Bagmane",
    timestamp: "2026-05-21T18:22:00.000Z",
    details: "Centre removed from the Bflex by Bagmane portfolio.",
    read: true,
  },
  {
    id: "5",
    type: "operator",
    action: "update",
    entityId: "f99c30a",
    entityName: "365 Spaces",
    timestamp: "2026-05-21T09:50:00.000Z",
    details: "Operator information was updated for 365 Spaces.",
    read: false,
  },
];
