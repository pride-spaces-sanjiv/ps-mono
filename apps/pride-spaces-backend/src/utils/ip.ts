import { ManagedRequest } from "@/types/request.js";

export const getIP = (req: ManagedRequest) => {
  const forwadedFor = req.headers["x-forwarded-for"];
  const IP = (
    (Array.isArray(forwadedFor)
      ? forwadedFor[0]
      : forwadedFor?.split(",")[0]) ||
    // req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  )?.trim();
  return IP;
};
