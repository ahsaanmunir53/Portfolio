/** Turn a password into a bcrypt hash for ADMIN_PASSWORD_HASH.
 *  Usage: node src/hash.js "your password here"   */
const bcrypt = require("bcryptjs");
const pw = process.argv.slice(2).join(" ");
if (!pw) {
  console.log('Usage: node src/hash.js "your password"');
  process.exit(1);
}
bcrypt.hash(pw, 12).then((h) => {
  console.log("\nADMIN_PASSWORD_HASH=" + h + "\n");
  console.log("Paste that into .env (or Render's environment) and remove ADMIN_PASSWORD.\n");
});
