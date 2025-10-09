import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Carregar variáveis de ambiente do arquivo .env
config({ path: path.join(process.cwd(), ".env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
});