import 'dotenv/config';
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 10));
}
