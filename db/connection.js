import pg from 'pg';
import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// const supabase = createClient(
//     process.env.SUPABASE_URL, 
//     process.env.SUPABASE_KEY)

const db = new pg.Client({
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    host: process.env.HOST,
    password: process.env.PG_PASSWORD,
    port: process.env.PORT
});

db.connect();

export default db;