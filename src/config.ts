import dotenv from "dotenv";

dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN as string;
export const MONGO_URI = process.env.MONGO_URI as string;
