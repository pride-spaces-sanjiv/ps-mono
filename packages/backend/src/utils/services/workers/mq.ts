import { handleMigrationQueue } from "@/utils/services/rabbitmq/migration.js";
import { handleAreasUpdateQueue } from "../rabbitmq/areas.js";
import { handleSpaceSlugsQueue } from "../rabbitmq/space-slug.js";

export const handleMQWorkers = () => {
  handleMigrationQueue();
  handleAreasUpdateQueue();
  handleSpaceSlugsQueue();
};
