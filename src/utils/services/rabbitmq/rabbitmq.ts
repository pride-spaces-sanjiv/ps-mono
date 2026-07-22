import amqp, { Channel, connect } from "amqplib";
import { EmailToken } from "@/database/models/email.js";
import { sleep } from "@/utils/time.js";
import { NullableValue, PartialNullableObject } from "@/types/partial.js";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { DumpCollectionName } from "@/utils/data/dump.js";

const defaults = {
  sendMessage: {
    queueName: "",
    data: null as PartialNullableObject<{ [k: string]: any }>,
  },
  consumeQueue: {
    queueName: "",
    onMessage: (() => {}) as (msg: amqp.ConsumeMessage | null) => any,
  },
};

type RabbitMQConstructorParams = {
  url: string;
  queue: string;
  connection: NullableValue<amqp.ChannelModel>;
  channel: NullableValue<amqp.Channel>;
  reconnectDelay: number;
  reconnectMaxRetries: number;
};

class RabbitMQ<M extends { [k: string]: any } = {}> {
  url = `amqp://${process.env.RABBIT_USER}:${process.env.RABBIT_PASS}@${process.env.RABBIT_HOST}:${process.env.RABBIT_PORT}`;
  /** @description name of the queue */
  queue = "";
  /** @description amqp connection */
  connection: NullableValue<amqp.ChannelModel> = null;
  /** @description the amqp connection's channel */
  channel: NullableValue<amqp.Channel> = null;
  /** @description reconnection attempt gap delay in ms @default 5000 */
  reconnectDelay = 5000;
  /** @description reconnection max retries @default 10 */
  reconnectMaxRetries = 10;

  constructor(params?: PartialNullableObject<RabbitMQConstructorParams>) {
    try {
      const allParams = { ...params };
      this.url = allParams?.url?.trim() || this.url;
      if (!allParams.queue?.trim()) {
        throw new Error("Queue must be present", { cause: "queue-name" });
      }
      this.queue = allParams.queue.trim();
      this.reconnectDelay =
        Number(String(allParams?.reconnectDelay)) || this.reconnectDelay;
      this.reconnectMaxRetries =
        Number(String(allParams?.reconnectMaxRetries)) ||
        this.reconnectMaxRetries;
      this.connect();
    } catch (err: any) {
      console.log("Error instanciating rabbit-mq :", err.message);
    }
  }

  async connect() {
    try {
      this.connection = await connect(this.url);
      console.log("Connected to MQ");

      // Connection events
      this.connection.on("close", () => {
        console.log("MQ connection closed");
        this.reconnect();
      });
      this.connection.on("error", (err) => {
        console.log("MQ connection error :", err.message);
        this.reconnect();
      });

      this.channel = await this.connection.createChannel();
      console.log("Created channel MQ");

      await this.channel.assertQueue(this.queue);
      console.log("Queue asserted MQ");
      return this.channel;
    } catch (err: any) {
      console.error("Error connecting to rabbit-mq :", err.message);
      await this.reconnect();
      return null;
    }
  }

  async reconnect() {
    try {
      if (this.channel) {
        try {
          console.log("Retrying MQ channel recovery");
          await this.channel.recover();
          return;
        } catch (err: any) {
          console.error("Error MQ channel recovery", err.message);
        }
      }
      for (let i = 1; i <= this.reconnectMaxRetries; i++) {
        console.log("Retrying MQ connection", i, "time");
        const conn = await this.connect();
        if (conn) {
          return;
        }
        await sleep(Math.round(this.reconnectDelay));
      }
      throw new Error("Max retries attempted to re-connect MQ", {
        cause: "max-retries-exceeded",
      });
    } catch (err: any) {
      console.error("Error re-connecting to rabbit-mq :", err.message);
    }
  }

  validateChannel() {
    if (!this.connection) {
      throw new Error("Invalid MQ connection", { cause: "invalid-connection" });
    }
    if (!this.channel) {
      throw new Error("Invalid MQ channel", { cause: "invalid-channel" });
    }
  }

  async sendMessage<T extends { [k: string]: any } & M = M>(
    data: T | M,
    publishOptions?: Partial<amqp.Options.Publish>,
  ) {
    try {
      this.validateChannel();
      const name = this.queue;
      if (!name.trim()) {
        throw new Error("Queue name must be present");
      }
      if (!data || typeof data !== "object") {
        throw new Error("Data must be object");
      }
      const str = JSON.stringify(data);
      const buffer = Buffer.from(str);
      const sent = this.channel?.sendToQueue(
        name.trim(),
        buffer,
        publishOptions || {},
      );
      if (!sent) {
        throw new Error("Message not sent");
      }
      console.log("Message sent MQ");
      return true;
    } catch (err) {
      console.error("Error sending message by rabbit-mq :", err);
      return false;
    }
  }

  async consumeQueue(
    onMessage?: NullableValue<typeof defaults.consumeQueue.onMessage>,
    channelHandler?: (channel?: typeof this.channel) => any,
    consumeOptions?: Partial<amqp.Options.Consume>,
  ) {
    try {
      this.validateChannel();
      const name = this.queue;
      if (!name.trim()) {
        throw new Error("Queue name must be present");
      }
      await channelHandler?.(this.channel);
      await this.channel?.consume(
        name.trim(),
        (msg) => {
          // console.log(msg?.content.toString());
          // channel.ack(msg);
          try {
            msg && onMessage?.(msg);
          } catch (err) {
            msg && this.channel?.nack(msg, false, true);
          }
        },
        { ...consumeOptions },
      );
    } catch (err) {
      console.error("Error consuming rabbit-mq :", err);
    }
  }

  async acknowledgement(
    acknowledge: "yes" | "no" = "yes",
    message?: amqp.Message | amqp.ConsumeMessage | null,
    allUpTo: Parameters<amqp.Channel["nack"]>[1] = false,
    requeue: Parameters<amqp.Channel["nack"]>[2] = true,
  ) {
    try {
      this.validateChannel();
      if (!["yes", "no"].includes(acknowledge)) {
        throw new Error(
          `Invalid acknowledge method, got [${acknowledge}], required ("yes" | "no")`,
        );
      }
      if (!message) {
        throw new Error(`Invalid message passed, required non-null`);
      }
      acknowledge === "yes"
        ? await this.channel?.ack(message, !!allUpTo)
        : await this.channel?.nack(message, !!allUpTo, !!requeue);
      return true;
    } catch (err) {
      console.error("Error acknowledgement rabbit-mq message :", err);
      return false;
    }
  }
}

// MQ Message types
type EmailMQ = {
  type: ModelToRaw<typeof EmailToken>["for"];
  user: string;
  userType: ModelToRaw<typeof EmailToken>["userType"];
  token: string;
};
type PaymentMQ = {
  user: string;
  sessionId: string;
  orderId: string;
  amount: number;
};
type WaitingMigrationMQ = {
  collection: DumpCollectionName;
  fileId: string;
};

export const emailsMQ = new RabbitMQ<EmailMQ>({
  queue: "emails",
});
export const paymentsMQ = new RabbitMQ<PaymentMQ>({
  queue: "payments",
});
export const waitingMigrationMQ = new RabbitMQ<WaitingMigrationMQ>({
  queue: "waiting-migrations",
});

export { RabbitMQ, EmailMQ, PaymentMQ, WaitingMigrationMQ };
