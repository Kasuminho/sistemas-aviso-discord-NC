import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../database/db.js';
import { createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('consultar-status')
  .setDescription('Consulta o último print de status registrado de um jogador')
  .addUserOption(option =>
    option.setName('jogador')
      .setDescription('Selecione o jogador para consultar os status (Opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('jogador') || interaction.user;
  const statusData = db.getLatestPlayerStatus(targetUser.id);

  if (!statusData) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Nenhum Status Registrado',
        `O jogador <@${targetUser.id}> ainda não registrou nenhum print de status.\nUse \`/registrar-status\` para enviar um print.`
      )],
      ephemeral: true
    });
  }

  const timestampUnix = Math.floor(new Date(statusData.updatedAtISO).getTime() / 1000);

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📊 STATUS DE ${targetUser.username.toUpperCase()}`)
    .setDescription(`Último print registrado em <t:${timestampUnix}:F> (<t:${timestampUnix}:R>)`)
    .setImage(statusData.imageUrl)
    .setTimestamp()
    .setFooter({ text: 'NC Bot • OCR Status Tracker' });

  const detectedFields = [];
  if (statusData.parsedStats?.nick) detectedFields.push(`👤 **Nick:** ${statusData.parsedStats.nick}`);
  if (statusData.parsedStats?.level) detectedFields.push(`⭐ **Nível:** ${statusData.parsedStats.level}`);
  if (statusData.parsedStats?.power) detectedFields.push(`⚔️ **Poder:** ${statusData.parsedStats.power}`);
  if (statusData.parsedStats?.gold) detectedFields.push(`💰 **Ouro:** ${statusData.parsedStats.gold}`);

  if (detectedFields.length > 0) {
    embed.addFields({
      name: '📊 Status Detectados',
      value: detectedFields.join('\n'),
      inline: false
    });
  }

  const textSnippet = statusData.rawText.length > 500 ? statusData.rawText.substring(0, 500) + '...' : statusData.rawText;
  embed.addFields(
    { name: '🔍 Texto Lido via OCR', value: `\`\`\`text\n${textSnippet}\n\`\`\``, inline: false },
    { name: '📝 Observação', value: statusData.observacao || 'Sem observação.', inline: false }
  );

  await interaction.reply({
    embeds: [embed]
  });
}
