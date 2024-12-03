import express from 'express';
import path from 'path';
import createBot from './bot';
import { connectDatabase } from './database';

const app = express();
const port = 3000;

// Connect to the database

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

start();

// Start the Telegram bot
createBot();

// Route to display "Bot is alive" on an HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
