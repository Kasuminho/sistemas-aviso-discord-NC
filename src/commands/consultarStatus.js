import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../database/db.js';
import { createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('consultar-status')
  .setDescription('Consulta o status do personagem de um jogador para Boss de Guild')
  .addUserOption(option =>
    option.setName('jogador')
      .setDescription('Selecione o jogador para consultar (Opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('jogador') || interaction.user;
  const statusData = db.getLatestPlayerStatus(targetUser.id);

  if (!statusData) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Nenhum Status Registrado',
        `O jogador <@${targetUser.id}> ainda não registrou seus status.\nUse \`/registrar-status\` para registrar.`
      )],
      ephemeral: true
    });
  }

  const timestampUnix = Math.floor(new Date(statusData.updatedAtISO).getTime() / 1000);
  const s = statusData.parsedStats || {};

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`🛡️ STATUS DE ${targetUser.username.toUpperCase()}`)
    .setDescription(`Última atualização em <t:${timestampUnix}:F> (<t:${timestampUnix}:R>)`)
    .addFields(
      { name: '⭐ Nível', value: s.nivel ? `**${s.nivel}**` : 'Não informado', inline: true },
      { name: '⚔️ Dano', value: s.dano ? `**${s.dano}**` : 'Não informado', inline: true },
      { name: '🛡️ Defesa', value: s.defesa ? `**${s.defesa}**` : 'Não informado', inline: true },
      { name: '🎯 Acerto Geral', value: s.acerto ? `**${s.acerto}**` : 'Não informado', inline: true },
      { name: '🐉 Acerto em JvA', value: s.acertoJvA ? `**${s.acertoJvA}**` : 'Não informado', inline: true },
      { name: '🛡️ Defesa em JvA', value: s.defesaJvA ? `**${s.defesaJvA}**` : 'Não informado', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Acompanhamento de Boss de Guild' });

  if (statusData.imageUrl) {
    embed.setImage(statusData.imageUrl);
  }

  if (statusData.observacao) {
    embed.addFields({ name: '📝 Observação', value: statusData.observacao, inline: false });
  }

  await interaction.reply({
    embeds: [embed]
  });
}
