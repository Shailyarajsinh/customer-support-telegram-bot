import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';


dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Validate environment variables
if (!BOT_TOKEN) {
  throw new Error('Telegram Bot Token is missing. Add it to the .env file.');
}

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// Define the main menu options
const mainMenu = Markup.keyboard([
  ['Rats Kingdom - Introduction', '🤌 Get My referal link'],
  ['Profile Verification Issue', 'Updates'],
])
  .resize()
  .oneTime();

// Store user states for step-by-step processes
const userState: Record<number, { step: string | null }> = {};

// Command: /start
bot.start((ctx) => {
  // Reset the user's state
  userState[ctx.chat.id] = { step: null };
  ctx.reply(
    'Welcome to the Rats Kingdom Support Bot! Please choose an option:',
    mainMenu
  );
});

// Command: Updates
bot.hears('Updates', async (ctx) => {
  const message = `🚨 FINAL & BIGGEST CHANCE: Earn 1,00,000 $RATS by Inviting 5 Friends! 🚨
  
As we’ve reached an incredible 8 Million user milestone, it’s time for the biggest opportunity yet for everyone! Many of you have been requesting another chance to earn more $RATS, especially those who missed our first "Invite 5 Friends" task. 
  
🔥 Special Task: Invite 5 more friends to Rats Kingdom
🎁 Reward: 100,000 $RATS
⏰ Task Duration: 21 Days
  
🎯 Act fast—this is your LAST and BIGGEST opportunity to boost your $RATS balance before the SNAPSHOT! 🐀👑`;
  ctx.reply(message);
});

// Command: Rats Kingdom Introduction
bot.hears('Rats Kingdom - Introduction', async (ctx) => {
  ctx.replyWithMarkdown(`
*Rats Kingdom - Introduction*

Rats Kingdom is a community-driven cryptocurrency project that has launched an airdrop campaign. The amount of $RATS tokens received in the airdrop campaign can vary depending on the user's active participation in completing quests and inviting other users to the platform.

The $RATS tokens can be used for various purposes within the Rats Kingdom ecosystem, such as staking, trading, and participating in governance decisions.
`);
});

// Command: Get My Referral Link
bot.hears('🤌 Get My referal link', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    return ctx.reply('Could not retrieve your referral link. Please try again.');
  }

  // Generate the referral link dynamically using the chat ID
  const referralLink = `http://t.me/RatsKingdom_Bot/join?startapp=${chatId}`;

  // Send the referral link to the user
  await ctx.replyWithMarkdown(`🤝 *Your Referral Link:* \n\n [${referralLink}] `);
});


// Command: "Profile Verification Issue"
bot.hears('Profile Verification Issue', async (ctx) => {
  userState[ctx.chat.id] = { step: 'awaiting_profile_screenshot' };
  await ctx.reply(
    'Please upload a screenshot of your profile page showing the verification issue.'
  );
});

// Handler: Photo Uploads
bot.on('photo', async (ctx) => {
  const userId = ctx.chat.id;
  const state = userState[userId];

  if (!state || !state.step) {
    await ctx.reply(
      'Please start a process first by selecting an option from the menu.'
    );
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
      await ctx.reply(
        'TON transaction screenshot received. Please provide the TON transaction hash.'
      );
      break;

    default:
      await ctx.reply(
        'Unexpected step. Please restart the process by typing /start.'
      );
  }
});

// Handle Text Inputs (TON hash and Telegram User ID)
bot.on('text', async (ctx) => {
  const userId = ctx.chat.id;
  const state = userState[userId];

  if (!state || !state.step) {
    ctx.reply('Please use the menu options or type /start to begin.');
    return;
  }

  // Validate the TON hash
  const tonHashRegex = /^\d+:[0-9a-fA-F]+$/;

  switch (state.step) {
    case 'awaiting_ton_hash':
      const tonHash = ctx.message.text;
      console.log('TON Hash:',tonHash);
      console.log(`userName: ${ctx.from?.username}`); 

      if (!tonHashRegex.test(tonHash)) {
        await ctx.reply(
          'Invalid TON transaction hash. Please ensure it is a 64-character hexadecimal string.'
        );
        return;
      }

      // Respond to the user
      await ctx.replyWithMarkdown(
        `*TON transaction hash received.*\n\nWe have received your request regarding the TON transaction issue.\n\nOur team will review the information provided and resolve your issue if it is genuine.\n\nThank you for your patience.`
      );
      break;

    default:
      ctx.reply('Unexpected input. Please restart the process by typing /start.');
  }
});
 

// Command: /cancel
bot.command('cancel', (ctx) => {
  userState[ctx.chat.id] = { step: null }; // Reset user state
  ctx.reply('Process canceled. You can start over by typing /start.', mainMenu);
});

// Fallback: Handle unmatched messages
bot.on('text', (ctx) => {
  ctx.reply('Please use the menu options or type /start to begin.');
});

// Start the bot
bot.launch();
console.log('Bot is up and running!');

// Enable graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
