import { PermissionsBitField, EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

/**
 * Verifica se o usuário que enviou a interação possui o Cargo Staff ou permissão Administrador.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 * @returns {Promise<boolean>}
 */
export async function isStaff(interaction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ Este comando só pode ser utilizado dentro de um servidor!',
      ephemeral: true
    });
    return false;
  }

  const member = interaction.member;

  // Verifica se o usuário é Administrador ou se possui o cargo Staff configurado
  const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
  const hasStaffRole = member.roles.cache.has(config.staffRoleId);

  if (!hasAdmin && !hasStaffRole) {
    const embed = new EmbedBuilder()
      .setColor('#FF4B4B')
      .setTitle('⛔ Acesso Negado')
      .setDescription(`Apenas membros da equipe **Staff** (<@&${config.staffRoleId}>) possuem permissão para executar este comando.`)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

    return false;
  }

  return true;
}
