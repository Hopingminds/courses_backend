import crypto from "crypto";

export const encrypt = (text, key) => {
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(key), null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}
