import cron from 'node-cron';
import { DateTime } from 'luxon';
import { db } from '../database/db.js';
import { createEventEmbed } from '../utils/embeds.js';
import { config } from '../config.js';

/**
 * Inicializa o serviço de agendamento de avisos (Cron jobs)
 * @param {import('discord.js').Client} client 
 */
export function initScheduler(client) {
  console.log('⏰ [SCHEDULER] Serviço de agendamento inicializado (Fuso: GMT-3 / America/Sao_Paulo).');

  // 1. Cron Job Diário às 15:00 GMT-3
  cron.schedule('0 15 * * *', async () => {
    console.log('📢 [SCHEDULER] Executando aviso diário das 15:00 GMT-3...');
    await sendDaily15hAnnouncements(client);
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // 2. Cron Job Minuto a Minuto para avisos de 4h, 1h e 30 min antes do evento
  cron.schedule('* * * * *', async () => {
    await checkEventReminders(client);
  }, {
    timezone: 'America/Sao_Paulo'
  });
}

/**
 * Envia os avisos diários das 15:00 GMT-3 para todos os eventos futuros
 */
async function sendDaily15hAnnouncements(client) {
  const events = db.getEvents();
  const now = DateTime.now().setZone('America/Sao_Paulo');

  const futureEvents = events.filter(e => {
    const eventTime = DateTime.fromISO(e.dateTimeISO).setZone('America/Sao_Paulo');
    return eventTime > now;
  });

  for (const event of futureEvents) {
    const channelId = event.channelId || config.announcementChannelId;
    if (!channelId) continue;

    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        const embed = createEventEmbed(event, 'DAILY_15H');
        await channel.send({
          content: `📢 **[AVISO DIÁRIO]** Lembrete de evento para <@&${config.eventRoleId}>!`,
          embeds: [embed]
        });
      }
    } catch (err) {
      console.error(`Erro ao enviar aviso das 15:00 para o evento ${event.id}:`, err);
    }
  }
}

/**
 * Verifica eventos que precisam de avisos de 4h, 1h e 30m
 */
async function checkEventReminders(client) {
  const events = db.getEvents();
  const now = DateTime.now().setZone('America/Sao_Paulo');

  for (const event of events) {
    const eventTime = DateTime.fromISO(event.dateTimeISO).setZone('America/Sao_Paulo');
    const diffMinutes = Math.floor(eventTime.diff(now, 'minutes').minutes);

    // Se o evento já passou há mais de 10 minutos, pula
    if (diffMinutes < -10) continue;

    const channelId = event.channelId || config.announcementChannelId;
    if (!channelId) continue;

    let noticeType = null;
    let pingText = `📢 <@&${config.eventRoleId}>`;

    // Aviso de 4 horas antes (janela de 210 a 245 minutos)
    if (diffMinutes <= 240 && diffMinutes > 210 && !event.notified4h) {
      noticeType = 'REMINDER_4H';
      pingText = `⏰ **[LEMBRETE 4H]** O evento começa em 4 horas! <@&${config.eventRoleId}>`;
      event.notified4h = true;
    }
    // Aviso de 1 hora antes (janela de 45 a 65 minutos)
    else if (diffMinutes <= 60 && diffMinutes > 45 && !event.notified1h) {
      noticeType = 'REMINDER_1H';
      pingText = `🔥 **[LEMBRETE 1H]** O evento começa em 1 hora! <@&${config.eventRoleId}>`;
      event.notified1h = true;
    }
    // Aviso de 30 minutos antes (janela de 5 a 35 minutos)
    else if (diffMinutes <= 30 && diffMinutes > 5 && !event.notified30m) {
      noticeType = 'REMINDER_30M';
      pingText = `🚨 **[LEMBRETE 30M]** O EVENTO COMEÇA EM 30 MINUTOS! <@&${config.eventRoleId}>`;
      event.notified30m = true;
    }

    if (noticeType) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const embed = createEventEmbed(event, noticeType);
          await channel.send({
            content: pingText,
            embeds: [embed]
          });
          db.updateEvent(event);
          console.log(`✅ [SCHEDULER] Lembrete ${noticeType} enviado para evento ${event.id}`);
        }
      } catch (err) {
        console.error(`Erro ao enviar lembrete ${noticeType} para evento ${event.id}:`, err);
      }
    }
  }
}
