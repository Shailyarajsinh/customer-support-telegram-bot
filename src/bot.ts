import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_URL= 'https://customer-support-telegram-bot.vercel.app';


// Validate token
if (!BOT_TOKEN) {
  throw new Error('Telegram Bot Token is missing. Add it to the .env file.');
}

if (!BOT_URL) {
  throw new Error('Bot URL is missing. Add it to the .env file.');
}

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// Define main menu options
const mainMenu = Markup.keyboard([
  ['Rats Kingdom - Introduction', 'Your Invitation ID'],
  ['Profile Verification Issue', 'Updates'],
])
  .resize()
  .oneTime();

// Store user states
const userState: Record<number, { step: string | null }> = {};

// Handle the /start command
bot.start((ctx) => {
  userState[ctx.chat.id] = { step: null }; // Reset any ongoing process
  ctx.reply(
    'Welcome to the Rats Kingdom Support Bot! Please choose an option:',
    mainMenu
  );
});

// Handle "Profile Verification Issue"
bot.hears('Profile Verification Issue', async (ctx) => {
  userState[ctx.chat.id] = { step: 'awaiting_profile_screenshot' };
  await ctx.reply(
    'Please upload a screenshot of your profile page showing the verification issue.'
  );
});

// Handle incoming photos based on the step
bot.on('photo', async (ctx) => {
  const userId = ctx.chat.id;
  const state = userState[userId];

  if (!state || !state.step) {
    await ctx.reply('Please start a process first by selecting an option from the menu.');
    return;
  }

  switch (state.step) {
    case 'awaiting_profile_screenshot':
      userState[userId].step = 'awaiting_ton_transaction_screenshot';
      await ctx.reply(
        'Profile screenshot received. Now, upload a screenshot of your TON transaction.'
      );
      break;

    case 'awaiting_ton_transaction_screenshot':
      userState[userId].step = 'awaiting_ton_hash';
      await ctx.reply('TON transaction screenshot received. Please provide the TON transaction hash.');
      break;

    default:
      await ctx.reply('Unexpected step. Please restart the process by typing /start.');
  }
});



// Handle Updates
bot.hears('Updates', async (ctx) => {
  const message = `🚨 FINAL & BIGGEST CHANCE: Earn 1,00,000 $RATS by Inviting 5 Friends! 🚨
  
As we’ve reached an incredible 8 Million user milestone, it’s time for the biggest opportunity yet for everyone! Many of you have been requesting another chance to earn more $RATS, especially those who missed our first "Invite 5 Friends" task. 
  
🔥 Special Task: Invite 5 more friends to Rats Kingdom
🎁 Reward: 100,000 $RATS
⏰ Task Duration: 21 Days
  
🎯 Act fast—this is your LAST and BIGGEST opportunity to boost your $RATS balance before the SNAPSHOT! 🐀👑`;
  ctx.reply(message);
});

// Handle Rats Kingdom Introduction
bot.hears('Rats Kingdom - Introduction', async (ctx) => {
  ctx.replyWithMarkdown(`
*Rats Kingdom - Introduction*

Rats Kingdom is a community-driven cryptocurrency project that has launched an airdrop campaign. The amount of $RATS tokens received in the airdrop campaign can vary depending on the user's active participation in completing quests and inviting other users to the platform.

The $RATS tokens can be used for various purposes within the Rats Kingdom ecosystem, such as staking, trading, and participating in governance decisions.
`);
});


// Handle Your Invitation ID
bot.hears('Your Invitation ID', async (ctx) => {
  ctx.reply('Your Invitation ID is: 123456');
});

// Handle fallback /cancel
bot.command('cancel', (ctx) => {
  userState[ctx.chat.id] = { step: null }; // Clear the user's state
  ctx.reply('Process canceled. You can start over by typing /start.', mainMenu);
});

// Fallback handler for unmatched messages
bot.on('text', (ctx) => {
  ctx.reply('Please use the menu options or type /start to begin.');
});

// Handle text input for TON hash and Telegram User ID
// bot.on('text', async (ctx) => {
//   const userId = ctx.chat.id;
//   const state = userState[userId];

//   if (!state || !state.step) {
//     ctx.reply('Please use the menu options or type /start to begin.');
//     return;
//   }

//   switch (state.step) {
//     case 'awaiting_ton_hash':
//       userState[userId].step = 'awaiting_telegram_user_id';
//       await ctx.reply('TON transaction hash received. Now, provide your Telegram User ID.');
//       break;

//     case 'awaiting_telegram_user_id':
//       userState[userId] = { step: null }; // Clear user state
//       await ctx.reply(
//         'All details received! Your issue will be reviewed soon. Thank you for your patience.'
//       );
//       break;

//     default:
//       ctx.reply('Unexpected input. Please restart the process by typing /start.');
//   }
// });

// Start the bot
// bot.launch();


// Set up Express to handle webhooks
const app = express();
app.use(express.json());



// Set webhook
bot.telegram.setWebhook(`${BOT_URL}/webhook`);

// Handle webhook requests
app.use(bot.webhookCallback('/webhook'));

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});

console.log('Bot is up and running!');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
