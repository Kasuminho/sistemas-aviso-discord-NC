import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('cancelar-evento')
  .setDescription('[STAFF] Cancela um evento agendado pelo ID')
  .addStringOption(option =>
    option.setName('id')
      .setDescription('ID do evento (Ex: EVT-92A4)')
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const id = interaction.options.getString('id').trim().toUpperCase();
  const removed = db.removeEvent(id);

  if (removed) {
    await interaction.reply({
      embeds: [createSuccessEmbed('Evento Cancelado', `O evento com ID \`${id}\` foi removido com sucesso.`)],
      ephemeral: true
    });
  } else {
    await interaction.reply({
      embeds: [createErrorEmbed('Evento Não Encontrado', `Nenhum evento ativo foi encontrado com o ID \`${id}\`.`)],
      ephemeral: true
    });
  }
}
