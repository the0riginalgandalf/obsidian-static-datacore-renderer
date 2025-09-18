import fs from "fs";
import path from "path";

const manifestPath = path.join(process.cwd(), "manifest.json");
const packagePath = path.join(process.cwd(), "package.json");
const versionsPath = path.join(process.cwd(), "versions.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

const newVersion = packageJson.version;

manifest.version = newVersion;
versions[newVersion] = manifest.minAppVersion;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));
