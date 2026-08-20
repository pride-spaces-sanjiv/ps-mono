export const CSVHeaders = {
  OPERATORREGISTEREDNAME: "operatorregisteredname",
  GST: "gst",
  OPERATORBRANDNAME: "operatorbrandname",
  OPERATORSLUG: "operatorslug",
  OPERATORHQADDRESS: "operatorhqaddress",
  STATE: "state",
  CITY: "city",
  ZIPPINCODE: "zippincode",
  HQEMAILFORLOGINID: "hqemailforloginid",
  HQPOCEMAIL: "hqpocemail",
  HQPOCMOBILENO: "hqpocmobileno",
  HQLANDLINECUSTOMERCARENO: "hqlandlinecustomercareno",
  HQPOCNAME: "hqpocname",
  HQPOCDESIGNATION: "hqpocdesignation",
  CIN: "cin",
} as const;
export type CSVHeadersValues = (typeof CSVHeaders)[keyof typeof CSVHeaders];
export type RowData = Record<CSVHeadersValues, string | null | undefined>;
