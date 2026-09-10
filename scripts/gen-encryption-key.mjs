import crypto from "node:crypto";

const key = crypto.randomBytes(32).toString("base64");

console.log("Añade esto a tu .env.local como ENCRYPTION_KEY:\n");
console.log(key);
