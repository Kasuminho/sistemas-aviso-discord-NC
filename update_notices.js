import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const channelId = process.env.ANNOUNCEMENT_CHANNEL_ID || '1525526503008370760';

async function cleanChannel(channel) {
  console.log(`Cleaning channel ${channel.name} (${channel.id})...`);
  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const messages = await channel.messages.fetch({ limit: 100 });
    if (messages.size === 0) {
      hasMore = false;
      break;
    }

    console.log(`Fetched ${messages.size} messages to delete...`);

    const now = Date.now();
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const bulkDeletable = messages.filter(m => m.createdTimestamp > fourteenDaysAgo);
    const oldMessages = messages.filter(m => m.createdTimestamp <= fourteenDaysAgo);

    if (bulkDeletable.size > 0) {
      if (bulkDeletable.size === 1) {
        await bulkDeletable.first().delete();
        totalDeleted += 1;
      } else {
        const deleted = await channel.bulkDelete(bulkDeletable, true);
        totalDeleted += deleted.size;
      }
      console.log(`Bulk deleted ${bulkDeletable.size} messages.`);
    }

    if (oldMessages.size > 0) {
      for (const [id, msg] of oldMessages) {
        try {
          await msg.delete();
          totalDeleted += 1;
          await new Promise(r => setTimeout(r, 800));
        } catch (e) {
          console.warn(`Could not delete message ${id}:`, e.message);
        }
      }
    }

    if (messages.size < 100) {
      hasMore = false;
    }
  }

  console.log(`Finished cleaning. Total messages deleted: ${totalDeleted}`);
}

async function postNewNotices(channel) {
  console.log('Posting updated event notices (01/09/2026) with prints...');

  // Intro message
  await channel.send({
    content: `📢 **RESUMO DOS NOVOS EVENTOS | 01/09/2026 - NIGHT CROWS**\n\nConfira abaixo o resumo completo e os prints detalhados de todos os novos eventos da virada de setembro!\n🔗 **Link Oficial:** https://www.nightcrows.com/pt/notice/notice/753650\nℹ️ *Nota: Esta virada semanal é "Sem Manutenção" (apenas aplicação direta dos novos eventos e passes).*`,
    embeds: [{
      title: "🍂 Visão Geral dos Novos Eventos de Setembro",
      description: "Novos eventos focados em **Montarias**, **Grande Expedição de Dados do Corvinho**, **Pesquisa e Laboratório de Clemens** e **60% de Desconto na Substituição de Montaria/Visual de Arma**!",
      color: 0xF37934,
      fields: [
        { name: "🎯 Servidores Alvo", value: "Todos os servidores", inline: true },
        { name: "📅 Início dos Eventos", value: "Após a atualização de 01/09/2026", inline: true }
      ]
    }]
  });

  await new Promise(r => setTimeout(r, 1500));

  // 1. Missões de Outono & Montarias (11 Diretivas)
  await channel.send({
    embeds: [{
      title: "1️⃣ EVENTO DE CONCLUSÃO DE MISSÃO (11 DIRETIVAS & CLEMENS)",
      description: `📅 **Período:** 01/09 até 15/09, 08:00 (UTC+8) *(missões semanais até 08/09)*\n🎯 **Servidores:** Todos os servidores\n\n**Destaques das 11 Cadeias de Missões:**\n• **Auxílio de Baú de Pesquisa de Clemens:** Uso de Poções de HP e Criação → *Baú de Invocação de Pesquisa de Clemens x1*.\n• **Auxílio de Dado da Sorte I & II:** Gasto de Ouro, Monstros derrotados e Desmontagem de Equipamentos → *Cupons de Desconto de Substituição*, Pedras da Bênção e **Dados da Sorte**.\n• **[Semanal] Missão de Auxílio & Moeda de Abilius:** Campanhas, Raides e Masmorras → Moedas de Abilius → *Baú de Seleção de Invocação Épica de Abilius*.\n• **Laboratório de Clemens:** Abrir Baús de Pesquisa de Clemens → Invocações Deslumbrantes e **Invocação de Montaria Lendária (Vinculado) x1**.\n• **[Montaria] Diretivas de Iniciante & Clemens:** Invocações e fusões de Montaria → **Bilhetes e Baú de Invocação de Montaria Lendária de Ouro Deslumbrante (Vinculado)**!\n• **[Montaria] Diretiva de Combinação de Ouro:** Fusões usando Ouro e uso de Dados → **Baú de Seleção de Desafio de Invocação Mítico**!\n• **Transcendência do Fogo e Vento:** Consumo de Bolas de Cristal → Materiais Épicos e *Baú de Invocação Lendária Designada*.\n• **Auxílio de Montaria Mítica:** Tentativas de substituição Mítica → Cupons de Desconto de Substituição de Montaria Mítica.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/753641`,
      color: 0xE67E22,
      image: { url: 'attachment://01_missoes_clemens_montaria.png' }
    }],
    files: ['./screenshots/01_missoes_clemens_montaria.png']
  });

  await new Promise(r => setTimeout(r, 1500));

  // 2. Evento de Dados & Expedição do Corvinho
  await channel.send({
    embeds: [{
      title: "2️⃣ EVENTO DE DADO: GRANDE EXPEDIÇÃO & GRANDE JORNADA DO MITO",
      description: `📅 **Período:** 01/09 até 15/09, 08:00 (UTC+8)\n🎯 **Servidores:** Todos os servidores\n\n**Como Participar:**\n• Obtenha o **[Evento] Dado da Sorte** (Missões/Loja) e **[Evento] Dado de Ouro** (Missões e conclusão de voltas).\n• Avance pelas 16 casas do tabuleiro para resgatar invocações de visual/montaria, elementos e cestas de moedas.\n\n**Recompensas por Conclusão de Voltas:**\n• **Grande Expedição (1 volta):** Baú de Dado de Ouro (Moeda da Sorte + Dado de Ouro).\n• **Grande Expedição (11 voltas):** 🎟️ **Baú de Seleção de Desafio de Invocação Lendário (Visual/Montaria)**!\n• **Grande Jornada do Mito (1 volta):** Baú de Penas de Ouro.\n• **Grande Jornada do Mito (6 voltas):** 🌟 **Baú da Lenda Selada II (Resquício Mítico + Baú Desafio Chance Dupla Lendário)**!\n• **Criação:** Use Moedas da Sorte e Penas de Ouro na aba de Criação para fabricar baús de seleção Lendários e Míticos!\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/753645`,
      color: 0x3498DB,
      image: { url: 'attachment://02_evento_dados_expedicao.png' }
    }],
    files: ['./screenshots/02_evento_dados_expedicao.png']
  });

  await new Promise(r => setTimeout(r, 1500));

  // 3. Desconto de 60% em Substituição
  await channel.send({
    embeds: [{
      title: "3️⃣ EVENTO DE 60% DE DESCONTO NO CUSTO DE SUBSTITUIÇÃO",
      description: `📅 **Período:** Após a atualização de 01/09 até antes da manutenção de 22/09\n🎯 **Servidores:** Todos os servidores\n\n**Detalhes:**\n• Ao substituir uma Montaria ou Visual de Arma obtido por invocação ou combinação antes da confirmação, haverá um **desconto de até 60%** no custo de substituição.\n• Válido para graus **Épico ou superior**.\n• Permite a utilização de até **6 Cupons de Desconto de Substituição** acumulados nas missões.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/753647`,
      color: 0x9B59B6,
      image: { url: 'attachment://03_desconto_substituicao_60.png' }
    }],
    files: ['./screenshots/03_desconto_substituicao_60.png']
  });

  console.log('Channel cleaned and all new 01/09 notices posted successfully!');
}

client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel ${channelId} is not a valid text channel`);
    }

    await cleanChannel(channel);
    await postNewNotices(channel);
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
