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

  const item = interaction.options.getString('item');
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

  // Ajusta o número de ganhadores caso haja menos participantes do que a quantidade de ganhadores solicitada
  const numWinners = Math.min(requestedWinnersCount, participantIds.length);

  // Algoritmo de embaralhamento Fisher-Yates para sorteio justo
  const shuffled = [...participantIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Seleciona os N ganhadores
  const winners = shuffled.slice(0, numWinners);

  // Calcula a quantidade de itens para cada ganhador
  const quantityPerWinner = Math.floor(totalQuantity / numWinners);
  const remainder = totalQuantity % numWinners;

  // Cria a resposta pública com o Embed bonitinho do sorteio
  const embed = createRaffleEmbed(
    item,
    totalQuantity,
    quantityPerWinner,
    winners,
    participantIds.length
  );

  if (remainder > 0) {
    embed.addFields({
      name: '⚠️ Sobra do Divisor',
      value: `Restaram **${remainder}x** ${item} que não puderam ser divididos igualmente e permaneceram com a Staff.`,
      inline: false
    });
  }

  // Mensagem com a menção de todos os ganhadores para notificá-los
  const winnersMentionsText = winners.map(id => `<@${id}>`).join(' ');
  const messageContent = `🎉 **PARABÉNS AOS VENCEDORES DO SORTEIO!** ${winnersMentionsText}`;

  // Responde publicamente
  await interaction.reply({
    content: messageContent,
    embeds: [embed]
  });

  // Salva o histórico do sorteio
  db.addSorteio({
    id: `ST-${Date.now()}`,
    item,
    totalQuantity,
    quantityPerWinner,
    numWinners,
    winners,
    participantsCount: participantIds.length,
    staffUser: interaction.user.tag,
    timestamp: new Date().toISOString()
  });
}
