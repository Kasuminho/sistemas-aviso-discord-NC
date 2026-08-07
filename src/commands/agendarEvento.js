import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { DateTime } from 'luxon';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed, createEventEmbed } from '../utils/embeds.js';
import { config } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('agendar-evento')
  .setDescription('[STAFF] Agenda um novo evento com aviso imediato e lembretes automáticos em GMT-3')
  .addStringOption(option =>
    option.setName('titulo')
      .setDescription('Título do evento')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('descricao')
      .setDescription('Descrição detalhada do evento')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('data_hora')
      .setDescription('Data e hora no fuso GMT-3 (Exemplo: 15/08/2026 20:00)')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName('canal')
      .setDescription('Canal de avisos (Opcional. Se omitido, usa o canal configurado no .env)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const title = interaction.options.getString('titulo');
  const description = interaction.options.getString('descricao');
  const dateTimeStr = interaction.options.getString('data_hora');
  const channelOption = interaction.options.getChannel('canal');

  // Determina o canal de avisos
  const channelId = channelOption?.id || config.announcementChannelId || interaction.channelId;

  // Tenta parsear a data/hora em GMT-3 (America/Sao_Paulo)
  const dt = DateTime.fromFormat(dateTimeStr, 'dd/MM/yyyy HH:mm', { zone: 'America/Sao_Paulo' });

  if (!dt.isValid) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Data/Hora Inválida',
        'Por favor, utilize o formato correto: **DD/MM/YYYY HH:mm** (Exemplo: `15/08/2026 20:00`).'
      )],
      ephemeral: true
    });
  }

  const now = DateTime.now().setZone('America/Sao_Paulo');
  if (dt <= now) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        'Data no Passado',
        'A data e hora do evento devem ser futuras no fuso horário GMT-3!'
      )],
      ephemeral: true
    });
  }

  // Gera um ID único e curto para o evento (ex: EVT-92A4)
  const eventId = `EVT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newEvent = {
    id: eventId,
    title,
    description,
    dateTimeISO: dt.toJSDate().toISOString(),
    channelId,
    createdAt: new Date().toISOString(),
    notified15h: false,
    notified4h: false,
    notified1h: false,
    notified30m: false
  };

  db.addEvent(newEvent);

  // 1. Resposta privada de confirmação para o Staff
  const confirmEmbed = createSuccessEmbed(
    'Evento Agendado com Sucesso!',
    `O evento **${title}** foi agendado para <t:${Math.floor(dt.toJSDate().getTime() / 1000)}:F>.\nUm aviso público foi enviado no canal <#${channelId}> marcando <@&${config.eventRoleId}>.`
  );

  await interaction.reply({
    embeds: [confirmEmbed],
    ephemeral: true
  });

  // 2. Primeira postagem pública imediata no canal para a galera!
  try {
    const targetChannel = await interaction.client.channels.fetch(channelId);
    if (targetChannel && targetChannel.isTextBased()) {
      const publicEmbed = createEventEmbed(newEvent, 'NEW_EVENT');
      await targetChannel.send({
        content: `📢 **NOVO EVENTO AGENDADO!** <@&${config.eventRoleId}>`,
        embeds: [publicEmbed]
      });
    }
  } catch (err) {
    console.error(`Erro ao postar primeiro aviso do evento ${eventId} no canal:`, err);
  }
}
