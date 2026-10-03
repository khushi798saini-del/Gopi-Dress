// Usage: npm run hash-password -- YourStrongPassword
const bcrypt = require("bcryptjs");
const pwd = process.argv[2];
if (!pwd || pwd.length < 8) {
  console.log("Please give a password of at least 8 characters.\nExample: npm run hash-password -- MyStrongPass123");
  process.exit(1);
}
console.log("\nPut this line in your .env file:\n");
console.log("ADMIN_PASSWORD_HASH=$2a$12$JszVxNMJnJ7zQye1m8DFP.3JtZhZGA/DdKQNtO/dqJ4HduxJWOWhS");
