import {
  areasUpdateMQ,
  AreasUpdateMQ,
} from "@/utils/services/rabbitmq/rabbitmq.js";

export const sendAreasToMQ = (
  data: (AreasUpdateMQ["pairs"][number] & { [k: string]: any })[],
) => {
  try {
    areasUpdateMQ.sendMessage({ pairs: data });
  } catch (err) {}
};
