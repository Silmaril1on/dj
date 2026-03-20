const fs = require("fs");

const dirs = [
  "d:\\Projects\\dj-app\\dj\\app\\api\\festivals\\single-festival",
  "d:\\Projects\\dj-app\\dj\\app\\api\\festivals\\lineup",
];

try {
  dirs.forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Created: " + dir);
  });
  console.log("SUCCESS: All directories created");
  process.exit(0);
} catch (err) {
  console.error("FAILED: " + err.message);
  process.exit(1);
}
