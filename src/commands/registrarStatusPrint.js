import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { processImageOCR } from '../services/ocrService.js';
import { db } from '../database/db.js';
import { createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('registrar-status')
  .setDescription('Registra os status do seu personagem para acompanhamento de Boss de Guild')
  .addIntegerOption(option =>
    option.setName('nivel')
      .setDescription('Seu Nível atual (Ex: 62)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('dano')
      .setDescription('Seu Dano (Ex: 480)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('defesa')
      .setDescription('Sua Defesa (Ex: 562)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('acerto')
      .setDescription('Seu Acerto Geral (Ex: 567)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('acerto_jva')
      .setDescription('Seu Acerto em JvA (Ex: 90)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('defesa_jva')
      .setDescription('Sua Defesa em JvA (Ex: 45)')
      .setRequired(false)
  )
  .addAttachmentOption(option =>
    option.setName('print_hud')
      .setDescription('Print da barra de vida (com Nível, Dano, Defesa e Acerto)')
      .setRequired(false)
  )
  .addAttachmentOption(option =>
    option.setName('print_detalhes')
      .setDescription('Print dos detalhes de atributos (com Acerto em JvA e Defesa em JvA)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('observacao')
      .setDescription('Observação ou nota para a Staff (Opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const optNivel = interaction.options.getInteger('nivel');
  const optDano = interaction.options.getInteger('dano');
  const optDefesa = interaction.options.getInteger('defesa');
  const optAcerto = interaction.options.getInteger('acerto');
  const optAcertoJvA = interaction.options.getInteger('acerto_jva');
  const optDefesaJvA = interaction.options.getInteger('defesa_jva');
  const printHud = interaction.options.getAttachment('print_hud');
  const printDetalhes = interaction.options.getAttachment('print_detalhes');
  const observacao = interaction.options.getString('observacao') || 'Sem observação.';

  // Se o usuário não preencheu nem números e nem prints
  if (!optNivel && !optDano && !optDefesa && !optAcerto && !optAcertoJvA && !optDefesaJvA && !printHud && !printDetalhes) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Dados Ausentes',
        'Por favor, informe os valores numéricos dos status ou anexe os prints (`print_hud` / `print_detalhes`).'
      )],
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: false });

  const stats = {
    nivel: optNivel || null,
    dano: optDano || null,
    defesa: optDefesa || null,
    acerto: optAcerto || null,
    acertoJvA: optAcertoJvA || null,
    defesaJvA: optDefesaJvA || null
  };

  let imageUrl = printHud?.url || printDetalhes?.url || null;
  let ocrSummary = [];

  // Se enviou print da HUD, executa OCR
  if (printHud) {
    try {
      const { parsedStats } = await processImageOCR(printHud.url);
      if (!stats.nivel && parsedStats.nivel) stats.nivel = parsedStats.nivel;
      if (!stats.dano && parsedStats.dano) stats.dano = parsedStats.dano;
      if (!stats.defesa && parsedStats.defesa) stats.defesa = parsedStats.defesa;
      if (!stats.acerto && parsedStats.acerto) stats.acerto = parsedStats.acerto;
      ocrSummary.push('Lido via OCR (HUD)');
    } catch (e) {
      console.error('Erro OCR HUD:', e);
    }
  }

  // Se enviou print de detalhes (JvA), executa OCR
  if (printDetalhes) {
    try {
      const { parsedStats } = await processImageOCR(printDetalhes.url);
      if (!stats.acertoJvA && parsedStats.acertoJvA) stats.acertoJvA = parsedStats.acertoJvA;
      if (!stats.defesaJvA && parsedStats.defesaJvA) stats.defesaJvA = parsedStats.defesaJvA;
      if (!stats.acerto && parsedStats.acerto) stats.acerto = parsedStats.acerto;
      ocrSummary.push('Lido via OCR (Detalhes JvA)');
    } catch (e) {
      console.error('Erro OCR Detalhes:', e);
    }
  }

  // Busca dados anteriores do usuário para não perder valores não alterados
  const existing = db.getLatestPlayerStatus(interaction.user.id);
  if (existing && existing.parsedStats) {
    if (!stats.nivel) stats.nivel = existing.parsedStats.nivel || null;
    if (!stats.dano) stats.dano = existing.parsedStats.dano || null;
    if (!stats.defesa) stats.defesa = existing.parsedStats.defesa || null;
    if (!stats.acerto) stats.acerto = existing.parsedStats.acerto || null;
    if (!stats.acertoJvA) stats.acertoJvA = existing.parsedStats.acertoJvA || null;
    if (!stats.defesaJvA) stats.defesaJvA = existing.parsedStats.defesaJvA || null;
  }

  const statusData = {
    userId: interaction.user.id,
    userTag: interaction.user.tag,
    imageUrl,
    parsedStats: stats,
    observacao,
    updatedAtISO: new Date().toISOString()
  };

  db.addPlayerStatus(statusData);

  const timestampUnix = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle(`🛡️ STATUS REGISTRADOS COM SUCESSO!`)
    .setDescription(`Atualização de status de <@${interaction.user.id}> em <t:${timestampUnix}:F>`)
    .addFields(
      { name: '⭐ Nível', value: stats.nivel ? `**${stats.nivel}**` : '⚠️ Não informado', inline: true },
      { name: '⚔️ Dano', value: stats.dano ? `**${stats.dano}**` : '⚠️ Não informado', inline: true },
      { name: '🛡️ Defesa', value: stats.defesa ? `**${stats.defesa}**` : '⚠️ Não informado', inline: true },
      { name: '🎯 Acerto', value: stats.acerto ? `**${stats.acerto}**` : '⚠️ Não informado', inline: true },
      { name: '🐉 Acerto em JvA', value: stats.acertoJvA ? `**${stats.acertoJvA}**` : '⚠️ Não informado', inline: true },
      { name: '🛡️ Defesa em JvA', value: stats.defesaJvA ? `**${stats.defesaJvA}**` : '⚠️ Não informado', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Acompanhamento de Boss de Guild' });

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  if (observacao) {
    embed.addFields({ name: '📝 Observação', value: observacao, inline: false });
  }

  await interaction.editReply({
    content: `✅ Status de <@${interaction.user.id}> salvos com sucesso!`,
    embeds: [embed]
  });
}
