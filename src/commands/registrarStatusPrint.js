import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { processImageOCR } from '../services/ocrService.js';
import { db } from '../database/db.js';
import { checkGuildMemberAndChannel } from '../middleware/checkGuildMemberAndChannel.js';
import { createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('registrar-status')
  .setDescription('Envia um print dos seus status para leitura automática via OCR e acompanhamento')
  .addAttachmentOption(option =>
    option.setName('imagem')
      .setDescription('Anexe a imagem/print da tela com os seus status')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('observacao')
      .setDescription('Observação ou nota adicional (Opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  // Permite executar no canal de alts/status ou por membros da guild NC
  const attachment = interaction.options.getAttachment('imagem');
  const observacao = interaction.options.getString('observacao') || 'Sem observação.';

  if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
    return interaction.reply({
      embeds: [createErrorEmbed('Arquivo Inválido', 'Por favor, anexe uma imagem válida (PNG, JPG, WEBP).')],
      ephemeral: true
    });
  }

  // Defer para aguardar o processamento do OCR sem dar timeout no Discord
  await interaction.deferReply({ ephemeral: false });

  try {
    const { rawText, parsedStats } = await processImageOCR(attachment.url);

    const statusData = {
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      imageUrl: attachment.url,
      rawText,
      parsedStats,
      observacao,
      updatedAtISO: new Date().toISOString()
    };

    db.addPlayerStatus(statusData);

    const timestampUnix = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('📷 PRINT DE STATUS REGISTRADO COM SUCESSO!')
      .setDescription(`Status de <@${interaction.user.id}> processados via OCR em <t:${timestampUnix}:F>`)
      .setImage(attachment.url)
      .setTimestamp()
      .setFooter({ text: 'NC Bot • OCR Status Tracker' });

    // Se detectou estatísticas estruturadas
    const detectedFields = [];
    if (parsedStats.nick) detectedFields.push(`👤 **Nick:** ${parsedStats.nick}`);
    if (parsedStats.level) detectedFields.push(`⭐ **Nível:** ${parsedStats.level}`);
    if (parsedStats.power) detectedFields.push(`⚔️ **Poder:** ${parsedStats.power}`);
    if (parsedStats.gold) detectedFields.push(`💰 **Ouro:** ${parsedStats.gold}`);

    if (detectedFields.length > 0) {
      embed.addFields({
        name: '📊 Status Detectados Automaticamente',
        value: detectedFields.join('\n'),
        inline: false
      });
    }

    // Trecho do texto extraído via OCR (limitado a 500 caracteres para clareza)
    const textSnippet = rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText;
    embed.addFields(
      { name: '🔍 Texto Lido via OCR', value: `\`\`\`text\n${textSnippet}\n\`\`\``, inline: false },
      { name: '📝 Observação', value: observacao, inline: false }
    );

    await interaction.editReply({
      content: `✅ Status de <@${interaction.user.id}> atualizado com sucesso!`,
      embeds: [embed]
    });

  } catch (err) {
    console.error('Erro ao registrar status via print:', err);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro ao Processar OCR', 'Não foi possível ler os dados da imagem. Verifique se o print está nítido e tente novamente.')]
    });
  }
}
