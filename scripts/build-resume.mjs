import { spawnSync } from "node:child_process";

const result = spawnSync("python3", ["scripts/build_resume.py"], { stdio: "inherit" });
process.exit(result.status ?? 1);
