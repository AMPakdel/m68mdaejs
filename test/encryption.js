//Checking the crypto module
const crypto = require('crypto');
const algorithm = 'aes-128-cbc';
const key = Buffer.from("vhCMqytk43UeegLi", "utf8");
const iv = Buffer.from("JCilDfrPiPhVd10r", "utf8");

//Encrypting text
function encrypt(text) {
   let cipher = crypto.createCipheriv(algorithm, key, iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return encrypted.toString('base64');
}

// Decrypting text
function decrypt(text) {
   let encryptedText = Buffer.from(text, 'base64');
   let decipher = crypto.createDecipheriv(algorithm, key, iv);
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   return decrypted.toString();
}