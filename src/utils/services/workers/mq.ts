import { handleMigrationQueue } from "@/utils/services/rabbitmq/migration.js";

export const handleMQWorkers = () => {
  handleMigrationQueue();
};
