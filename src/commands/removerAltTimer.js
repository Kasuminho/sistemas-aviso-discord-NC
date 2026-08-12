import { SlashCommandBuilder } from 'discord.js';
import { checkGuildMemberAndChannel } from '../middleware/checkGuildMemberAndChannel.js';
import { db } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('alt-timer-remover')
  .setDescription('Remove ou limpa o timer de um dos seus 3 slots de Alt')
  .addIntegerOption(option =>
    option.setName('slot')
      .setDescription('Escolha o slot do Alt para remover (1, 2 ou 3)')
      .setRequired(true)
      .addChoices(
        { name: 'Slot 1', value: 1 },
        { name: 'Slot 2', value: 2 },
        { name: 'Slot 3', value: 3 }
      )
  );

export async function execute(interaction) {
  if (!(await checkGuildMemberAndChannel(interaction))) return;

  const slot = interaction.options.getInteger('slot');
  const removed = db.removeAltTimer(interaction.user.id, slot);

  if (removed) {
    await interaction.reply({
      embeds: [createSuccessEmbed('Slot Liberado', `O timer do **Slot ${slot}** foi removido com sucesso.`)],
      ephemeral: true
    });
  } else {
    await interaction.reply({
      embeds: [createErrorEmbed('Slot Vazio', `Você não possui nenhum timer cadastrado no **Slot ${slot}**.`)],
      ephemeral: true
    });
  }
}
