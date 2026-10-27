const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const run = (cmd) => {
  execSync(cmd, { stdio: "inherit" });
};

const runWithOutput = (cmd) => {
  try {
    const output = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return { code: 0, output: output || "" };
  } catch (e) {
    const stdout = (e.stdout || "").toString();
    const stderr = (e.stderr || "").toString();
    const output = (e.message || "") + "\n" + stdout + "\n" + stderr;
    return { code: e.status || 1, output };
  }
};

try {
  run("prisma generate");

  const migrateResult = runWithOutput("prisma migrate deploy");
  if (migrateResult.output) {
    process.stdout.write(migrateResult.output);
  }

  if (
    migrateResult.code !== 0 &&
    /P3005|schema is not empty|database schema/i.test(migrateResult.output)
  ) {
    console.log("\nDatabase schema already exists. Marking migrations as applied...");
    const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
    const migrations = fs
      .readdirSync(migrationsDir)
      .filter((f) => {
        const full = path.join(migrationsDir, f);
        return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "migration.sql"));
      })
      .sort();

    for (const migration of migrations) {
      console.log(`Resolving migration as applied: ${migration}`);
      try {
        execSync(`prisma migrate resolve --applied ${migration}`, { stdio: "inherit" });
      } catch (resolveError) {
        console.error(`Failed to resolve ${migration}: ${resolveError.message}`);
      }
    }

    run("prisma migrate deploy");
  } else if (migrateResult.code !== 0) {
    console.error("Migration failed.");
    process.exit(1);
  }

  run("next build");
} catch (e) {
  console.error("Build failed:", e.message);
  process.exit(1);
}
