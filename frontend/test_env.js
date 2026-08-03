import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log(env.VITE_API_BASE_URL);
