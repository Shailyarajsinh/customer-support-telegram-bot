import express from 'express';
import path from 'path';
import createBot from './bot';

const app = express();
const port = 3000;

// Start the Telegram bot
createBot();

// Route to display "Bot is alive" on an HTML page
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
