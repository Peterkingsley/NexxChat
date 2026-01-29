const { Telegraf, Markup } = require("telegraf");
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = [123456789];

const XT_LINK = "https://www.xtfarsi.site/pro/en/accounts/register?ref=1GRPPT";
const COMMUNITY_LINK = "https://t.me/Nexxtrade_io";
const COMMUNITY_USERNAME = "@Nexxtrade_io"; // Required for membership check
const PERFORMANCE_LINK = "https://www.nexxtrade.io/performance";
const PAYMENT_BOT_USERNAME = "NexxTrade_bot"; // The bot handling payments

const bot = new Telegraf(BOT_TOKEN);

// Simple in-memory stores
const users = new Set();
const awaitingUid = new Set(); 
const userUids = new Map();    

/* ================= MENU ================= */

const mainMenu = Markup.keyboard([
  ["/start", "/performance"],
  ["/subscribe", "/support"]
]).resize();

/* ================= START ================= */

bot.start(async (ctx) => {
  const name = ctx.from.first_name;
  users.add(ctx.from.id);

  await ctx.reply(
    `Hey ${name}, welcome to NexxTrade 👋\n\n` +
    `You are about to gain access to the best crypto signal network.\n\n` +
    `We help traders to:\n` +
    `• Catch high-probability setups\n` +
    `• Size positions correctly\n` +
    `• Trade with structure\n` +
    `• Access 2–3 quality signals daily\n` +
    `• Join live trading sessions & Q&As\n\n` +
    `To access our signals, click /continue to complete the short steps.`,
    mainMenu
  );
});

/* ================= CONTINUE ================= */

bot.command("continue", async (ctx) => {
  await ctx.reply(
    `How To Get Free Signals 👇\n\n` +
    `1️⃣ Register on XT Exchange\n` +
    `2️⃣ Submit your UID\n` +
    `3️⃣ Join our community`,
    Markup.inlineKeyboard([
      [Markup.button.url("🔗 Register on XT", XT_LINK)],
      [Markup.button.callback("✅ I’ve Registered", "REGISTERED")]
    ])
  );
});

/* ================= REGISTERED (UID REQUEST) ================= */

bot.action("REGISTERED", async (ctx) => {
  await ctx.answerCbQuery();
  awaitingUid.add(ctx.from.id);

  await ctx.reply(
    `✅ Great! Now, please **type and send your XT UID** (e.g., 12345678) below.\n\n` +
    `You can find this in your XT Account Profile settings.`
  );
});

/* ================= TEXT LISTENER (UID CAPTURE) ================= */

bot.on("text", async (ctx, next) => {
  const userId = ctx.from.id;

  if (!awaitingUid.has(userId)) return next();

  const uidInput = ctx.message.text.trim();

  if (!/^\d+$/.test(uidInput) || uidInput.length < 5) {
    return ctx.reply("❌ That doesn't look like a valid UID. Please send your numeric XT UID.");
  }

  userUids.set(userId, uidInput);
  awaitingUid.delete(userId);

  await ctx.reply(
    `✅ UID ${uidInput} received.\n\n` +
    `Final step: join the NexxTrade community to activate your signals.`,
    Markup.inlineKeyboard([
      [Markup.button.url("🚀 Join NexxTrade Community", COMMUNITY_LINK)],
      [Markup.button.callback("✅ I’ve Joined", "JOINED")]
    ])
  );
});

/* ================= JOINED (WITH ACTIVE VERIFICATION) ================= */

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
        `✅ Membership verified! You’re now part of the NexxTrade ecosystem.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("📊 View Performance", "PERFORMANCE")],
          [Markup.button.callback("💳 Subscribe to Signals", "SUBSCRIBE")]
        ])
      );
    } else {
      await ctx.reply(
        "❌ Verification failed. You haven't joined the group yet.",
        Markup.inlineKeyboard([
          [Markup.button.url("🚀 Join NexxTrade Community", COMMUNITY_LINK)],
          [Markup.button.callback("✅ I’ve Joined", "JOINED")]
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
      [Markup.button.url("📈 View Performance Dashboard", PERFORMANCE_LINK)]
    ])
  );
}

/* ================= SUBSCRIBE ================= */

bot.command("subscribe", async (ctx) => {
  await showPlans(ctx);
});

bot.action("SUBSCRIBE", async (ctx) => {
  await ctx.answerCbQuery();
  await showPlans(ctx);
});

async function showPlans(ctx) {
  await ctx.reply(
    `NexxTrade offers multiple signal plans depending on your trading style.`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🟢 Monthly Plan", "PLAN_MONTHLY")],
      [Markup.button.callback("🔵 Quarterly Plan", "PLAN_QUARTERLY")],
      [Markup.button.callback("🟣 6-Month Elite Plan", "PLAN_ELITE")]
    ])
  );
}

/* ================= PLAN DETAILS & REDIRECT ================= */

bot.action(/PLAN_/, async (ctx) => {
  await ctx.answerCbQuery();
  const plan = ctx.callbackQuery.data.replace("PLAN_", "");
  
  // Format the name for the button and payload
  const planName = plan.toLowerCase();

  await ctx.reply(
    `⭐ ${plan} Signal Plan\n\n` +
    `To complete your subscription and secure your spot, please proceed to our specialized payment bot.`,
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "💳 Pay via @NexxTrade_bot", 
          `https://t.me/${PAYMENT_BOT_USERNAME}?start=pay_${planName}`
        )
      ],
      [Markup.button.callback("🔙 Back to Plans", "SUBSCRIBE")]
    ])
  );
});

/* ================= SUPPORT ================= */

bot.command("support", async (ctx) => {
  await ctx.reply("Need help?\n\nContact support: @NexxTradeSupport");
});

/* ================= MASS MESSAGE (ADMIN) ================= */

bot.command("mass", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const message = ctx.message.text.replace("/mass", "").trim();
  if (!message) return ctx.reply("Usage: /mass your message");

  for (const userId of users) {
    try {
      await ctx.telegram.sendMessage(userId, message);
    } catch (e) {}
  }
  ctx.reply("✅ Mass message sent.");
});

/* ================= LAUNCH ================= */

bot.launch();
console.log("🚀 NexxTrade bot is live");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));