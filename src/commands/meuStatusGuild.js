import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('meu-status-guild')
  .setDescription('Consulta de forma privada os seus status salvos, pontuacao de boss e elegibilidade no sorteio');

export async function execute(interaction) {
  const { eligible, reasons, memberData } = db.isPlayerEligibleForRaffle(interaction.user.id);
  const cutoff = db.getCutoffSettings();

  if (!memberData) {
    const emptyEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❌ Nenhum Status Cadastrado')
      .setDescription(`Olá <@${interaction.user.id}>! Você ainda não registrou seus status no bot.\n\nUse o comando \`/registrar-status\` anexando o print da tela e informando seu nome no jogo para ficar elegível aos sorteios!`)
      .setTimestamp();

    return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
  }

  const s = memberData.parsedStats || {};
  const desVal = s.desenvolvimento || s.pc || 0;
  const lastUpdateUnix = memberData.lastStatusUpdateISO 
    ? Math.floor(new Date(memberData.lastStatusUpdateISO).getTime() / 1000)
    : null;

  const embed = new EmbedBuilder()
    .setColor(eligible ? '#57F287' : '#ED4245')
    .setTitle(`🛡️ STATUS DE ${memberData.charName.toUpperCase()}`)
    .setDescription(`Consulta privada de status e elegibilidade para sorteios de <@${interaction.user.id}>`)
    .addFields(
      { name: '👤 Personagem In-Game', value: `**${memberData.charName}**`, inline: true },
      { name: '🗡️ Classe', value: s.classe ? `**${s.classe}**` : 'Não informado', inline: true },
      { name: '⚡ Desenvolvimento (PC)', value: `**${desVal.toLocaleString('pt-BR')}** (Mínimo: ${cutoff.minPC.toLocaleString('pt-BR')})`, inline: true },
      { name: '⭐ Nível', value: s.nivel ? `**${s.nivel}**` : 'Não informado', inline: true },
      { name: '⚔️ Dano / Defesa / Acerto', value: `${s.dano || '-'} / ${s.defesa || '-'} / ${s.acerto || '-'}`, inline: true },
      { name: '🐉 JvA (Acerto / Defesa)', value: `${s.acertoJvA || '-'} / ${s.defesaJvA || '-'}`, inline: true },
      { name: '⚔️ JvJ (Acerto / Defesa)', value: `${s.acertoJvJ || '-'} / ${s.defesaJvJ || '-'}`, inline: true },
      { name: '📅 Último Print Enviado', value: lastUpdateUnix ? `<t:${lastUpdateUnix}:R>` : 'Nunca', inline: true },
      { name: '🏆 Pontuação Semanal Boss', value: `**${memberData.weeklyBossScore || 0}** pts (Mínimo: ${cutoff.minWeeklyScore} pts)`, inline: true },
      { name: '🚫 Faltou ao Boss da Semana?', value: memberData.flagFaltouBoss ? '⚠️ **SIM (Faltou)**' : '✅ **NÃO (Presente)**', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Consulta Privada Efêmera' });

  if (eligible) {
    embed.addFields({
      name: '🎉 Elegibilidade para Sorteios',
      value: '🟢 **VOCÊ ESTÁ 100% ELEGÍVEL PARA OS SORTEIOS DA SEMANA!**\nTodos os critérios de presença, desenvolvimento e atualização de status foram cumpridos.',
      inline: false
    });
  } else {
    const reasonsFormatted = reasons.map(r => `• 🔴 ${r}`).join('\n');
    embed.addFields({
      name: '⚠️ Pendências de Elegibilidade',
      value: `Você atualmente **NÃO está apto** para entrar nos sorteios devido às seguintes pendências:\n${reasonsFormatted}\n\n*Envie um novo print em \`/registrar-status\` para se adequar.*`,
      inline: false
    });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
