import cron from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import { db } from '../database/db.js';
import { config } from '../config.js';

/**
 * Inicializa o serviço de verificação dos Timers de Alts dos jogadores.
 * @param {import('discord.js').Client} client 
 */
export function initAltTimerChecker(client) {
  console.log('⏰ [ALT TIMER] Serviço de notificação de timers de Alts ativado.');

  // Verifica a cada minuto se algum timer expirou
  cron.schedule('* * * * *', async () => {
    await checkExpiredAltTimers(client);
  }, {
    timezone: 'America/Sao_Paulo'
  });
}

/**
 * Varre todos os timers cadastrados e notifica o jogador quando o tempo zerar
 */
async function checkExpiredAltTimers(client) {
  const timers = db.getAltTimers();
  const now = new Date();

  const expiredTimers = timers.filter(t => new Date(t.expiresAtISO) <= now && !t.notified);

  for (const timer of expiredTimers) {
    try {
      const user = await client.users.fetch(timer.userId);
      const dmEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🔔 SEU TIMER DE ALT ZEROU!')
        .setDescription(`Olá <@${timer.userId}>!\nO tempo de cooldown do seu **${timer.altName}** (Slot ${timer.slot}) finalizou!\n\n🎉 **Você já pode criar um novo alt na sua conta!**`)
        .setTimestamp()
        .setFooter({ text: 'NC Bot • Gerenciador de Alts NC' });

      let dmSent = false;

      // 1. Tenta enviar mensagem privada (DM) direto para a pessoa
      try {
        await user.send({ embeds: [dmEmbed] });
        dmSent = true;
        console.log(`✅ [ALT TIMER] DM de conclusão enviada para ${user.tag} (Slot ${timer.slot}).`);
      } catch (dmErr) {
        // DM fechada pelo usuário, fallback para mensagem no canal marcando o usuário
        dmSent = false;
      }

      // 2. Se a DM falhar (mensagens diretas desativadas), posta no canal exclusivo marcando a pessoa
      if (!dmSent) {
        const channel = await client.channels.fetch(config.altTimerChannelId);
        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `🔔 **AVISO DE ALT LIBERADO!** <@${timer.userId}>, o cooldown do seu **${timer.altName}** (Slot ${timer.slot}) zerou! Você já pode criar seu alt!`,
            embeds: [dmEmbed]
          });
          console.log(`📢 [ALT TIMER] Aviso enviado no canal <#${config.altTimerChannelId}> para ${user.tag}.`);
        }
      }

      // Marca o timer como notificado para não reenviar
      timer.notified = true;
      db.updateAltTimer(timer);

    } catch (err) {
      console.error(`Erro ao notificar conclusão do Alt Timer (${timer.userId} - Slot ${timer.slot}):`, err);
    }
  }
}
