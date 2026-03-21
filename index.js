const { Telegraf, Markup } = require("telegraf");
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = [1388617888];

const XT_LINK = "https://www.xtfarsi.site/en/activity/andy1117?ref=1GRPPT";
const COMMUNITY_LINK = "https://t.me/Nexxtrade_io";
const COMMUNITY_USERNAME = "@Nexxtrade_io";
const PERFORMANCE_LINK = "https://www.nexxtrade.io/performance";
const PAYMENT_BOT_USERNAME = "NexxTrade_bot";
const X_LINK = "https://x.com/NexxTrade_io";

const bot = new Telegraf(BOT_TOKEN);

// Simple in-memory stores
const users = new Set();
const awaitingUid = new Set();
const userUids = new Map();
const userPlans = new Map(); // Tracks selected plan per user
const adminBroadcasting = new Set();

/* ================= START ================= */

bot.start(async (ctx) => {
  const name = ctx.from.first_name;
  users.add(ctx.from.id);

  await ctx.reply(
    `Hey ${name}, welcome to NexxTrade 👋\n\n` +
    `You Are About to Gain Access to The Best Crypto Research & Signal Network.\n\n` +
    `We Help Traders to:\n` +
    `📊 Catch High-probability Set-ups\n` +
    `🧠 Size positions correctly\n` +
    `📈 Trade with structure\n` +
    `💰 Access 2–3 quality signals daily\n` +
    `📚 Join live trading sessions & Q&As\n\n` +
    `To access our signals, click below to complete the short steps.`,
    Markup.inlineKeyboard([
      [Markup.button.callback("▶️ Continue", "CONTINUE")]
    ])
  );
});

/* ================= CONTINUE ================= */

bot.command("continue", async (ctx) => {
  await sendContinue(ctx);
});

bot.action("CONTINUE", async (ctx) => {
  await ctx.answerCbQuery();
  await sendContinue(ctx);
});

async function sendContinue(ctx) {
  await ctx.reply(
    `How To Get Our Signals 👇\n\n` +
    `Step 1️⃣ Register on XT Exchange\n` +
    `Step 2️⃣ Submit your UID\n` +
    `Step 3️⃣ Follow Nexxtrade on X (Twitter)\n` +
    `Step 4️⃣ Join our Trading community`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🔗 Register on XT", "WHY_XT")]
    ])
  );
}

/* ================= WHY XT (triggered by Register on XT button) ================= */

bot.action("WHY_XT", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `Why XT? 🏦\n\n` +
    `• XT puts its users first\n` +
    `• No failed Limit orders\n` +
    `• No failed SLs\n` +
    `• No failed TPs\n` +
    `• Deep liquidity\n` +
    `• Fast execution\n` +
    `• Wide futures pairs\n` +
    `• Proper Risk management tools`,
    Markup.inlineKeyboard([
      [Markup.button.url("🔗 Register on XT", XT_LINK)],
      [Markup.button.callback("✅ I've Registered", "REGISTERED")]
    ])
  );
});

/* ================= REGISTERED (UID REQUEST) ================= */

bot.action("REGISTERED", async (ctx) => {
  await ctx.answerCbQuery();
  awaitingUid.add(ctx.from.id);

  await ctx.reply(
    `✅ Great! Now, please type and send your XT UID.\n\n` +
    `You can find this in your XT Account Profile settings.`
  );
});

/* ================= FOLLOW ON X ================= */

bot.action("FOLLOW_X", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `3️⃣ Follow <a href="${X_LINK}">Nexxtrade on X</a> to stay updated with market insights, trade ideas & announcements.\n\n` +
    `👇 Click below to follow, then confirm.`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.url("🐦 Follow @NexxTrade_io on X", X_LINK)],
        [Markup.button.callback("✅ I've Followed", "FOLLOWED_X")]
      ])
    }
  );
});

bot.action("FOLLOWED_X", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `🙌 Thanks for following us on X!\n\n` +
    `Last Step: Join our Telegram to get access to live market updates and Alerts 🚨`,
    Markup.inlineKeyboard([
      [Markup.button.url("🚀 Join NexxTrade Community", COMMUNITY_LINK)],
      [Markup.button.callback("✅ I've Joined", "JOINED")]
    ])
  );
});

/* ================= JOINED (VERIFICATION) ================= */

bot.action("JOINED", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;

  if (!userUids.has(userId)) {
    return ctx.reply("Please submit your XT UID first by clicking /continue.");
  }

  try {
    const member = await ctx.telegram.getChatMember(COMMUNITY_USERNAME, userId);
    const isValid = ["member", "administrator", "creator"].includes(member.status);

    if (isValid) {
      await ctx.reply(
        `✅ Membership verified! You're now part of the NexxTrade ecosystem.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("📊 View Performance", "PERFORMANCE")],
          [Markup.button.callback("Subscribe to Our Signals 📊", "SUBSCRIBE")]
        ])
      );
    } else {
      await ctx.reply(
        "❌ Verification failed. You haven't joined the group yet.",
        Markup.inlineKeyboard([
          [Markup.button.url("🚀 Join NexxTrade Community", COMMUNITY_LINK)],
          [Markup.button.callback("✅ I've Joined", "JOINED")]
        ])
      );
    }
  } catch (e) {
    console.error("Verification Error:", e);
    await ctx.reply("⚠️ Error checking membership. Ensure the bot is an admin in the group.");
  }
});

/* ================= PERFORMANCE ================= */

bot.command("performance", async (ctx) => {
  await sendPerformance(ctx);
});

bot.action("PERFORMANCE", async (ctx) => {
  await ctx.answerCbQuery();
  await sendPerformance(ctx);
});

async function sendPerformance(ctx) {
  await ctx.reply(
    `Transparency matters.\n\n` +
    `NexxTrade publishes real performance:\n` +
    `• Entry prices\n` +
    `• Take profits\n` +
    `• Stop losses\n` +
    `• Win/Loss history\n\n` +
    `Click below to view verified results.`,
    Markup.inlineKeyboard([
      [Markup.button.url("📈 View Performance Dashboard", PERFORMANCE_LINK)],
      [Markup.button.callback("Subscribe to Our Signals 📊", "SUBSCRIBE")]
    ])
  );
}

/* ================= SUBSCRIBE / PLAN SELECTION ================= */

bot.command("subscribe", async (ctx) => {
  await showPlans(ctx);
});

bot.action("SUBSCRIBE", async (ctx) => {
  await ctx.answerCbQuery();
  await showPlans(ctx);
});

async function showPlans(ctx) {
  await ctx.reply(
    `Choose your NexxTrade signal plan 👇`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🟡 Monthly Access  ||  Basic", "PLAN_MONTHLY")],
      [Markup.button.callback("🟢 3 Month Access  ||  Pro", "PLAN_QUARTERLY")],
      [Markup.button.callback("🔵 6 Month Access  ||  Elite", "PLAN_ELITE")]
    ])
  );
}

/* ================= PLAN CONFIRMATION (Bot Switch Message) ================= */

bot.action(/^PLAN_(MONTHLY|QUARTERLY|ELITE)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const planKey = ctx.callbackQuery.data.replace("PLAN_", "");
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

  const planLabels = {
    MONTHLY: "Monthly Access || Basic",
    QUARTERLY: "3 Month Access || Pro",
    ELITE: "6 Month Access || Elite"
  };

  const planName = planLabels[planKey] || planKey;
  userPlans.set(userId, planKey.toLowerCase());

  // Step 1: Long welcome/pitch message
  await ctx.reply(
    `Hey ${ctx.from.first_name}, welcome to NexxTrade 👋\n\n` +
    `You Are About to Gain Access to The Best Crypto Research & Signal Network.\n\n` +
    `We Help Traders to:\n` +
    `📊 Catch High-probability Set-ups\n` +
    `🧠 Size positions correctly\n` +
    `📈 Trade with structure\n` +
    `💰 Access 2–3 quality signals daily\n` +
    `📚 Join live trading sessions & Q&As`
  );

  // Step 2: Short personalised confirmation message
  await ctx.reply(
    `Welcome ${username}! You're about to secure access to NexxTrade ${planName} Circle\n\n` +
    `Just a few clicks left\n` +
    `📊 Get 2-3 signals daily\n` +
    `🔬 Expert Analysis\n` +
    `📈 High-probability setups only\n\n` +
    `Confirm your plan to proceed 👇`,
    Markup.inlineKeyboard([
      [Markup.button.url("✅ Confirm Your Plan", `https://t.me/${PAYMENT_BOT_USERNAME}?start=pay_${planKey.toLowerCase()}`)],
      [Markup.button.callback("📊 View Performance", "PERFORMANCE")]
    ])
  );
});

/* ================= SUPPORT ================= */

bot.command("support", async (ctx) => {
  await ctx.reply("Need help?\n\nContact support: @NexxTradeSupport");
});

/* ================= BROADCAST (ADMIN) ================= */

bot.command("mass", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  adminBroadcasting.add(ctx.from.id);
  await ctx.reply(
    "📢 <b>Broadcast Mode Active</b>\n\n" +
    "Send me a <b>Photo (with caption)</b> or a <b>Text Message</b> to broadcast to all users.\n\n" +
    "• You can use HTML for links: &lt;a href='https://example.com'&gt;Text&lt;/a&gt;\n" +
    "• Type /cancel to exit mode.",
    { parse_mode: "HTML" }
  );
});

bot.command("cancel", (ctx) => {
  if (adminBroadcasting.has(ctx.from.id)) {
    adminBroadcasting.delete(ctx.from.id);
    ctx.reply("❌ Broadcast mode deactivated.");
  }
});

/* ================= UNIVERSAL TEXT/PHOTO LISTENER ================= */

bot.on(["photo", "text"], async (ctx, next) => {
  const userId = ctx.from.id;

  // 1. Handle UID submission
  if (awaitingUid.has(userId) && ctx.message.text) {
    const uidInput = ctx.message.text.trim();
    if (!/^\d+$/.test(uidInput) || uidInput.length < 5) {
      return ctx.reply("❌ That doesn't look like a valid UID. Please send your numeric XT UID.");
    }
    userUids.set(userId, uidInput);
    awaitingUid.delete(userId);
    return ctx.reply(
      `✅ UID ${uidInput} received.\n\nNext step: follow us on X to stay in the loop 👇`,
      Markup.inlineKeyboard([
        [Markup.button.url("🐦 Follow @NexxTrade_io on X", X_LINK)],
        [Markup.button.callback("✅ I've Followed", "FOLLOWED_X")]
      ])
    );
  }

  // 2. Handle Admin Broadcast
  if (adminBroadcasting.has(userId) && ADMIN_IDS.includes(userId)) {
    const broadcastMsg = ctx.message.text || ctx.message.caption || "";
    const photo = ctx.message.photo ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;

    let count = 0;
    await ctx.reply(`🚀 Sending to ${users.size} users...`);

    for (const targetId of users) {
      try {
        if (photo) {
          await ctx.telegram.sendPhoto(targetId, photo, {
            caption: broadcastMsg,
            parse_mode: "HTML"
          });
        } else {
          await ctx.telegram.sendMessage(targetId, broadcastMsg, {
            parse_mode: "HTML"
          });
        }
        count++;
      } catch (e) {
        console.error(`Could not send to ${targetId}`);
      }
    }

    adminBroadcasting.delete(userId);
    return ctx.reply(`✅ Broadcast complete! Sent to ${count} users.`);
  }

  return next();
});

/* ================= LAUNCH ================= */

bot.launch();
console.log("🚀 NexxTrade bot is live");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
