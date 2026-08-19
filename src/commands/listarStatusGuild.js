import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('listar-status-guild')
  .setDescription('[STAFF] Lista todos os membros que registraram prints de status recentes');

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const list = db.getPlayerStatusList();

  if (list.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📊 Painel de Status da Guild')
      .setDescription('Nenhum jogador registrou print de status até o momento.')
      .setTimestamp();

    return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
  }

  // Ordena por atualização mais recente
  const sorted = list.sort((a, b) => new Date(b.updatedAtISO) - new Date(a.updatedAtISO));

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📊 Painel de Status da Guild (${sorted.length} Jogadores)`)
    .setDescription('Acompanhamento dos últimos prints registrados pelos membros:')
    .setTimestamp()
    .setFooter({ text: 'NC Bot • OCR Status Tracker' });

  sorted.slice(0, 25).forEach(s => {
    const timestampUnix = Math.floor(new Date(s.updatedAtISO).getTime() / 1000);
    const p = s.parsedStats || {};

    const infoList = [];
    if (p.nick) infoList.push(`Nick: **${p.nick}**`);
    if (p.level) infoList.push(`Lvl: **${p.level}**`);
    if (p.power) infoList.push(`Poder: **${p.power}**`);

    const statsSummary = infoList.length > 0 ? infoList.join(' | ') : 'Print registrado';

    embed.addFields({
      name: `👤 <@${s.userId}>`,
      value: `📊 ${statsSummary}\n📅 Atualizado: <t:${timestampUnix}:R>\n📝 Obs: ${s.observacao || 'Nenhuma'}`,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
