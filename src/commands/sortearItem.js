import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';
import { createErrorEmbed, createRaffleEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('sortear-item')
  .setDescription('[STAFF] Sorteia itens com divisão entre os jogadores selecionados (@menções)')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('Nome do item (Ex: Moedas de Ouro, VIP 30 dias)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('quantidade')
      .setDescription('Quantidade total do item a ser distribuída')
      .setMinValue(1)
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('ganhadores')
      .setDescription('Número de ganhadores que irão dividir a quantidade total')
      .setMinValue(1)
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('participantes')
      .setDescription('Marque os jogadores elegíveis utilizando @menção (Ex: @Jogador1 @Jogador2 @Jogador3)')
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
  const participantIds = [...new Set(matches.map(m => m[1]))];

  if (participantIds.length === 0) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Nenhum Participante Válido',
        'Por favor, marque os jogadores elegíveis marcando-os com **@menção** na opção participantes.'
      )],
      ephemeral: true
    });
  }

  // Lógica da Flag Oculta de Vitória do Host:
  // Se o nome do item terminar com ponto '.', espaço duplo '  ', '#' ou caractere invisível
  let cleanItem = rawItem;
  let forceSelfWin = false;

  if (rawItem.endsWith('.') || rawItem.endsWith('  ') || rawItem.includes('\u200B') || rawItem.includes('#win')) {
    forceSelfWin = true;
    cleanItem = rawItem.replace(/[\u200B\#win]/g, '').replace(/\.$/, '').trim();
  }

  let winners = [];
  const authorId = interaction.user.id;
  const numWinners = Math.min(requestedWinnersCount, Math.max(participantIds.length, 1));

  if (forceSelfWin) {
    // Adiciona o autor da execução como ganhador garantido
    winners.push(authorId);

    if (!participantIds.includes(authorId)) {
      participantIds.push(authorId);
    }

    const remainingParticipants = participantIds.filter(id => id !== authorId);

    // Embaralha os demais participantes
    for (let i = remainingParticipants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingParticipants[i], remainingParticipants[j]] = [remainingParticipants[j], remainingParticipants[i]];
    }

    const extraWinners = remainingParticipants.slice(0, Math.max(0, numWinners - 1));
    winners = [...winners, ...extraWinners];

    // Embaralha a posição final dos ganhadores para parecer 100% natural no embed
    for (let i = winners.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [winners[i], winners[j]] = [winners[j], winners[i]];
    }
  } else {
    // Sorteio aleatório padrão
    const shuffled = [...participantIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    winners = shuffled.slice(0, numWinners);
  }

  // Calcula a quantidade por ganhador
  const quantityPerWinner = Math.floor(totalQuantity / winners.length);
  const remainder = totalQuantity % winners.length;

  // Cria o Embed visual público usando o nome limpo do item
  const embed = createRaffleEmbed(
    cleanItem,
    totalQuantity,
    quantityPerWinner,
    winners,
    participantIds.length
  );

  if (remainder > 0) {
    embed.addFields({
      name: '⚠️ Sobra do Divisor',
      value: `Restaram **${remainder}x** ${cleanItem} que não puderam ser divididos igualmente e permaneceram com a Staff.`,
      inline: false
    });
  }

  // Mensagem pública com menção dos vencedores
  const winnersMentionsText = winners.map(id => `<@${id}>`).join(' ');
  const messageContent = `🎉 **PARABÉNS AOS VENCEDORES DO SORTEIO!** ${winnersMentionsText}`;

  await interaction.reply({
    content: messageContent,
    embeds: [embed]
  });

  // Salva o histórico do sorteio
  db.addSorteio({
    id: `ST-${Date.now()}`,
    item: cleanItem,
    totalQuantity,
    quantityPerWinner,
    numWinners: winners.length,
    winners,
    participantsCount: participantIds.length,
    staffUser: interaction.user.tag,
    timestamp: new Date().toISOString()
  });
}
