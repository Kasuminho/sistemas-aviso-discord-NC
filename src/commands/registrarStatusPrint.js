import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { analyzeScreenshotsWithGemini } from '../services/visionService.js';
import { db } from '../database/db.js';
import { createErrorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('registrar-status')
  .setDescription('Registra seus status de jogo anexando ate 3 prints para leitura automatica via IA Gemini')
  .addStringOption(option =>
    option.setName('nome_personagem')
      .setDescription('Seu Nick / Nome exato do personagem dentro do jogo')
      .setRequired(true)
  )
  .addAttachmentOption(option =>
    option.setName('print_1')
      .setDescription('Print 1: HUD da barra de vida (Nivel, Dano, Defesa, Acerto)')
      .setRequired(true)
  )
  .addAttachmentOption(option =>
    option.setName('print_2')
      .setDescription('Print 2: Janela de atributos JvA (Opcional)')
      .setRequired(false)
  )
  .addAttachmentOption(option =>
    option.setName('print_3')
      .setDescription('Print 3: Janela de atributos JvJ (Opcional)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('observacao')
      .setDescription('Observacao ou nota adicional para a Staff (Opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const charName = interaction.options.getString('nome_personagem');
  const print1 = interaction.options.getAttachment('print_1');
  const print2 = interaction.options.getAttachment('print_2');
  const print3 = interaction.options.getAttachment('print_3');
  const observacao = interaction.options.getString('observacao') || '';

  const attachments = [print1, print2, print3].filter(Boolean);
  const imageUrls = [];

  for (const att of attachments) {
    if (!att.contentType || !att.contentType.startsWith('image/')) {
      return interaction.reply({
        embeds: [createErrorEmbed('Arquivo Inválido', 'Por favor, anexe apenas arquivos de imagem (PNG, JPG, WEBP).')],
        ephemeral: true
      });
    }
    imageUrls.push(att.url);
  }

  // Defer resposta pois a análise multimodal leva entre 1 e 3 segundos
  await interaction.deferReply({ ephemeral: false });

  try {
    // Chama o serviço multimodal Gemini Vision mandando todas as imagens anexadas juntas
    const parsedStats = await analyzeScreenshotsWithGemini(imageUrls);

    // Salva ou atualiza os status e o nick in-game no banco de dados
    const savedMember = db.setPlayerStatus(
      interaction.user.id,
      interaction.user.tag,
      charName,
      parsedStats,
      imageUrls,
      observacao
    );

    const pcTotal = savedMember.parsedStats.pc || 0;
    const timestampUnix = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle(`🛡️ STATUS DE "${charName.toUpperCase()}" ATUALIZADOS COM SUCESSO!`)
      .setDescription(`Status de <@${interaction.user.id}> processados via **IA Gemini Vision** em <t:${timestampUnix}:F>`)
      .addFields(
        { name: '👤 Personagem', value: `**${charName}**`, inline: true },
        { name: '⭐ Nível', value: parsedStats.nivel ? `**${parsedStats.nivel}**` : 'Não detectado', inline: true },
        { name: '⚡ PC Total (Poder)', value: `**${pcTotal}**`, inline: true },
        { name: '⚔️ Dano', value: parsedStats.dano ? `**${parsedStats.dano}**` : 'Não detectado', inline: true },
        { name: '🛡️ Defesa', value: parsedStats.defesa ? `**${parsedStats.defesa}**` : 'Não detectado', inline: true },
        { name: '🎯 Acerto Geral', value: parsedStats.acerto ? `**${parsedStats.acerto}**` : 'Não detectado', inline: true },
        { name: '🐉 Acerto JvA', value: parsedStats.acertoJvA ? `**${parsedStats.acertoJvA}**` : 'Não detectado', inline: true },
        { name: '🛡️ Defesa JvA', value: parsedStats.defesaJvA ? `**${parsedStats.defesaJvA}**` : 'Não detectado', inline: true },
        { name: '⚔️ Acerto JvJ', value: parsedStats.acertoJvJ ? `**${parsedStats.acertoJvJ}**` : 'Não detectado', inline: true },
        { name: '🛡️ Defesa JvJ', value: parsedStats.defesaJvJ ? `**${parsedStats.defesaJvJ}**` : 'Não detectado', inline: true }
      )
      .setImage(imageUrls[0])
      .setTimestamp()
      .setFooter({ text: 'NC Bot • Gemini Vision AI Status Tracker' });

    if (observacao) {
      embed.addFields({ name: '📝 Observação', value: observacao, inline: false });
    }

    await interaction.editReply({
      content: `✅ Status de <@${interaction.user.id}> ("${charName}") salvos com sucesso!`,
      embeds: [embed]
    });

  } catch (err) {
    console.error('Erro ao processar OCR/Gemini dos status:', err);
    await interaction.editReply({
      embeds: [createErrorEmbed(
        'Erro na Leitura por IA',
        `Ocorreu uma falha ao ler os prints anexados.\nDetalhamento: \`${err.message}\`.\nVerifique se a foto está nítida e tente novamente.`
      )]
    });
  }
}
