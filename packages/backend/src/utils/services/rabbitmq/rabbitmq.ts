import amqp, { Channel, connect } from "amqplib";
import { EmailToken } from "@/database/models/email.js";
import { sleep } from "@pride-spaces/common/utils/time.js";
import { NullableValue, PartialNullableObject } from "@/types/partial.js";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { DumpCollectionName } from "@pride-spaces/common/utils/data/dump.js";

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

// Main Conn Class
class RabbitMQConn {
  url = `amqp://${process.env.RABBIT_USER}:${process.env.RABBIT_PASS}@${process.env.RABBIT_HOST}:${process.env.RABBIT_PORT}`;
  /** @description amqp connection */
  connection: NullableValue<amqp.ChannelModel> = null;
  /** @description the amqp connection's channel */
  channel: NullableValue<amqp.Channel> = null;
  /** @description reconnection attempt gap delay in ms @default 5000 */
  reconnectDelay = 5000;
  /** @description reconnection max retries @default 10 */
  reconnectMaxRetries = 10;
  isReconnecting = false;

  constructor(
    params?: PartialNullableObject<Omit<RabbitMQConstructorParams, "queue">>,
  ) {
    try {
      const allParams = { ...params };
      this.url = allParams?.url?.trim() || this.url;
      this.reconnectDelay =
        Number(String(allParams?.reconnectDelay)) || this.reconnectDelay;
      this.reconnectMaxRetries =
        Number(String(allParams?.reconnectMaxRetries)) ||
        this.reconnectMaxRetries;
      this.connect();
    } catch (err: any) {
      console.error("Error instanciating rabbit-mq :", err);
    }
  }

  async createConnChannel() {
    try {
      this.connection = await connect(this.url);
      console.log(this.isReconnecting ? "Reconnected" : "Connected", "to MQ");

      // Connection events
      this.connection.on("close", () => {
        console.log("MQ connection closed");
        this.reconnect();
      });
      this.connection.on("error", (err) => {
        console.error("MQ connection error :", err);
        this.reconnect();
      });

      this.channel = await this.connection.createChannel();
      console.log("Created channel MQ");

      process.on("beforeExit", async () => {
        this.cleanup();
      });
      return this.channel;
    } catch (err: any) {
      console.error(
        "Error",
        this.isReconnecting ? "re-connecting" : "connecting",
        "to rabbit-mq :",
        err,
      );
      throw err;
    }
  }

  async connect() {
    try {
      await this.createConnChannel();
      return this.channel;
    } catch (err: any) {
      // logger.connectErr("Error connecting to rabbit-mq :", err);
      await this.reconnect();
      return null;
    }
  }

  async reconnect() {
    if (this.isReconnecting) {
      // 🔒 prevent parallel reconnects
      return;
    }
    this.isReconnecting = true;

    try {
      if (this.channel) {
        try {
          console.log("Retrying MQ channel recovery");
          await this.channel.recover();
          return;
        } catch (err: any) {
          console.error("Error MQ channel recovery", err);
        }
      }

      console.log("Starting to re-connect mq");
      for (let i = 1; i <= this.reconnectMaxRetries; i++) {
        try {
          console.log("Retrying MQ connection", i, "time");
          await this.cleanup();
          await this.createConnChannel();
          if (this.channel) {
            return;
          }
        } catch (err) {}
        await sleep(Math.round(this.reconnectDelay));
      }
      throw new Error("Max retries attempted to re-connect MQ", {
        cause: "max-retries-exceeded",
      });
    } catch (err: any) {
      console.error("Error re-connecting to rabbit-mq :", err);
    } finally {
      this.isReconnecting = false;
    }
  }

  async cleanup() {
    try {
      if (this.channel) await this.channel.close();
    } catch {}
    try {
      if (this.connection) {
        this.connection.removeAllListeners();
        await this.connection.close();
      }
    } catch {}
  }
}

const defaultMQConn = new RabbitMQConn();

// MQ Instance class
class RabbitMQ<M extends { [k: string]: any } = {}> {
  /** @description name of the queue */
  queue = "";
  /** @description amqp connection */
  connection: NullableValue<amqp.ChannelModel> = null;
  /** @description the amqp connection's channel */
  channel: NullableValue<amqp.Channel> = null;
  conn: RabbitMQConn | null = null;
  retryChanneliseDelay = 1;
  queueAsserted = false;
  sendWaitQueue: M[] = [];
  consumeWaitQueue: M[] = [];

  constructor(
    params?: PartialNullableObject<
      Pick<RabbitMQConstructorParams, "queue" | "connection"> & {
        conn: RabbitMQConn;
        retryChanneliseDelay: number;
      }
    >,
  ) {
    try {
      const allParams = { ...params };
      if (!allParams.queue?.trim()) {
        throw new Error("Queue must be present", { cause: "queue-name" });
      }
      this.queue = allParams.queue.trim();
      this.conn = defaultMQConn;
      if (allParams.conn) {
        this.conn = allParams.conn;
      }
      this.retryChanneliseDelay = allParams.retryChanneliseDelay || 1;
      this.channelise();
    } catch (err: any) {
      console.error("Error instanciating rabbit-mq :", err);
    }
  }

  async channelise() {
    try {
      this.connection = this.conn?.connection;
      this.channel = this.conn?.channel;
      if (!this.channel) {
        throw new Error("Invalid channel", { cause: "invalid-channel" });
      }
      !this.queueAsserted && (await this.channel?.assertQueue(this.queue));
      this.queueAsserted = true;
      console.log("Queue asserted MQ", this.queue);
    } catch (err) {
      console.error("Channelization failed :", err);
    }
  }

  async validateChannel(retries = 1) {
    try {
      await this.channelise();
      if (!this.connection) {
        throw new Error("Invalid MQ connection", {
          cause: "invalid-connection",
        });
      }
      if (!this.channel) {
        throw new Error("Invalid MQ channel", { cause: "invalid-channel" });
      }
      return;
    } catch (err) {
      console.error("Error validating MQ channel :", err);
      this.queueAsserted = false;
      // Reconnect if validation fails
      await this.conn?.reconnect?.();
      await sleep(this.retryChanneliseDelay);
      if (retries >= 5) {
        throw new Error("Max retries attempted to validate MQ channel", {
          cause: "validation-retries-limit-reached",
        });
      }
      await this.validateChannel(retries + 1);
    }
  }

  async sendMessage<T extends { [k: string]: any } & M = M>(
    data: T | M,
    publishOptions?: Partial<amqp.Options.Publish>,
  ) {
    try {
      await this.validateChannel();
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
      await this.validateChannel();
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
            console.error("Failed consuming rabbit-mq message :", msg, err);
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
      await this.validateChannel();
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

export type AreasUpdateMQ = {
  pairs: { city: string; area: string }[];
};
export const areasUpdateMQ = new RabbitMQ<AreasUpdateMQ>({
  queue: "areas-updates",
});

export { RabbitMQ, EmailMQ, PaymentMQ, WaitingMigrationMQ };
