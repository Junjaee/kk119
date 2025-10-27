/**
 * Database Abstraction Layer
 *
 * Conditionally exports either SQLite or Supabase implementation
 * based on NEXT_PUBLIC_USE_SUPABASE environment variable
 */

// Check which database backend to use
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

console.log(USE_SUPABASE ?'🚀 Using Supabase PostgreSQL database' : '📁 Using SQLite database (better-sqlite3)');

// Import the correct implementation
const dbModule = USE_SUPABASE
  ? await import('./supabase-database')
  : await import('./database-sqlite');

// Re-export all named exports
export const initDatabase = dbModule.initDatabase;
export const userDb = dbModule.userDb;
export const sessionDb = dbModule.sessionDb;
export const tokenDb = dbModule.tokenDb;
export const resourceDb = dbModule.resourceDb;

// Re-export default
export default dbModule.default || dbModule.supabase;
