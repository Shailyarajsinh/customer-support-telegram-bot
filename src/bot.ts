import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import axios from "axios";
import { cloudinary, UploadApiResponse } from "./cloudinary";
import { ImageModel } from "./models/image.model";
import { BOT_TOKEN } from "./config";
import { Buffer } from "buffer";
import { TicketModel } from "./models/Ticket.model";
import { UserStateModel } from "./models/Userstate.model";
import { isRateLimited } from "./rateLimiter";

dotenv.config();

// Validate environment variables
if (!BOT_TOKEN) {
  throw new Error("Telegram Bot Token is missing. Add it to the .env file.");
}

function createBot() {
  // Initialize the bot
  const bot = new Telegraf(BOT_TOKEN as string);

  // Define the main menu options
  let mainMenu = Markup.keyboard([
    ["🐀 Rats Kingdom - Introduction", "🤌 Get My Referral Link"],
    ["🔍 Profile Verification Issue", "📢 Updates"],
    ["💬 Feedback", "🎫 Raise a Ticket"],
  ])
    .resize()
    .oneTime();

  let rateLimitedMenu = Markup.keyboard([
    ["⏳ You're rate limited. Please wait for 30 seconds. ⏳"],
  ])
    .resize()
    .oneTime();


  const resetUserState = async (userId: number) => {
    await UserStateModel.findOneAndUpdate(
      { userId },
      { step: null, photoUrls: [] },
      { upsert: true }
    );
  };

  // Command: /start
  bot.start(async (ctx) => {
    try {
      const userId = ctx.chat.id;
      let cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        cooldown = 30000; // Set cooldown period to 30 seconds for blocked users
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      // Define the main menu
      const mainMenu = Markup.keyboard([
        ["🐀 Rats Kingdom - Introduction", "🤌 Get My referral link"],
        ["🔍 Profile Verification Issue", "📢 Updates"],
        ["💬 Feedback", "🎫 Raise a Ticket"],
      ])
        .resize()
        .oneTime();

      // Reset the user state
      await resetUserState(Number(userId));

      // Send the main menu
      await ctx.replyWithMarkdown(
        "*Welcome to the Rats Kingdom Support Bot!*\n\nThis bot is here to assist you with various tasks related to the Rats Kingdom platform. Please choose an option from the menu below to get started.\n\n⚠️ *Warning:* Spamming commands will result in temporary blocking. Please use the bot responsibly. 🛑\n\n" +
        "Here are the available commands:\n\n" +
        "1. 🐀 *Rats Kingdom - Introduction*: Learn about the Rats Kingdom and its features.\n\n" +
        "2. 🤌 *Get My Referral Link*: Generate and get your referral link to share with others.\n\n" +
        "3. 🔍 *Profile Verification Issue*: Report any issues with your profile verification by uploading a screenshot.\n\n" +
        "4. 📢 *Updates*: Get the latest updates and announcements from the Rats Kingdom.\n\n" +
        "5. 💬 *Feedback*: Provide your valuable feedback to help us improve the platform.\n\n" +
        "6. 🎫 *Raise a Ticket*: Raise a support ticket by providing details and uploading relevant screenshots.\n\n\n\n" +
        "⚠️ *Rate Limiting*: To prevent spamming, we have implemented rate limiting. If you send commands too quickly, you may be temporarily blocked. Please wait for the specified cooldown period before trying again.\n\n\n\n" +
        "⚠️ *Command Limit*: You can give only *FIVE COMMANDS*. After that, You will need to start from the beginning by typing ---> /start",
        mainMenu
      );
    } catch (error) {
      console.error(`Error in bot.start (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });

  // Command: Updates
  bot.hears("📢 Updates", async (ctx) => {
    // The image URL or file path
    const image = './public/images/rat.jpg'; // Replace with your image URL or local file path

    // The message text
    const message = "🚨 *1️⃣1️⃣ MILLION RATS USERS* 🚨\n\n💫 *Massive Congrats, Fam* 🔡 🐀\n\n✅ *Verify your profile NOW* to enjoy instant withdrawals and seamless rewards 💰\n\n⚡ *NEW Task Alert!* Complete them all and supercharge your $RATS earnings\n\n🚩 *Don’t forget to complete the compulsory tasks for eligibility* 💯\n\n⏰ *Mark your calendars* — *2nd Snapshot on January 10th!* Don’t miss the golden opportunity 🗓\n\nLet’s continue building this unstoppable community & conquer new heights 🚀\n\n⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️";

    // Send the image with the message as a caption
    await ctx.replyWithPhoto(
      { source: image  }, // This can also be a local file path
      { caption: message, parse_mode: "Markdown" }
    );
  });


  // Command: Rats Kingdom Introduction
  bot.hears("🐀 Rats Kingdom - Introduction", async (ctx) => {
    try {
      const userId = ctx.chat.id;
      const cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      const Links = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Open App", url: "http://t.me/RatsKingdom\_Bot/join?startapp=1375311862" },
            ],
            [
              { text: "Join Telegram", url: "https://t.me/The_RatsKingdom" },
            ],
            [
              { text: "Follow X", url: "https://x.com/The_RatsKingdom" },
            ],
            [
              { text: "Subscribe YouTube", url: "https://youtube.com/@the_ratskingdom?feature=shared" },
            ],
          ],
        },
      };

      await ctx.replyWithMarkdown(`
🐀 *Welcome to #RATS Kingdom – The Reign of Community-Driven Innovation* 🐀

Rats Kingdom is revolutionizing the crypto space with community-driven innovation and a vision for long-term growth. Integrated with Telegram, we’re building a thriving ecosystem with DApps, Web2 platforms, and an upcoming centralized exchange (CEX).

⚡️ *Key Achievements & Milestones:*

💫 10 Million+ Users – A united family in less than 3 months

💵 Massive Airdrop Incoming – Snapshot is near, and $RATS tokens will be distributed soon!

⭐️ Exclusive Events – Earn more $RATS by participating in exciting tasks and challenges.

🔒 Enhanced Security – Fairness and transparency in every step of your journey.

🎯 Don’t Miss Out! Join now, engage in the final events, and secure your spot in the biggest community-driven revolution in crypto!

👀 *Explore the Ecosystem:*
      `, Links);
    } catch (error) {
      console.error(`Error in bot.hears (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });

  // Command: Get My Referral Link
  bot.hears("🤌 Get My referral link", async (ctx) => {
    try {
      const userId = ctx.chat.id;
      const cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      const referralLink = `http://t.me/RatsKingdom_Bot/join?startapp=${userId}`;

      // Escape special characters in MarkdownV2
      const escapedReferralLink = referralLink.replace(/\_/g, "\\_");

      // Send the referral link to the user
      await ctx.replyWithMarkdown(
        `🎉 *Your Referral Link is Ready!* 🎉\n\n🔗 *Tap to copy:*\n\n \`${escapedReferralLink}\` \n\n🚀 *Share this link and earn rewards!* 🌟`
      );
    } catch (error) {
      console.error(`Error in bot.hears (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });

  // Command: Raise a Ticket
  bot.hears("🎫 Raise a Ticket", async (ctx) => {
    try {
      const userId = ctx.chat.id;
      const cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      let TicketId = Math.floor(100000 + Math.random() * 900000);
      await UserStateModel.findOneAndUpdate(
        { userId: ctx.chat.id },
        { step: "awaiting_issue_screenshot", photoUrls: [] },
        { upsert: true }
      );
      await ctx.replyWithMarkdown(
        `🎫 *Ticket ID: ${TicketId}*\n\n📸 Please upload a screenshot or photo related to your issue. If you don't have any image, please type the \`/skip\` command.`
      );
    } catch (error) {
      console.error(`Error in bot.hears (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });

  bot.command("skip", async (ctx) => {
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_issue_details", photoUrls: [] },
      { upsert: true }
    );
    await ctx.replyWithMarkdown(
      "Please provide details about the issue."
    );
  });

  // Command: "Profile Verification Issue"
  bot.hears("🔍 Profile Verification Issue", async (ctx) => {
    try {
      const userId = ctx.chat.id;
      const cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      await UserStateModel.findOneAndUpdate(
        { userId: ctx.chat.id },
        { step: "awaiting_profile_screenshot", photoUrls: [] },
        { upsert: true }
      );
      await ctx.replyWithMarkdown(
        "📸 *Profile Verification Issue* 📸\n\nPlease upload a screenshot of your profile page showing the verification issue. 📝"
      );
    } catch (error) {
      console.error(`Error in bot.hears (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });

  // Command: Feedback
  bot.hears("💬 Feedback", async (ctx) => {
    try {
      const userId = ctx.chat.id;
      const cooldown = 2000; // 2 seconds cooldown

      // Check if the user is rate-limited or blocked
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if required
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution
      }

      if (rateLimited) {
        // Optionally notify rate-limited users
        await ctx.replyWithMarkdown("🚫 *You're sending messages too quickly!* 🚫\n\n⏳ *Please wait a moment before trying again.* 🙏");
        return;
      }

      await UserStateModel.findOneAndUpdate(
        { userId: ctx.chat.id },
        { step: "feedback", photoUrls: [] },
        { upsert: true }
      );
      await ctx.replyWithMarkdown(
        "📝 *We Value Your Feedback!* 📝\n\nPlease provide your feedback on the Rats Kingdom platform. Your feedback is valuable to us and helps us improve! 🌟"
      );
    } catch (error) {
      console.error(`Error in bot.hears (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("⚠️ *An error occurred while processing your request. Please try again later.* ⚠️");
    }
  });


  bot.on("photo", async (ctx) => {
    try {
      const userId = ctx.chat.id
      const cooldown = 5000; // Set cooldown period to 5 seconds

      // Check if the user is rate-limited (blocked for spamming)
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          // Notify the user only if necessary
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution if blocked
      }

      if (rateLimited) {
        // Silently block rate-limited users without sending a reply
        return;
      }

      // Fetch user state to check if they are in a process
      const state = await UserStateModel.findOne({ userId });

      if (!state || !state.step) {
        await ctx.replyWithMarkdown(
          "🚫 *No Active Process!* 🚫\n\nPlease start a process first by selecting an option from the menu. 📋"
        );
        return;
      }

      // Get fileId from the last photo in the message
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

      // Get file path and prepare for download
      const file = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data);

      // Upload the image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "Bot_Uploads" },
        async (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            await ctx.replyWithMarkdown("🚫 *Failed to upload the image.* 🚫\n\n😔 *Please try again.* 🔄");
            return;
          }

          if (!result) {
            console.error("No result returned from Cloudinary.");
            await ctx.replyWithMarkdown("🚫 *Failed to upload the image.* 🚫\n\n😔 *Please try again.* 🔄");
            return;
          }

          // Save the image to MongoDB based on the current step
          let savedDocument;
          switch (state.step) {
            case "awaiting_profile_screenshot":
              savedDocument = await ImageModel.findOneAndUpdate(
                { UserId: userId },
                {
                  UserId: userId,
                  UserName: ctx.from?.username,
                  Profile_Image: result.secure_url,
                },
                { upsert: true, new: true }
              );
              state.step = "awaiting_ton_transaction_screenshot";
              await state.save();
              await ctx.replyWithMarkdown(
                "📸 *Profile screenshot received!* 📸\n\nNow, please upload a screenshot of your TON transaction. 💸"
              );
              break;

            case "awaiting_ton_transaction_screenshot":
              savedDocument = await ImageModel.findOneAndUpdate(
                { UserId: userId },
                {
                  TonTransactionImage: result.secure_url,
                },
                { new: true }
              );
              state.step = "awaiting_ton_hash";
              await state.save();
              await ctx.replyWithMarkdown(
                "📸 *TON transaction screenshot received!* 📸\n\n🔗 Please provide the TON transaction hash."
              );
              break;

            case "awaiting_issue_screenshot":
              const ticketId = Math.floor(100000 + Math.random() * 900000);
              savedDocument = await TicketModel.findOneAndUpdate(
                { UserId: userId },
                {
                  UserId: userId,
                  Issue_Image: result.secure_url,
                  TicketId: ticketId,
                },
                { upsert: true, new: true }
              );
              state.step = "awaiting_issue_details";
              await state.save();
              await ctx.replyWithMarkdown(
                "📸 *Issue screenshot received!* 📸\n\n📝 Please provide details about the issue so we can assist you better."
              );
              break;

            default:
              await ctx.replyWithMarkdown(
                "⚠️ *Unexpected step encountered!* ⚠️\n\n🔄 Please restart the process using /start."
              );
              break;
          }

          console.log("Updated document:", savedDocument);
        }
      );

      uploadStream.end(imageBuffer);
    } catch (error) {
      console.error("Error handling photo upload:", error);
      await ctx.replyWithMarkdown("⚠️ An error occurred while processing your image. Please try again. 🙏");
    }
  });


  bot.on("text", async (ctx) => {
    try {
      const userId = ctx.chat.id
      const cooldown = 2000; // Set cooldown period to 5 seconds

      // Check if the user is rate-limited
      const { blocked, rateLimited, notify, secondsRemaining } = await isRateLimited(userId, cooldown, ctx);

      if (blocked) {
        if (notify) {
          await ctx.replyWithMarkdown(
            `🚫 *You have been temporarily blocked for spamming.* 🚫\n\n⏳ Please wait *${secondsRemaining} seconds* before sending commands.\n\n🔄 _You can start over by typing_ --/start-- _after the cooldown period._`,
            rateLimitedMenu
          );
        }
        return; // Stop further execution if blocked
      }

      if (rateLimited) {
        // Silently block rate-limited users without sending a reply
        return;
      }

      let state = await UserStateModel.findOne({ userId });

      // If no state exists, create a default one
      if (!state) {
        state = new UserStateModel({ userId, step: null, photoUrls: [] });
      }

      // Handle state-driven workflows
      switch (state.step) {
        case "awaiting_ton_hash": {
          if (!ctx.message.text || ctx.message.text.trim() === "") {
            await ctx.replyWithMarkdown("🚫 *Invalid Input!* 🚫\n\nPlease provide the TON transaction hash in words. 📝");
            return;
          }

          const tonHash = ctx.message.text;

          // Update the TON hash in the database
          const savedDocument = await ImageModel.findOneAndUpdate(
            { UserId: userId },
            { TonTransactionHash: tonHash },
            { new: true }
          );

          console.log("Updated document:", savedDocument);

          await ctx.replyWithMarkdown(
            `✅ *TON Transaction Hash Received!* ✅\n\n*${ctx.from.first_name.toUpperCase()}*\n\nWe have received your request regarding the TON transaction issue. Our team will review the information provided and resolve your issue if it is genuine. 🕵️‍♂️🔍\n\nThank you for your patience. 🙏`
          );

          // Reset state in the database
          state.step = null;
          await state.save();
          break;
        }

        case "feedback": {
          const feedback = ctx.message.text;

          // Save feedback to the database
          const savedDocument = await ImageModel.findOneAndUpdate(
            { UserId: userId },
            { UserFeedback: feedback },
            { upsert: true, new: true }
          );

          console.log("Saved feedback document:", savedDocument);

          await ctx.replyWithMarkdown(
            `🎉 *Feedback Received!* 🎉\n\n*${ctx.from.first_name.toUpperCase()}*\n\nThank you for providing your feedback. 🙏 We appreciate your input and will use it to improve the Rats Kingdom platform. 🌟\n\nWe look forward to serving you better in the future. 🚀`
          );

          // Reset state in the database
          state.step = null;
          await state.save();
          break;
        }

        case "awaiting_issue_details": {
          const issueDetails = ctx.message.text;

          // Update the issue details in the database
          const savedDocument = await TicketModel.findOneAndUpdate(
            { UserId: userId },
            { IssueDetails: issueDetails },
            { upsert: true, new: true }
          );

          console.log("Updated document:", savedDocument);

          await ctx.replyWithMarkdown(
            `🎫 *Issue Details Received!* 🎫\n\n*${ctx.from.first_name.toUpperCase()}*\n\nWe have received your request regarding the issue. 🕵️‍♂️🔍 Our team will review the information provided and resolve your issue if it is genuine. ✅\n\nThank you for your patience. 🙏`
          );

          // Reset state in the database
          state.step = null;
          await state.save();
          break;
        }

        default:
          // Handle unexpected inputs
          switch (state.step) {
            case "awaiting_issue_screenshot":
              await ctx.replyWithMarkdown(
                "🚫 *Invalid Input!* 🚫\n\n📸 Please upload a screenshot or photo related to your issue. If you don't have any image, please type the `/skip` command. 📝"
              );
              break;

            case "awaiting_profile_screenshot":
              await ctx.replyWithMarkdown(
                "🚫 *Invalid Input!* 🚫\n\n📸 Please upload a screenshot of your profile page showing the verification issue. 📝"
              );
              break;

            case "awaiting_ton_transaction_screenshot":
              await ctx.replyWithMarkdown(
                "🚫 *Invalid Input!* 🚫\n\n📸 Please upload a screenshot of your TON transaction. 📝"
              );
              break;

            default:
              await ctx.replyWithMarkdown("⚠️ *Unexpected Input!* ⚠️\n\n🔄 Please restart the process by typing /start. 🚀");
              break;
          }
          break;
      }
    } catch (error) {
      console.error("Error handling text input:", error);
      await ctx.replyWithMarkdown("An error occurred while processing your request. Please try again.");
    }
  });

  // Command: /cancel
  bot.command("cancel", async (ctx) => {
    await resetUserState(ctx.chat.id);
    ctx.replyWithMarkdown(
      "❌ Process canceled. You can start over by typing /start. 🚀",
      mainMenu
    );
  });

  // Start the bot
  bot.launch();
  console.log("Bot is up and running!");

  // Enable graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export default createBot;