import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('listar-eventos')
  .setDescription('[STAFF] Lista todos os eventos agendados ativos');

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const events = db.getEvents();
  const now = new Date();

  // Filtra apenas eventos futuros e ordena por data mais próxima
  const futureEvents = events
    .filter(e => new Date(e.dateTimeISO) > now)
    .sort((a, b) => new Date(a.dateTimeISO) - new Date(b.dateTimeISO));

  if (futureEvents.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📅 Eventos Agendados')
      .setDescription('Não há nenhum evento agendado no momento.')
      .setTimestamp();

    return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📅 Eventos Agendados (${futureEvents.length})`)
    .setDescription('Lista de eventos programados e que receberão lembretes automáticos:')
    .setTimestamp();

  futureEvents.forEach(e => {
    const timestamp = Math.floor(new Date(e.dateTimeISO).getTime() / 1000);
    embed.addFields({
      name: `🆔 \`${e.id}\` - ${e.title}`,
      value: `📅 **Data:** <t:${timestamp}:F> (<t:${timestamp}:R>)\n📢 **Canal:** <#${e.channelId}>\n📝 **Descrição:** ${e.description}`,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
