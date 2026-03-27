const { Telegraf, Markup } = require("telegraf");
const { Pool } = require("pg");
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_IDS = [1388617888];

const XT_LINK = "https://www.xtfarsi.site/en/activity/andy1117?ref=1GRPPT";
const COMMUNITY_LINK = "https://t.me/Nexxtrade_io";
const COMMUNITY_USERNAME = "@Nexxtrade_io";
const PERFORMANCE_LINK = "https://www.nexxtrade.io/performance";
const PAYMENT_BOT_USERNAME = "NexxTrade_bot";
const X_LINK = "https://x.com/NexxTrade_io";
const MINI_APP_URL = "https://t.me/NexxTrade_bot/app"; // Replace with your actual Mini App URL

const bot = new Telegraf(BOT_TOKEN);

// In-memory state
const awaitingUid = new Set();
const userUids = new Map();
const adminBroadcasting = new Set();

/* ================= DATABASE ================= */
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id       BIGINT PRIMARY KEY,
      chat_id       BIGINT NOT NULL,
      first_name    TEXT,
      last_name     TEXT,
      username      TEXT,
      language_code TEXT,
      is_bot        BOOLEAN DEFAULT FALSE,
      is_premium    BOOLEAN DEFAULT FALSE,
      xt_uid        TEXT,
      joined_at     TIMESTAMPTZ DEFAULT NOW(),
      last_seen     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function saveUser(from, chatId) {
  await pool.query(
    `INSERT INTO users (user_id, chat_id, first_name, last_name, username, language_code, is_bot, is_premium, last_seen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET last_seen = NOW()`,
    [from.id, chatId, from.first_name, from.last_name, from.username, from.language_code, from.is_bot, from.is_premium]
  );
}

/* ================= BOT MENU CONFIGURATION ================= */
// This sets the menu button next to the text input
async function setBotMenu() {
    try {
        await bot.telegram.setMyCommands([
            { command: 'open_app', description: 'Open Mini App' },
            { command: 'start', description: 'Start the Bot' },
            { command: 'get_signal', description: 'Get Signal' },
            { command: 'faq', description: 'View Frequently Asked Question' },
            { command: 'support', description: 'Contact Support' }
        ]);
    } catch (e) {
        console.error("Error setting menu:", e);
    }
}

/* ================= START & ONBOARDING ================= */

bot.start(async (ctx) => {
  const name = ctx.from.first_name;
  await saveUser(ctx.from, ctx.chat.id);

  await ctx.reply(
    `Hey ${name}, welcome to NexxTrade 👋\n\n` +
    `You are about to gain access to the best crypto signal network.\n\n` +
    `To access our signals, click the button below 👇`,
    Markup.inlineKeyboard([
      [Markup.button.callback("▶️ Continue", "CONTINUE")]
    ])
  );
});

bot.action("CONTINUE", async (ctx) => {
  await ctx.answerCbQuery();
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
});

bot.action("WHY_XT", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `Register on XT to proceed: <a href="${XT_LINK}">${XT_LINK}</a>`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.url("🔗 Register on XT", XT_LINK)],
        [Markup.button.callback("Proceed", "REGISTERED")] // Changed from "I've Registered"
      ])
    }
  );
});

bot.action("REGISTERED", async (ctx) => {
  await ctx.answerCbQuery();
  awaitingUid.add(ctx.from.id);
  await ctx.reply(`✅ Great! Now, please type and send your XT UID.\n\nYou can find this in your XT Account Profile settings.`);
});

/* ================= VERIFICATION & SUBSCRIPTION ================= */

bot.action("JOINED", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;

  // Simple membership check logic
  try {
    const member = await ctx.telegram.getChatMember(COMMUNITY_USERNAME, userId);
    const isValid = ["member", "administrator", "creator"].includes(member.status);

    if (isValid) {
      await ctx.reply(
        `Congratulation, you are now on your way to being a part of our trading network`,
        Markup.inlineKeyboard([
          [Markup.button.url("📊 View performance", PERFORMANCE_LINK)],
          [Markup.button.callback("Subscribe to our signals", "SUBSCRIBE")]
        ])
      );
    } else {
      await ctx.reply("❌ Please join the community first.", Markup.inlineKeyboard([
        [Markup.button.url("🚀 Join Community", COMMUNITY_LINK)],
        [Markup.button.callback("✅ I've Joined", "JOINED")]
      ]));
    }
  } catch (e) {
    ctx.reply("Please ensure you have joined our channel first.");
  }
});

bot.action("SUBSCRIBE", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `Choose your preferred plan`, // Simplified text
    Markup.inlineKeyboard([
      [Markup.button.callback("🟡 Monthly Access", "PLAN_MONTHLY")],
      [Markup.button.callback("🟢 3 Month Access", "PLAN_QUARTERLY")],
      [Markup.button.callback("🔵 6 Month Access", "PLAN_ELITE")]
    ])
  );
});

/* ================= MENU COMMAND HANDLERS ================= */

bot.command("open_app", (ctx) => ctx.reply("Opening NexxTrade Mini App...", Markup.inlineKeyboard([[Markup.button.url("Launch App", MINI_APP_URL)]])));

bot.command("get_signal", (ctx) => {
    ctx.reply("To access our signals, click the button below\n\n👇", 
    Markup.inlineKeyboard([[Markup.button.callback("Continue to Signals", "SUBSCRIBE")]]));
});

bot.command("faq", (ctx) => ctx.reply("Check our FAQ here: https://nexxtrade.io/faq"));

bot.command("support", (ctx) => ctx.reply("Need help?\n\nContact support: @NexxTradeSupport"));

/* ================= UID LISTENER & PERSISTENCE ================= */

bot.on("text", async (ctx, next) => {
    const userId = ctx.from.id;
    if (awaitingUid.has(userId)) {
        const uidInput = ctx.message.text.trim();
        if (!/^\d+$/.test(uidInput)) return ctx.reply("Please send a valid numeric UID.");
        
        userUids.set(userId, uidInput);
        awaitingUid.delete(userId);
        await pool.query("UPDATE users SET xt_uid = $1 WHERE user_id = $2", [uidInput, userId]);

        return ctx.reply(
            `✅ UID ${uidInput} received.\n\nNext step: join our community to verify access.`,
            Markup.inlineKeyboard([
                [Markup.button.url("🚀 Join Community", COMMUNITY_LINK)],
                [Markup.button.callback("✅ I've Joined", "JOINED")]
            ])
        );
    }
    return next();
});

/* ================= LAUNCH ================= */

initDB().then(() => {
  setBotMenu();
  bot.launch();
  console.log("🚀 NexxTrade bot is live with 'Stupidly Simple' UI");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));