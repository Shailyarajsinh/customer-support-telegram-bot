import { RateLimitModel } from './models/RateLimit.model'; // Adjust the path to your model file

export const isRateLimited = async (userId: string, cooldown: number, ctx: any) => {
  const now = new Date();

  // Fetch user's rate limit record
  let record = await RateLimitModel.findOne({ userId });

  if (record) {
    // Check if the user is in the block period
    if (record.blockedUntil && now < record.blockedUntil) {
      const timeRemaining = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);

      // Notify if no recent notification was sent (e.g., within the last 10 seconds)
      const shouldNotify = !record.lastNotification || now.getTime() - record.lastNotification.getTime() > 10000;
      if (shouldNotify) {
        record.lastNotification = now;
        await record.save();
        return { blocked: true, notify: true, secondsRemaining: timeRemaining };
      }

      return { blocked: true, notify: false, secondsRemaining: timeRemaining };
    }

    // Handle unblocking logic
    if (record.blockedUntil && now >= record.blockedUntil) {
      record.blockedUntil = null; // Remove the block
      record.commandCount = 0; // Reset command count
      record.lastNotification = null; // Reset last notification
      await record.save();

      // Notify user that they are unblocked
      if (ctx) {
        await ctx.reply(
          "You have been unblocked. You can now send commands again. Please avoid spamming!"
        );
      }
    }

    // Increment command count and check for spamming
    record.commandCount = (record.commandCount || 0) + 1;

    if (record.commandCount > 5) {
      // Block the user for 30 seconds if spamming
      record.blockedUntil = new Date(now.getTime() + 30 * 1000); // Block for 30 seconds
      record.commandCount = 0; // Reset command count
      record.lastNotification = now; // Set notification time
      await record.save();
      return { blocked: true, notify: true, secondsRemaining: 30 };
    }

    // Check if the user is rate-limited (cooldown)
    const timeSinceLastInteraction = now.getTime() - new Date(record.lastInteraction).getTime();
    if (timeSinceLastInteraction < cooldown) {
      record.ignoreUntil = new Date(now.getTime() + cooldown);
      await record.save();
      return { rateLimited: true, notify: false };
    }
  } else {
    // Create a new record if the user doesn't exist
    record = new RateLimitModel({
      userId,
      lastInteraction: now,
      commandCount: 1,
    });
  }

  // Update the last interaction time
  record.lastInteraction = now;
  await record.save();

  return { blocked: false, rateLimited: false };
};
