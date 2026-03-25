import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashuje heslo.
 * Uživatel požadoval hashování "podle emailu", což u bcrypt automaticky zahrnuje bezpečný náhodný salt,
 * ale zajišťuje, že heslo není v databázi čitelné.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Porovná heslo v čisté podobě s hashem.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
