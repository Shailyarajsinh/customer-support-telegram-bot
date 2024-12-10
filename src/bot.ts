import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import axios from "axios";
import { cloudinary, UploadApiResponse } from "./cloudinary";
import { ImageModel } from "./models/image.model";
import { BOT_TOKEN } from "./config";
import { Buffer } from "buffer";
import { TicketModel } from "./models/Tickit.model";
import { UserStateModel } from "./models/Userstate.model";



dotenv.config();

// Validate environment variables
if (!BOT_TOKEN) {
  throw new Error("Telegram Bot Token is missing. Add it to the .env file.");
}

function createBot() {
  // Initialize the bot
  const bot = new Telegraf(BOT_TOKEN as string);

  // Define the main menu options
  const mainMenu = Markup.keyboard([
    ["Rats Kingdom - Introduction", "🤌 Get My referal link"],
    ["Profile Verification Issue", "Updates"],
    ["feedback", "Raise a Ticket"],
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
    const userId = ctx.chat.id;
    await resetUserState(userId);
    await ctx.reply(
      "Welcome to the Rats Kingdom Support Bot! Please choose an option:",
      mainMenu
    );
  });

  // Command: Updates
  bot.hears("Updates", async (ctx) => {
    const message = `🚨 FINAL & BIGGEST CHANCE: Earn 1,00,000 $RATS by Inviting 5 Friends! 🚨
    
  As we’ve reached an incredible 8 Million user milestone, it’s time for the biggest opportunity yet for everyone! Many of you have been requesting another chance to earn more $RATS, especially those who missed our first "Invite 5 Friends" task. 
    
  🔥 Special Task: Invite 5 more friends to Rats Kingdom
  🎁 Reward: 100,000 $RATS
  ⏰ Task Duration: 21 Days
    
  🎯 Act fast—this is your LAST and BIGGEST opportunity to boost your $RATS balance before the SNAPSHOT! 🐀👑`;
    ctx.reply(message);
  });

  // Command: Rats Kingdom Introduction
  bot.hears("Rats Kingdom - Introduction", async (ctx) => {
    ctx.replyWithMarkdown(`
  *Rats Kingdom - Introduction*
  
  Rats Kingdom is a community-driven cryptocurrency project that has launched an airdrop campaign. The amount of $RATS tokens received in the airdrop campaign can vary depending on the user's active participation in completing quests and inviting other users to the platform.
  
  The $RATS tokens can be used for various purposes within the Rats Kingdom ecosystem, such as staking, trading, and participating in governance decisions.
  `);
  });

  // Command: Get My Referral Link
  bot.hears("🤌 Get My referal link", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return ctx.reply(
        "Could not retrieve your referral link. Please try again."
      );
    }

    // Generate the referral link dynamically using the chat ID
    const referralLink = `http://t.me/RatsKingdom_Bot/join?startapp=${chatId}`;

    // Send the referral link to the user
    await ctx.replyWithMarkdown(
      `🤝 *Your Referral Link:* \n\n [${referralLink}] `
    );
  });

  // Command: Contact Support
  // bot.hears("📞 Contact Support", async (ctx) => {
  //   ctx.reply(
  //     `
  //     Please contact our support team at\n
  //     📧 Email: xyz@gmail.com\n
  //     📞 Phone: XXX-XXX-XXXX \n
  //     🌐 Website: WWW.ABC.COM\n
  //     `
  //   );
  // });

  // Command: Raise a Ticket

  let TicketId = Math.floor(100000 + Math.random() * 900000);

  // Command: Raise a Ticket
  bot.hears("Raise a Ticket", async (ctx) => {
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_issue_screenshot", photoUrls: [] },
      { upsert: true }
    );
    await ctx.reply(
      `Ticket ID: ${TicketId}\n\nPlease upload a screenshot or photo related to your issue. If you don't have any image please type the '/skip' command.`
    );
  });

  bot.command("skip", async (ctx) => {
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_issue_details", photoUrls: [] },
      { upsert: true }
    );
    await ctx.reply(
      "Please provide details about the issue."
    );
  });

  // Command: "Profile Verification Issue"
  bot.hears("Profile Verification Issue", async (ctx) => {
    await UserStateModel.findOneAndUpdate(
      { userId: ctx.chat.id },
      { step: "awaiting_profile_screenshot", photoUrls: [] },
      { upsert: true }
    );
    await ctx.reply(
      "Please upload a screenshot of your profile page showing the verification issue."
    );
  });

  // Handler: Photo Uploads
  bot.on("photo", async (ctx) => {
    const userId = ctx.chat.id;
    const state = await UserStateModel.findOne({ userId });


    if (!state || !state.step) {
      await ctx.reply(
        "Please start a process first by selecting an option from the menu."
      );
      return;
    }

    try {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

      // Get file path
      const userId = ctx.chat.id;
      const userName = ctx.from?.username;
      const state = await UserStateModel.findOne({ userId });

      if (!state || !state.step) {
        await ctx.reply(
          "Please start a process first by selecting an option from the menu."
        );
        return;
      }

      // Download the image
      const file = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data);

      // Upload the image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "Bot_Uploads" },
        async (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            await ctx.reply("Failed to upload image to Cloudinary.");
            return;
          }

          if (!result) {
            console.error("No result returned from Cloudinary");
            await ctx.reply("Failed to upload image to Cloudinary.");
            return;
          }

          // Save the image to MongoDB
          let savedDocument;
          switch (state.step) {

            case "awaiting_profile_screenshot":
              savedDocument = await ImageModel.findOneAndUpdate(
                { UserId: userId.toString() },
                {
                  UserId: userId.toString(),
                  UserName: userName,
                  Profile_Image: result.secure_url,
                },
                { upsert: true, new: true } // Create new if not exists
              );
              state.step = "awaiting_ton_transaction_screenshot";
              await state.save();
              await ctx.reply(
                "Profile screenshot received. Now, upload a screenshot of your TON transaction."
              );
              break;

            case "awaiting_ton_transaction_screenshot":
              savedDocument = await ImageModel.findOneAndUpdate(
                { UserId: userId.toString() },
                {
                  TonTransactionImage: result.secure_url,
                },
                { new: true } // Update only
              );
              state.step = "awaiting_ton_hash";
              await state.save();
              await ctx.reply(
                "TON transaction screenshot received. Please provide the TON transaction hash."
              );
              break;

            case "awaiting_issue_screenshot":
              savedDocument = await TicketModel.findOneAndUpdate(
                { UserId: userId.toString() },
                {
                  UserId: userId.toString(),
                  Issue_Image: result.secure_url,
                  TickitId: TicketId,
                },
                { upsert: true, new: true } // Create new if not exists
              );
              state.step = "awaiting_issue_details";
              await state.save();
              await ctx.reply(
                "Issue screenshot received. Please provide details about the issue."
              );
              break;

            default:
              if (state.step === "awaiting_ton_hash") {
                await ctx.reply(
                  `Wrong Input. Please provide the TON transaction hash in text.`
                );

              }
              else if (state.step === "awaiting_issue_details") {
                await ctx.reply(
                  `You have already uploaded the issue screenshot. Please provide details about the issue.`
                );
              }

              else {
                await ctx.reply(
                  "You have already uploaded the profile screenshot. Please proceed with the next step."
                );
              }

          }

          console.log("Updated document:", savedDocument);
        }
      );

      uploadStream.end(imageBuffer);
    } catch (error) {
      console.error("Error handling photo:", error);
      await ctx.reply("Failed to save the image.");
    }
  });

  // Unified Text Handler

  bot.on("text", async (ctx) => {
    const userId = ctx.chat.id;
    let state = await UserStateModel.findOne({ userId });

    // If no state exists, create a default one
    if (!state) {
      state = new UserStateModel({ userId, step: null, photoUrls: [] });
    }

    if (!state.step) {
      // Handle specific keywords outside the process
      switch (ctx.message.text.toLowerCase()) {
        case "feedback":
          state.step = "feedback";
          await state.save();
          await ctx.reply(
            "Please provide your feedback on the Rats Kingdom platform. Your feedback is valuable to us."
          );
          break;

        default:
          await ctx.reply("Please use the menu options or type /start to begin.");
          break;
      }
      return;
    }

    // Handle state-driven workflows
    switch (state.step) {
      case "awaiting_ton_hash": {


        if (!ctx.message.text || "") {
          await ctx.reply("Please provide the TON transaction hash in words.");
          return;
        }
        console.log("TON Hash:", ctx.message.text);

        const tonHash = ctx.message.text;

        // Update the TON hash in the database
        const savedDocument = await ImageModel.findOneAndUpdate(
          { UserId: userId.toString() },
          { TonTransactionHash: tonHash },
          { new: true }
        );

        console.log("Updated document:", savedDocument);

        await ctx.replyWithMarkdown(
          `*TON transaction hash received.* \n\n*${ctx.from.first_name.toUpperCase()}*\n\nWe have received your request regarding the TON transaction issue. Our team will review the information provided and resolve your issue if it is genuine.\n\nThank you for your patience.`
        );

        // Reset state in database
        state.step = ""
        await state.save();
        break;
      }

      case "feedback": {
        const feedback = ctx.message.text;

        console.log("Feedback:", feedback);
        console.log(`userName: ${ctx.from?.username}`);

        // Save feedback to the database
        const savedDocument = await ImageModel.findOneAndUpdate(
          { UserId: userId.toString() },
          { UserFeedback: feedback },
          { upsert: true, new: true }
        );

        console.log("Saved feedback document:", savedDocument);

        await ctx.replyWithMarkdown(
          `*Feedback received.* \n\n*${ctx.from.first_name.toUpperCase()}*\n\nThank you for providing your feedback. We appreciate your input and will use it to improve the Rats Kingdom platform.\n\nWe look forward to serving you better in the future.`
        );

        // Reset state in database
        state.step = "null";
        await state.save();
        break;
      }

      case "awaiting_issue_details": {
        const issueDetails = ctx.message.text;

        // Update the issue details in the database
        const savedDocument = await TicketModel.findOneAndUpdate(
          { UserId: userId.toString() },
          { IssueDetails: issueDetails },
          { upsert: true, new: true }
        );

        console.log("Updated document:", savedDocument);

        await ctx.replyWithMarkdown(
          `*Issue details received.* \n\n*${ctx.from.first_name.toUpperCase()}*\n\nWe have received your request regarding the issue. Our team will review the information provided and resolve your issue if it is genuine.\n\nThank you for your patience.`
        );

        // Reset state in database
        state.step = "null";
        await state.save();
        break;
      }

      default:

        if (state.step === "awaiting_issue_screenshot") {
          await ctx.reply(
            `Wrong Input. Please upload a screenshot or photo related to your issue. If you don't have any image please type the '/skip' command.`
          );
        }
        
        else if (state.step === "awaiting_profile_screenshot") {
          await ctx.reply(
            `wrong Input. Please upload a screenshot of your profile page showing the verification issue.`
          );
        }

        else if (state.step === "awaiting_ton_transaction_screenshot") {
          await ctx.reply(
            `Wrong Input. Please upload a screenshot of your TON transaction.`
          );
        }
        
        else {
          await ctx.reply("Unexpected input. Please restart the process by typing /start.");
        }

        break;
    }
  });


  // Command: /cancel
  bot.command("cancel", async (ctx) => {
    await resetUserState(ctx.chat.id);
    ctx.reply(
      "Process canceled. You can start over by typing /start.",
      mainMenu
    );
  });

  // Fallback: Handle unmatched messages
  bot.on("text", (ctx) => {
    ctx.reply("Please use the menu options or type /start to begin.line-316");
  });

  // Start the bot
  bot.launch();
  console.log("Bot is up and running!");

  // Enable graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export default createBot;
