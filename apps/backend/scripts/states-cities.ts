import { ENV } from "../src/utils/env";
ENV;
import { pushStatesAndCities } from "../src/utils/services/rabbitmq/states-cities";

await pushStatesAndCities();
