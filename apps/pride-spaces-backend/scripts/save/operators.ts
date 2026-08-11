import { ENV } from "../../src/utils/env";
ENV;
import { Space } from "../../src/database/models/space.js";
import { saveDocs } from "./save.js";

await saveDocs("spaces.json", Space);
