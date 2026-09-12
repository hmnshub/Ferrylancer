import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--production");
const environmentFile = isProduction ? ".env" : ".env.development";

dotenv.config({ path: path.join(serverDirectory, environmentFile) });

console.log(`[ferrylance-server] loaded ${environmentFile}`);
