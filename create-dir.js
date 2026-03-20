const fs = require("fs");
const paths = [
  "d:\\Projects\\dj-app\\dj\\app\\api\\festivals\\single-festival",
  "d:\\Projects\\dj-app\\dj\\app\\api\\festivals\\lineup",
];
paths.forEach((p) => {
  try {
    fs.mkdirSync(p, { recursive: true });
    console.log("SUCCESS: " + p);
  } catch (err) {
    console.error("FAILED: " + p + " - " + err.message);
  }
});
console.log("All done - you can delete this file now.");
