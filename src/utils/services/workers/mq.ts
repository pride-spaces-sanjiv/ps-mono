import { handleMigrationQueue } from "@/utils/services/rabbitmq/migration.js";
import { handleAreasUpdateQueue } from "../rabbitmq/areas.js";

export const handleMQWorkers = () => {
  handleMigrationQueue();
  handleAreasUpdateQueue();
};
