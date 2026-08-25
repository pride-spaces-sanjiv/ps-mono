import { ENV } from "@pride-spaces/common/utils/env.js";
ENV;
// import { loggings } from "@pride-spaces/backend/utils/console.js";
// import * as MQs from "@pride-spaces/backend/utils/services/rabbitmq/rabbitmq.js";
import cluster from "cluster";
import os from "os";
import process from "process";
import { createServer } from "http";
import moment from "moment";
import app from "./app.js";
import { handleMailQueue } from "@pride-spaces/backend/utils/services/rabbitmq/email.js";
import { getProcessArgsObject } from "@pride-spaces/common/utils/args.js";
import { sleep } from "@pride-spaces/common/utils/time.js";
import { handleMQWorkers } from "@pride-spaces/backend/utils/services/workers/mq.js";
// import { workers } from "@pride-spaces/backend/utils/workers/handler.js";

// ENV;
// loggings;
// MQs;
const args = getProcessArgsObject<{ max_cpus: string }>();
const maxCpus = Number.isFinite(Number(args.max_cpus))
  ? Number(args.max_cpus)
  : os.cpus().length;

const CPU_COUNT = maxCpus;
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
  handleMQWorkers();
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
