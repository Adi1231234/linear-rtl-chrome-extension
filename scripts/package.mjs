// Builds the upload-ready ZIP with only the runtime files (manifest, dist, icons).
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import archiver from "archiver";

await mkdir("release", { recursive: true });

const output = createWriteStream("release/linear-rtl-chrome-extension.zip");
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(output);
archive.file("manifest.json", { name: "manifest.json" });
archive.directory("dist/", "dist");
archive.directory("icons/", "icons");

output.on("close", () => console.log(`release/linear-rtl-chrome-extension.zip (${archive.pointer()} bytes)`));
await archive.finalize();
