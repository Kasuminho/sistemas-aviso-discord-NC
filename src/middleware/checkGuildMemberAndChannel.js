import { PermissionsBitField, EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

/**
 * Verifica se a interação ocorreu no canal correto (1527700863345229834) 
 * e se o usuário possui o Cargo de Jogador NC (1525526128725459065) ou Staff.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 * @returns {Promise<boolean>}
 */
export async function checkGuildMemberAndChannel(interaction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ Este comando só pode ser utilizado dentro do servidor!',
      ephemeral: true
    });
    return false;
  }

  // 1. Validação de Canal Exclusivo
  if (interaction.channelId !== config.altTimerChannelId) {
    const channelEmbed = new EmbedBuilder()
      .setColor('#FF4B4B')
      .setTitle('📍 Canal Incorreto')
      .setDescription(`Estes comandos de Alt Timer só podem ser executados no canal <#${config.altTimerChannelId}>.`)
      .setTimestamp();

    await interaction.reply({
      embeds: [channelEmbed],
      ephemeral: true
    });
    return false;
  }

  // 2. Validação de Cargo (Jogador NC ou Staff ou Admin)
  const member = interaction.member;
  const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
  const hasMemberRole = member.roles.cache.has(config.eventRoleId);
  const hasStaffRole = member.roles.cache.has(config.staffRoleId);

  if (!hasAdmin && !hasMemberRole && !hasStaffRole) {
    const roleEmbed = new EmbedBuilder()
      .setColor('#FF4B4B')
      .setTitle('⛔ Acesso Negado')
      .setDescription(`Apenas jogadores com o cargo <@&${config.eventRoleId}> possuem permissão para gerenciar Alt Timers.`)
      .setTimestamp();

    await interaction.reply({
      embeds: [roleEmbed],
      ephemeral: true
    });
    return false;
  }

  return true;
}
