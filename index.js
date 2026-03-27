const { Telegraf, Markup } = require("telegraf");
const { Pool } = require("pg");
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL; // Render provides this automatically
const ADMIN_IDS = [1388617888];

const XT_LINK = "https://www.xtfarsi.site/en/activity/andy1117?ref=1GRPPT";
const COMMUNITY_LINK = "https://t.me/Nexxtrade_io";
const COMMUNITY_USERNAME = "@Nexxtrade_io";
const PERFORMANCE_LINK = "https://www.nexxtrade.io/performance";
const PAYMENT_BOT_USERNAME = "NexxTrade_bot";
const X_LINK = "https://x.com/NexxTrade_io";

const bot = new Telegraf(BOT_TOKEN);

// In-memory state (session tracking only — not persisted)
const awaitingUid = new Set();
const userUids = new Map();
const adminBroadcasting = new Set();

/* ================= DATABASE ================= */

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render PostgreSQL
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
  console.log("✅ Database table ready");
}

// Upsert user — inserts on first visit, updates fields on return visits
async function saveUser(from, chatId) {
  await pool.query(
    `INSERT INTO users (user_id, chat_id, first_name, last_name, username, language_code, is_bot, is_premium, last_seen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       chat_id       = EXCLUDED.chat_id,
       first_name    = EXCLUDED.first_name,
       last_name     = EXCLUDED.last_name,
       username      = EXCLUDED.username,
       language_code = EXCLUDED.language_code,
       is_bot        = EXCLUDED.is_bot,
       is_premium    = EXCLUDED.is_premium,
       last_seen     = NOW()`,
    [
      from.id,
      chatId,
      from.first_name || null,
      from.last_name || null,
      from.username || null,
      from.language_code || null,
      from.is_bot || false,
      from.is_premium || false
    ]
  );
}

// Fetch all chat_ids from DB for broadcasting
async function getAllChatIds() {
  const result = await pool.query("SELECT chat_id FROM users");
  return result.rows.map(r => r.chat_id);
}

/* ================= START ================= */

bot.start(async (ctx) => {
  const name = ctx.from.first_name;

  await saveUser(ctx.from, ctx.chat.id);

  await ctx.reply(
    `Hey ${name}, welcome to NexxTrade 👋\n\n` +
    `You Are About to Gain Access to The Best Crypto Research & Signal Network.\n\n` +
    `We Help Traders to:\n` +
    `📊 Catch High-probability Set-ups\n` +
    `🧠 Size positions correctly\n` +
    `📈 Trade with structure\n` +
    `💰 Access 2–3 quality signals daily\n` +
    `📚 Join live trading sessions & Q&As\n\n` +
    `To access our signals, click below to complete the short steps👇.`,
    Markup.inlineKeyboard([
      [Markup.button.callback("▶️ Continue", "CONTINUE")]
    ])
  );
});

/* ================= CONTINUE ================= */

bot.command("continue", async (ctx) => {
  await saveUser(ctx.from, ctx.chat.id);
  await sendContinue(ctx);
});

bot.action("CONTINUE", async (ctx) => {
  await ctx.answerCbQuery();
  await saveUser(ctx.from, ctx.chat.id);
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

/* ================= WHY XT ================= */

bot.action("WHY_XT", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `Why We Choose XT? 🚀\n\n` +
    `• XT puts its users first\n` +
    `• No failed Limit orders\n` +
    `• No failed SLs\n` +
    `• No failed TPs\n\n` +
    `• Deep liquidity\n` +
    `• Fast execution\n` +
    `• Proper Risk management tools\n\n` +
    `All our Signals are XT-integrated.\n\n` +
    `Register on XT: <a href="${XT_LINK}">${XT_LINK}</a>`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.url("🔗 Register on XT", XT_LINK)],
        [Markup.button.callback("✅ Proceed", "REGISTERED")]
      ])
    }
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
        `✅ Congratulation, you are now on your way to being a part of NexxTrade trading ecosystem.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("📊 View Past Performance", "PERFORMANCE")],
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
    `Click below to view verified results. 👇 `,
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
    `Choose your preferred plan 👇`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🟡 Monthly Access  ||  Basic", "PLAN_MONTHLY")],
      [Markup.button.callback("🟢 3 Month Access  ||  Pro", "PLAN_QUARTERLY")],
      [Markup.button.callback("🔵 6 Month Access  ||  Elite", "PLAN_ELITE")]
    ])
  );
}

/* ================= PLAN SELECTION — direct to payment bot ================= */

bot.action(/^PLAN_(MONTHLY|QUARTERLY|ELITE)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const planKey = ctx.callbackQuery.data.replace("PLAN_", "").toLowerCase();

  await ctx.reply(
    `Redirecting you to the payment bot... 💳`,
    Markup.inlineKeyboard([
      [Markup.button.url("💳 Complete Payment", `https://t.me/${PAYMENT_BOT_USERNAME}?start=pay_${planKey}`)]
    ])
  );
});

/* ================= SUPPORT ================= */

bot.command("support", async (ctx) => {
  await ctx.reply("Need help?\n\nContact support: @NexxTradeSupport");
});

/* ================= ADMIN: USER COUNT ================= */

bot.command("users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;
  const result = await pool.query("SELECT COUNT(*) FROM users");
  const count = result.rows[0].count;
  await ctx.reply(`👥 Total users in database: ${count}`);
});

/* ================= BROADCAST (ADMIN) ================= */

bot.command("mass", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  adminBroadcasting.add(ctx.from.id);
  const result = await pool.query("SELECT COUNT(*) FROM users");
  const count = result.rows[0].count;

  await ctx.reply(
    `📢 <b>Broadcast Mode Active</b>\n\n` +
    `You have <b>${count} users</b> in the database.\n\n` +
    `Send me a <b>Photo (with caption)</b> or a <b>Text Message</b> to broadcast to all of them.\n\n` +
    `• You can use HTML for links: &lt;a href='https://example.com'&gt;Text&lt;/a&gt;\n` +
    `• Type /cancel to exit mode.`,
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

    // Persist XT UID to PostgreSQL
    await pool.query(
      "UPDATE users SET xt_uid = $1 WHERE user_id = $2",
      [uidInput, userId]
    );

    return ctx.reply(
      `✅ UID ${uidInput} received.\n\nNext step: follow us on X to stay in the loop 👇`,
      Markup.inlineKeyboard([
        [Markup.button.url("🐦 Follow @NexxTrade_io on X", X_LINK)],
        [Markup.button.callback("✅ I've Followed", "FOLLOWED_X")]
      ])
    );
  }

  // 2. Handle Admin Broadcast — reads all chat_ids from PostgreSQL
  if (adminBroadcasting.has(userId) && ADMIN_IDS.includes(userId)) {
    const broadcastMsg = ctx.message.text || ctx.message.caption || "";
    const photo = ctx.message.photo ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;

    const chatIds = await getAllChatIds();
    let count = 0;
    let failed = 0;

    await ctx.reply(`🚀 Broadcasting to ${chatIds.length} users...`);

    for (const chatId of chatIds) {
      try {
        if (photo) {
          await ctx.telegram.sendPhoto(chatId, photo, {
            caption: broadcastMsg,
            parse_mode: "HTML"
          });
        } else {
          await ctx.telegram.sendMessage(chatId, broadcastMsg, {
            parse_mode: "HTML"
          });
        }
        count++;
      } catch (e) {
        failed++;
        console.error(`Could not send to chat_id ${chatId}:`, e.message);
      }
    }

    adminBroadcasting.delete(userId);
    return ctx.reply(
      `✅ Broadcast complete!\n\n` +
      `• Delivered: ${count}\n` +
      `• Failed: ${failed}`
    );
  }

  return next();
});

/* ================= LAUNCH ================= */

initDB().then(() => {
  bot.launch();
  console.log("🚀 NexxTrade bot is live");
}).catch(err => {
  console.error("❌ Failed to initialise database:", err);
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
