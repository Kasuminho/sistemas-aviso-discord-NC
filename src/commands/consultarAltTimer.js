import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { checkGuildMemberAndChannel } from '../middleware/checkGuildMemberAndChannel.js';
import { db } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('alt-timer-consultar')
  .setDescription('Consulta quanto tempo falta para poder criar um novo Alt nos seus 3 slots');

export async function execute(interaction) {
  if (!(await checkGuildMemberAndChannel(interaction))) return;

  const userTimers = db.getUserAltTimers(interaction.user.id);
  const now = new Date();

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`⏳ Seus Timers de Criação de Alt`)
    .setDescription(`Consulta de cooldown dos seus 3 slots de personagens:`)
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Gerenciador de Alts' });

  for (let slot = 1; slot <= 3; slot++) {
    const timer = userTimers.find(t => t.slot === slot);

    if (!timer) {
      embed.addFields({
        name: `🔹 Slot ${slot}`,
        value: '🟢 **Livre / Não cadastrado**\n*(Use `/alt-timer-cadastrar` para definir um cooldown neste slot)*',
        inline: false
      });
    } else {
      const expiresAt = new Date(timer.expiresAtISO);
      const timestampUnix = Math.floor(expiresAt.getTime() / 1000);

      if (expiresAt <= now) {
        embed.addFields({
          name: `🔹 Slot ${slot}: **${timer.altName}**`,
          value: `🎉 **ZERADO / LIBERADO!** Você já pode criar um novo alt nesta conta!\n*(Liberou em <t:${timestampUnix}:F>)*`,
          inline: false
        });
      } else {
        embed.addFields({
          name: `🔹 Slot ${slot}: **${timer.altName}**`,
          value: `⏱️ **Falta:** <t:${timestampUnix}:R>\n📅 **Liberado em:** <t:${timestampUnix}:F>`,
          inline: false
        });
      }
    }
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
