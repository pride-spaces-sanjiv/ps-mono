export type THmac<K extends string, D = Date> = {
  [P in K]: {
    value: string;
    expiry: D;
    lastUpdated: D;
    sourceName?: string;
    userAgent?: string;
  };
};
