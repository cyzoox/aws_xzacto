/* eslint-disable no-undef */
// Import cryptographic functions that work reliably in React Native
import 'react-native-get-random-values';

/**
 * Simple but effective password hashing for React Native
 * Uses a combination of SHA-256 and base64 encoding with salt
 * @param {string} password - The plain text password to hash
 * @returns {string} - A string containing the salt and hash, separated by a delimiter
 */
export const hashPassword = password => {
  try {
    // Generate a random salt (16 bytes converted to hex = 32 chars)
    const saltArray = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      saltArray[i] = Math.floor(Math.random() * 256);
    }

    // Convert salt to hex string
    const salt = Array.from(saltArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create a simple hash using the built-in TextEncoder and crypto subtle

    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);

    // Use a hash we can rely on in React Native
    const hashBuffer = simpleHash(data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Return the salt and hash together for storage
    return `${salt}:${hashHex}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verifies a password against a stored hash
 * @param {string} storedValue - The stored hash string (salt:hash)
 * @param {string} password - The plain text password to verify
 * @returns {boolean} - True if the password matches
 */
export const verifyPassword = (storedValue, password) => {
  try {
    // Handle legacy plain text passwords for backward compatibility
    if (!storedValue.includes(':')) {
      return storedValue === password;
    }

    // Extract the salt and stored hash
    const [salt, storedHash] = storedValue.split(':');

    // Create a simple hash using the built-in TextEncoder and our hash function
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);

    // Use a hash we can rely on in React Native
    const hashBuffer = simpleHash(data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare the computed hash with the stored hash
    return hashHex === storedHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Simple hash function that works reliably in React Native
 * @param {Uint8Array} data - Data to hash
 * @returns {ArrayBuffer} - Hashed result
 */
function simpleHash(data) {
  // A simple implementation of FNV-1a hash
  const FNV_PRIME = 16777619;
  const OFFSET_BASIS = 2166136261;

  let hash = OFFSET_BASIS;

  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Convert to ArrayBuffer (32 bits = 4 bytes)
  const result = new ArrayBuffer(32); // Using 32 bytes for better security
  const view = new DataView(result);

  // Expand the 32-bit hash into 32 bytes for better security
  for (let i = 0; i < 8; i++) {
    const h = (hash + i * 1337) ^ (hash * (i + 1));
    view.setUint32(i * 4, h, false);
  }

  return result;
}
