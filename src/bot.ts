import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import axios from "axios";
import { cloudinary, UploadApiResponse } from "./cloudinary";
import { ImageModel } from "./models/image.model";
import { BOT_TOKEN } from "./config";
import { Buffer } from "buffer";
import { TicketModel } from "./models/Tickit.model";
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

  // Store user states for step-by-step processes
  // const userState: { [key: number]: { photoUrls: string[]; step: string | null } } = {};

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
        await ctx.replyWithMarkdown("You're sending messages too quickly. Please wait a moment.");
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
        "Welcome to the Rats Kingdom Support Bot! Please choose an option:",
        mainMenu
      );
    } catch (error) {
      console.error(`Error in bot.start (User ID: ${ctx.chat.id}):`, error);
      await ctx.replyWithMarkdown("An error occurred while processing your request. Please try again later.");
    }
  });


  // Command: Updates
  bot.hears("📢 Updates", async (ctx) => {

    const message = `🚨 FINAL & BIGGEST CHANCE: Earn 1,00,000 $RATS by Inviting 5 Friends! 🚨
    
  As we’ve reached an incredible 8 Million user milestone, it’s time for the biggest opportunity yet for everyone! Many of you have been requesting another chance to earn more $RATS, especially those who missed our first "Invite 5 Friends" task. 
    
  🔥 Special Task: Invite 5 more friends to Rats Kingdom
  🎁 Reward: 100,000 $RATS
  ⏰ Task Duration: 21 Days
    
  🎯 Act fast—this is your LAST and BIGGEST opportunity to boost your $RATS balance before the SNAPSHOT! 🐀👑`;
    ctx.replyWithMarkdown(message);
  });

  // Command: Rats Kingdom Introduction
  bot.hears("🐀 Rats Kingdom - Introduction", async (ctx) => {
    ctx.replyWithMarkdown(`
  🐀 *Rats Kingdom - Introduction* 🐀

  Welcome to the **Rats Kingdom**! 🎉

  Rats Kingdom is a community-driven cryptocurrency project that has launched an exciting airdrop campaign. 🚀 The amount of $RATS tokens you receive in the airdrop can vary depending on your active participation in completing quests and inviting other users to the platform. 👫👬👭

  The $RATS tokens can be used for various purposes within the Rats Kingdom ecosystem, such as:
  - 🏦 Staking
  - 💱 Trading
  - 🗳️ Participating in governance decisions

  Join us and be a part of this amazing journey! 🌟
  `);
  });

  // Command: Get My Referral Link
  bot.hears("🤌 Get My referral link", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return ctx.replyWithMarkdown(
        "Could not retrieve your referral link. Please try again."
      );
    }

    const referralLink = `http://t.me/RatsKingdom_Bot/join?startapp=${chatId}`;

    // Escape special characters in MarkdownV2
    const escapedReferralLink = referralLink.replace(/\_/g, "\\_");
    
    // Send the referral link to the user
    await ctx.replyWithMarkdown(
      `🎉 *Your Referral Link is Ready!* 🎉\n\n🔗 *Tap to copy:*\n\n \`${escapedReferralLink}\` \n\n🚀 *Share this link and earn rewards!* 🌟`
    );
    
  });    

  // Command: Raise a Ticket
  bot.hears("🎫 Raise a Ticket", async (ctx) => {
    let TicketId = Math.floor(100000 + Math.random() * 900000);
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_issue_screenshot", photoUrls: [] },
      { upsert: true }
    );
    await ctx.replyWithMarkdown(
      `🎫 *Ticket ID: ${TicketId}*\n\n📸 Please upload a screenshot or photo related to your issue. If you don't have any image, please type the \`/skip\` command.`
    );
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
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_profile_screenshot", photoUrls: [] },
      { upsert: true }
    );
    await ctx.replyWithMarkdown(
      "Please upload a screenshot of your profile page showing the verification issue."
    );
  });

  // Command: Feedback
  bot.hears("💬 Feedback", async (ctx) => {
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "feedback", photoUrls: [] },
      { upsert: true }
    );
    await ctx.replyWithMarkdown(
      "📝 *We Value Your Feedback!* 📝\n\nPlease provide your feedback on the Rats Kingdom platform. Your feedback is valuable to us and helps us improve! 🌟"
    );
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
          "Please start a process first by selecting an option from the menu."
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
            await ctx.replyWithMarkdown("Failed to upload the image. Please try again.");
            return;
          }

          if (!result) {
            console.error("No result returned from Cloudinary.");
            await ctx.replyWithMarkdown("Failed to process the image. Please try again.");
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

      // if (!state.step) {
      //   // Handle specific keywords outside the process
      //   switch (ctx.message.text.toLowerCase()) {
      //     case "feedback":
      //       state.step = "feedback";
      //       await state.save();
      //       await ctx.replyWithMarkdown(
      //         "📝 *We Value Your Feedback!* 📝\n\nPlease provide your feedback on the Rats Kingdom platform. Your feedback is valuable to us and helps us improve! 🌟"
      //       );
      //       break;

      //     default:
      //       await ctx.replyWithMarkdown("Please use the menu options or type /start to begin.");
      //       break;
      //   }
      //   return;
      // }

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

  // Fallback: Handle unmatched messages
  bot.on("text", (ctx) => {
    ctx.replyWithMarkdown("Please use the menu options or type /start to begin.line-316");
  });

  // Start the bot
  bot.launch();
  console.log("Bot is up and running!");

  // Enable graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export default createBot;