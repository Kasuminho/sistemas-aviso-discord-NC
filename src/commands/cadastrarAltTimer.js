import { SlashCommandBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { checkGuildMemberAndChannel } from '../middleware/checkGuildMemberAndChannel.js';
import { db } from '../database/db.js';
import { parseDurationToMinutes, formatMinutesToHumanReadable } from '../utils/durationParser.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('alt-timer-cadastrar')
  .setDescription('Cadastra ou atualiza o timer de cooldown de criação para um dos seus 3 Alts')
  .addIntegerOption(option =>
    option.setName('slot')
      .setDescription('Escolha o slot do Alt (1, 2 ou 3)')
      .setRequired(true)
      .addChoices(
        { name: 'Slot 1', value: 1 },
        { name: 'Slot 2', value: 2 },
        { name: 'Slot 3', value: 3 }
      )
  )
  .addStringOption(option =>
    option.setName('tempo')
      .setDescription('Tempo restante até poder criar (Ex: 48h, 2d, 1d 12h, 36)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('nome_alt')
      .setDescription('Nome ou identificação do seu Alt (Ex: Mago01, Farm Ouro)')
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!(await checkGuildMemberAndChannel(interaction))) return;

  const slot = interaction.options.getInteger('slot');
  const tempoStr = interaction.options.getString('tempo');
  const nomeAlt = interaction.options.getString('nome_alt') || `Alt ${slot}`;

  const minutes = parseDurationToMinutes(tempoStr);

  if (!minutes) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Tempo Inválido',
        'Formato de tempo não reconhecido.\nExemplos válidos:\n• `48h` ou `48` (48 Horas)\n• `2d` (2 Dias)\n• `1d 12h` (1 Dia e 12 Horas)\n• `30m` (30 Minutos)'
      )],
      ephemeral: true
    });
  }

  const now = DateTime.now().setZone('America/Sao_Paulo');
  const expiresAt = now.plus({ minutes });
  const expiresAtISO = expiresAt.toJSDate().toISOString();
  const timestampUnix = Math.floor(expiresAt.toJSDate().getTime() / 1000);

  db.setAltTimer(interaction.user.id, slot, nomeAlt, expiresAtISO);

  const durationFormatted = formatMinutesToHumanReadable(minutes);

  const embed = createSuccessEmbed(
    `Timer do Alt Cadastrado (Slot ${slot})`,
    `O cooldown para o **${nomeAlt}** (Slot ${slot}) foi configurado com sucesso!\n\n` +
    `⏱️ **Duração:** ${durationFormatted}\n` +
    `📅 **Liberado em:** <t:${timestampUnix}:F> (<t:${timestampUnix}:R>)\n\n` +
    `*Você receberá um aviso (DM/Mencão) no momento exato em que zerar!*`
  );

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
