import { ENV } from "@/utils/env.js";
// import { loggings } from "@/utils/console.js";
// import * as MQs from "@/utils/services/rabbitmq/rabbitmq.js";
import cluster from "cluster";
import os from "os";
import process from "process";
import { createServer } from "http";
import moment from "moment";
import app from "./app.js";
import { handleMailQueue } from "@/utils/services/rabbitmq/email.js";
import { sleep } from "@/utils/time.js";
// import { workers } from "@/utils/workers/handler.js";

ENV;
// loggings;
// MQs;

const CPU_COUNT = os.cpus().length;
console.log("Total CPUS :", CPU_COUNT);

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} running`);

  // Fork workers
  for (let i = 0; i < CPU_COUNT; i++) {
    cluster.fork();
  }

  // Restart workers if they crash
  cluster.on("exit", (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

  // Queues
  handleMailQueue();
} else {
  // Workers run the HTTP server
  const server = createServer(app);

  server.listen(process.env.PORT, async () => {
    try {
      console.log(
        "Pride Spaces Backend APP listening on :",
        process.env.PORT,
        "PID :",
        process.pid,
      );
      await sleep(5);
      app.locals = { ...app.locals, startDate: moment() };
      //   startDate = moment();
      // await handleMailQueue();
    } catch (err: any) {
      console.error("Error running server: ", err);
    }
  });
}
