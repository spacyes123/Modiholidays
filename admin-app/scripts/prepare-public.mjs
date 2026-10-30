import { mkdir, copyFile, cp, readdir } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".."),
  target = path.resolve("public");
await mkdir(target, { recursive: true });
for (const file of await readdir(root))
  if (file.endsWith(".html") || ["robots.txt", "sitemap.xml"].includes(file))
    await copyFile(path.join(root, file), path.join(target, file));
for (const dir of ["assets", "tours"])
  await cp(path.join(root, dir), path.join(target, dir), { recursive: true });
console.log("Copied existing public website without modifying its sources.");
