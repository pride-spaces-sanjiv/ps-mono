// import { CFEnvironment, Cashfree } from "cashfree-pg";
import { PaymentMQ, paymentsMQ } from "./rabbitmq.js";
import { User } from "../../../database/models/user.js";
import { isObjectIdOrHexString } from "mongoose";
import { sleep } from "../../time.js";

export const cashfree = new Cashfree(
  CFEnvironment["SANDBOX"],
  process.env.CASHFREE_ID,
  process.env.CASHFREE_SECRET,
);

const handler = async (data: PaymentMQ) => {
  try {
    if (!isObjectIdOrHexString(data.user)) {
      throw new Error("Invalid User");
    }
    try {
      const orderRes = await cashfree.PGFetchOrder(data.orderId);
      if (orderRes.data.order_status === "PAID") {
        const amount = orderRes.data.order_amount ?? 0;
        const updater = await User.updateOne(
          { _id: data.user },
          { credits: { $incr: amount } },
          { new: true },
        );
        if (updater.modifiedCount < 1) {
          throw new Error("Update failed");
        }
        return true;
      }
      if (orderRes.data.order_status === "TERMINATED") {
        return true;
      }
      return false;
    } catch (err) {
      throw new Error("Response error");
    }
  } catch (err) {
    return false;
  }
};

export const handlePaymentsQueue = async () => {
  await paymentsMQ.channel?.prefetch?.(5);
  paymentsMQ.consumeQueue(async (msg) => {
    if (msg) {
      const str = msg.content.toString();
      const data: PaymentMQ = JSON.parse(str);
      const handled = await handler(data);
      paymentsMQ.acknowledgement(
        handled ? "yes" : "no",
        msg,
        false,
        handled ? false : true,
      );
      await sleep(2);
    }
  });
};
