import { randomBytes, pbkdf2 } from "crypto";
export class Password {
  static async toHash(password: string) {
    const salt = await randomBytes(8);
    const buffer = (await new Promise((resolve, reject) => {
      pbkdf2(password, salt.toString("hex"), 100000, 32, "sha512", (err, derivedKey) => {
        if (err) {
          reject(err);
        }
        resolve(derivedKey);
      });
    })) as Buffer;
    return `${salt.toString("hex")}.${buffer.toString("hex")}`;
  }

  static async compare(storedPassword: string, suppliedPassword: string) {
    const [salt, hashedPassword] = storedPassword.split(".");
    const buffer = (await new Promise((resolve, reject) => {
      pbkdf2(suppliedPassword, salt, 100000, 32, "sha512", (err, derivedKey) => {
        if (err) {
          reject(err);
        }
        resolve(derivedKey);
      });
    })) as Buffer;
    return buffer.toString("hex") === hashedPassword;
  }
}
