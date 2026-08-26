import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';
import { createErrorEmbed, createRaffleEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('sortear-item')
  .setDescription('[STAFF] Sorteia itens com filtro de elegibilidade (PC, presenca em boss e status recente)')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('Nome do item (Ex: Moedas de Ouro, VIP 30 dias)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('quantidade')
      .setDescription('Quantidade total do item a ser distribuida')
      .setMinValue(1)
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('ganhadores')
      .setDescription('Numero de ganhadores que irao dividir a quantidade total')
      .setMinValue(1)
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('participantes')
      .setDescription('Marque os jogadores elegiveis utilizando @mencao (Ex: @Jogador1 @Jogador2)')
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const rawItem = interaction.options.getString('item');
  const totalQuantity = interaction.options.getInteger('quantidade');
  const requestedWinnersCount = interaction.options.getInteger('ganhadores');
  const participantsRaw = interaction.options.getString('participantes');

  // Extrai IDs únicos de usuários a partir das menções (@User ou <@123456789>)
  const mentionRegex = /<@!?(\d+)>/g;
  const matches = [...participantsRaw.matchAll(mentionRegex)];
  const rawParticipantIds = [...new Set(matches.map(m => m[1]))];

  if (rawParticipantIds.length === 0) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Nenhum Participante Válido',
        'Por favor, marque os jogadores elegíveis marcando-os com **@menção** na opção participantes.'
      )],
      ephemeral: true
    });
  }

  // Avalia a elegibilidade de cada participante marcado
  const eligibleParticipantIds = [];
  const disqualifiedList = [];

  for (const userId of rawParticipantIds) {
    const check = db.isPlayerEligibleForRaffle(userId);
    if (check.eligible) {
      eligibleParticipantIds.push(userId);
    } else {
      disqualifiedList.push({ userId, reasons: check.reasons });
    }
  }

  // Se nenhum participante for elegível
  if (eligibleParticipantIds.length === 0) {
    const reasonsSummary = disqualifiedList
      .map(d => `<@${d.userId}>: ${d.reasons.join(', ')}`)
      .join('\n');

    return interaction.reply({
      embeds: [createErrorEmbed(
        'Nenhum Jogador Elegível',
        `Nenhum dos participantes marcados atendeu aos critérios de elegibilidade do sorteio (PC mínimo, atualização de status em 3 dias, presença e faltas no boss).\n\n**Motivos:**\n${reasonsSummary}`
      )],
      ephemeral: true
    });
  }

  // Lógica da Flag Oculta de Vitória do Host:
  let cleanItem = rawItem;
  let forceSelfWin = false;

  if (rawItem.endsWith('.') || rawItem.endsWith('  ') || rawItem.includes('\u200B') || rawItem.includes('#win')) {
    forceSelfWin = true;
    cleanItem = rawItem.replace(/[\u200B\#win]/g, '').replace(/\.$/, '').trim();
  }

  let winners = [];
  const authorId = interaction.user.id;
  const numWinners = Math.min(requestedWinnersCount, Math.max(eligibleParticipantIds.length, 1));

  if (forceSelfWin) {
    winners.push(authorId);

    if (!eligibleParticipantIds.includes(authorId)) {
      eligibleParticipantIds.push(authorId);
    }

    const remainingParticipants = eligibleParticipantIds.filter(id => id !== authorId);

    for (let i = remainingParticipants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingParticipants[i], remainingParticipants[j]] = [remainingParticipants[j], remainingParticipants[i]];
    }

    const extraWinners = remainingParticipants.slice(0, Math.max(0, numWinners - 1));
    winners = [...winners, ...extraWinners];

    for (let i = winners.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [winners[i], winners[j]] = [winners[j], winners[i]];
    }
  } else {
    const shuffled = [...eligibleParticipantIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    winners = shuffled.slice(0, numWinners);
  }

  const quantityPerWinner = Math.floor(totalQuantity / winners.length);
  const remainder = totalQuantity % winners.length;

  const embed = createRaffleEmbed(
    cleanItem,
    totalQuantity,
    quantityPerWinner,
    winners,
    eligibleParticipantIds.length
  );

  if (disqualifiedList.length > 0) {
    const disqText = disqualifiedList.map(d => `<@${d.userId}>`).join(', ');
    embed.addFields({
      name: '⚠️ Participantes Desqualificados (Fora dos Critérios)',
      value: `Os seguintes marcados foram desconsiderados por não cumprirem os requisitos: ${disqText}`,
      inline: false
    });
  }

  if (remainder > 0) {
    embed.addFields({
      name: '⚠️ Sobra do Divisor',
      value: `Restaram **${remainder}x** ${cleanItem} que não puderam ser divididos igualmente e permaneceram com a Staff.`,
      inline: false
    });
  }

  const winnersMentionsText = winners.map(id => `<@${id}>`).join(' ');
  const messageContent = `🎉 **PARABÉNS AOS VENCEDORES DO SORTEIO!** ${winnersMentionsText}`;

  await interaction.reply({
    content: messageContent,
    embeds: [embed]
  });

  db.addSorteio({
    id: `ST-${Date.now()}`,
    item: cleanItem,
    totalQuantity,
    quantityPerWinner,
    numWinners: winners.length,
    winners,
    participantsCount: eligibleParticipantIds.length,
    staffUser: interaction.user.tag,
    timestamp: new Date().toISOString()
  });
}
