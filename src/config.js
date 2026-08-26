import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  staffRoleId: process.env.STAFF_ROLE_ID || '1526370359652122826',
  eventRoleId: process.env.EVENT_ROLE_ID || '1525526128725459065',
  announcementChannelId: process.env.ANNOUNCEMENT_CHANNEL_ID || '',
  altTimerChannelId: process.env.ALT_TIMER_CHANNEL_ID || '1527700863345229834',
  voiceCategoryId: process.env.VOICE_CATEGORY_ID || '1525526402500395189',
  afkChannelId: process.env.AFK_CHANNEL_ID || '',
  muteTimeoutMinutes: parseInt(process.env.MUTE_TIMEOUT_MINUTES || '10', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  allowedUserId: process.env.ALLOWED_USER_ID || '1526370359652122826',
  adminKey: process.env.ADMIN_KEY || 'raven123',
  sessionSecret: process.env.SESSION_SECRET || 'secret_nc_session_token_key_123',
  timezone: 'America/Sao_Paulo' // GMT-3
};

export function validateConfig() {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('CLIENT_ID');
  
  if (missing.length > 0) {
    console.error(`❌ [ERRO] As seguintes variáveis são obrigatórias no arquivo .env: ${missing.join(', ')}`);
    process.exit(1);
  }
}
