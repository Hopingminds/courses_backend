import crypto from "crypto";

export const encrypt = (text, encryptionKey) => {
    const key = Buffer.from(encryptionKey, 'utf8'); // Ensure the key is treated as a buffer

    // Create cipher without an IV for ECB mode
    const cipher = crypto.createCipheriv('aes-128-ecb', key, null);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
};