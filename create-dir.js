const fs = require("fs");
const path =
  "d:\\Projects\\dj-app\\dj\\app\\(routes)\\my-profile\\activities\\[tab]";
try {
  fs.mkdirSync(path, { recursive: true });
  console.log("SUCCESS: Directory created at " + path);
  process.exit(0);
} catch (err) {
  console.error("FAILED: " + err.message);
  process.exit(1);
}
