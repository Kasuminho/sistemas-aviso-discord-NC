import { EmbedBuilder } from 'discord.js';

export function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setColor('#57F287')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Gerenciador de Eventos' });
}

export function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Gerenciador de Eventos' });
}

export function createEventEmbed(event, noticeType = 'INFO') {
  let headerText = '📅 NOVO EVENTO AGENDADO!';
  let color = '#5865F2';

  if (noticeType === 'DAILY_15H') {
    headerText = '📢 AVISO DIÁRIO DE EVENTOS';
    color = '#FEE75C';
  } else if (noticeType === 'REMINDER_4H') {
    headerText = '⏰ EVENTO EM 4 HORAS!';
    color = '#FEE75C';
  } else if (noticeType === 'REMINDER_1H') {
    headerText = '🔥 EVENTO EM 1 HORA!';
    color = '#E67E22';
  } else if (noticeType === 'REMINDER_30M') {
    headerText = '🚨 EVENTO EM 30 MINUTOS!';
    color = '#ED4245';
  }

  const dateFormatted = `<t:${Math.floor(new Date(event.dateTimeISO).getTime() / 1000)}:F>`;
  const relativeFormatted = `<t:${Math.floor(new Date(event.dateTimeISO).getTime() / 1000)}:R>`;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(headerText)
    .addFields(
      { name: '📌 Título do Evento', value: `**${event.title}**`, inline: false },
      { name: '📝 Descrição', value: event.description || 'Sem descrição.', inline: false },
      { name: '📆 Data e Horário', value: `${dateFormatted} (${relativeFormatted})`, inline: true },
      { name: '🆔 ID do Evento', value: `\`${event.id}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Fuso Horário: GMT-3 (Horário de Brasília)' });
}

export function createRaffleEmbed(item, totalQuantity, quantityPerWinner, winners, participantsCount) {
  const winnersListFormatted = winners.map((w, index) => `🥇 **${index + 1}º Ganhador:** <@${w}> -> Recebe **${quantityPerWinner}x** ${item}`).join('\n');

  return new EmbedBuilder()
    .setColor('#EB459E')
    .setTitle('🎉 SORTEIO REALIZADO COM SUCESSO! 🎉')
    .setDescription(`O sorteio do item **${item}** foi concluído com sucesso entre os participantes selecionados!`)
    .addFields(
      { name: '🎁 Item Sorteado', value: `**${item}**`, inline: true },
      { name: '📦 Quantidade Total', value: `**${totalQuantity}**`, inline: true },
      { name: '👥 Total de Participantes', value: `**${participantsCount}** jogador(es)`, inline: true },
      { name: '🏆 Vencedores & Divisão de Prêmios', value: winnersListFormatted || 'Nenhum ganhador selecionado.', inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Sistema de Sorteios' });
}
