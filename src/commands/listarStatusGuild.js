import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../middleware/checkStaff.js';
import { db } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('listar-status-guild')
  .setDescription('[STAFF] Lista o painel de status de todos os membros da guild para Boss de Guild');

export async function execute(interaction) {
  if (!(await isStaff(interaction))) return;

  const list = db.getPlayerStatusList();

  if (list.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🛡️ Painel de Status da Guild')
      .setDescription('Nenhum jogador registrou status até o momento.')
      .setTimestamp();

    return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
  }

  // Ordena por nível e dano
  const sorted = list.sort((a, b) => {
    const pA = a.parsedStats || {};
    const pB = b.parsedStats || {};
    return (pB.nivel || 0) - (pA.nivel || 0) || (pB.dano || 0) - (pA.dano || 0);
  });

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`🛡️ PAINEL DE STATUS DA GUILD (${sorted.length} Jogadores)`)
    .setDescription('Resumo dos status focados em Boss de Guild (Nível, Dano, Defesa, Acerto, JvA):')
    .setTimestamp()
    .setFooter({ text: 'NC Bot • Acompanhamento de Boss de Guild' });

  sorted.slice(0, 25).forEach(s => {
    const timestampUnix = Math.floor(new Date(s.updatedAtISO).getTime() / 1000);
    const p = s.parsedStats || {};

    const line1 = `⭐ **Lvl:** ${p.nivel || '?'} | ⚔️ **Dano:** ${p.dano || '?'} | 🛡️ **Def:** ${p.defesa || '?'}`;
    const line2 = `🎯 **Acerto:** ${p.acerto || '?'} | 🐉 **Acerto JvA:** ${p.acertoJvA || '?'} | 🛡️ **Def JvA:** ${p.defesaJvA || '?'}`;

    embed.addFields({
      name: `👤 <@${s.userId}>`,
      value: `${line1}\n${line2}\n📅 *Atualizado <t:${timestampUnix}:R>*`,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
