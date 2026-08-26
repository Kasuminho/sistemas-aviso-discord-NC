import fs from 'fs';
import path from 'path';

const webhookUrl = 'https://discord.com/api/webhooks/1538936957537751050/JGT2tcgOKgTXBMwJ4ls9SevxZFtPueN9jFJQhA79A5k9RFH28b0_Bxp8zdUA-UxNFHmF';

async function sendWebhookMessage({ content, embeds, filePath }) {
  const formData = new FormData();

  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;

  if (filePath && fs.existsSync(filePath)) {
    const filename = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('files[0]', blob, filename);
    
    // If embeds exist and need image attachment
    if (payload.embeds && payload.embeds.length > 0) {
      payload.embeds[0].image = { url: `attachment://${filename}` };
    }
  }

  formData.append('payload_json', JSON.stringify(payload));

  const res = await fetch(webhookUrl, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook failed (${res.status}): ${text}`);
  }

  console.log(`Successfully sent message with file: ${filePath ? path.basename(filePath) : 'none'}`);
  await new Promise(r => setTimeout(r, 1200)); // rate limit buffer
}

async function run() {
  console.log('Sending messages to webhook...');

  // Intro message
  await sendWebhookMessage({
    content: `📢 **RESUMO DOS NOVOS EVENTOS | 25/08/2026 - NIGHT CROWS (COMEMORAÇÃO DE 900 DIAS)**\n\nConfira abaixo o resumo completo e os prints detalhados de cada um dos eventos adicionados na manutenção desta semana!\n🔗 **Link Oficial:** https://www.nightcrows.com/pt/notice/notice/752811`,
    embeds: [{
      title: "🦅 Visão Geral das Atualizações e Eventos da Semana",
      description: "Nesta semana o NIGHT CROWS comemora **900 Dias** com uma série de eventos especiais, incluindo Check-in de 14 dias com invocações Lendárias, Roleta da Sorte do Pombinho, criação de Moedas de Celebração, Moldagem Mágica com desconto e 13 novas diretivas de missões!",
      color: 0xF37934,
      fields: [
        { name: "🎯 Servidores Alvo", value: "Todos os servidores", inline: true },
        { name: "📅 Início dos Eventos", value: "Após a atualização de 25/08/2026", inline: true }
      ]
    }]
  });

  // 1. Check-in
  await sendWebhookMessage({
    embeds: [{
      title: "1️⃣ BÔNUS DE CHECK-IN DO FESTIVAL DE CROWS 900",
      description: `📅 **Período:** Após a atualização de 25/08 até 15/09, 08:00 (UTC+8)\n🎯 **Servidores:** Todos os servidores\n\n**Destaques das Recompensas:**\n• **Dia 1:** Invocação de Montaria Deslumbrante do Crepúsculo (Vinculado) x1\n• **Dia 2:** Invocação de Visual de Arma do Pôr do Sol 11x (Vinculado) x1\n• **Dia 3 e 9:** Tônico de Celebração de 900 Dias (Vinculado) x99 (Acerto +4, Defesa +4, Dano +4 JvA por 30m)\n• **Dia 7:** 🎟️ **Bilhete de Tentativa de Invocação de Visual de Arma Lendário (Vinculado) x1**\n• **Dia 8 e 13:** Invocações Deslumbrantes do Pôr do Sol 11x (x2)\n• **Dia 14:** 🎟️ **Bilhete de Tentativa de Invocação de Montaria Lendária (Vinculado) x1**\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752800`,
      color: 0xE25041
    }],
    filePath: './screenshots/01_checkin_900_dias.png'
  });

  // 2. Roleta
  await sendWebhookMessage({
    embeds: [{
      title: "2️⃣ [900 DIAS] ROLETA DA SORTE DO POMBINHO",
      description: `📅 **Período:** Após a atualização de 25/08 até antes da manutenção de 08/09\n🎯 **Servidores:** Todos os servidores\n\n**Como Funciona:**\n• Utilize a **[Evento] Moeda Radiante do Pombinho** obtida nas missões para girar a roleta.\n• A cada **4 giros na roleta comum**, você desbloqueia **1 giro na Roleta Especial** com prêmios muito maiores de pontos!\n• Acumule pontos e troque na **Loja do Evento** por:\n  - Invocação de Espírito do Juramento (até 4x)\n  - Fruto da Árvore de Espírito da Ilusão (1x)\n  - Invocações de Espírito Deslumbrante (até 25x), Superior (até 50x) e Comum (até 100x).\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752812`,
      color: 0x3498DB
    }],
    filePath: './screenshots/02_roleta_900_dias.png'
  });

  // 3. Moldagem Mágica
  await sendWebhookMessage({
    embeds: [{
      title: "3️⃣ EVENTO DE MOLDAGEM MÁGICA",
      description: `📅 **Período:** Após a atualização de 25/08 até antes da manutenção de 08/09\n🎯 **Servidores:** Todos os servidores\n\n**Detalhes do Evento:**\n• Durante o período do evento, haverá descontos de custo e condições facilitadas para a **Moldagem Mágica e Bênção** de equipamentos.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752814`,
      color: 0x9B59B6
    }],
    filePath: './screenshots/03_moldagem_magica.png'
  });

  // 4. Criação Moeda 900 Dias
  await sendWebhookMessage({
    embeds: [{
      title: "4️⃣ EVENTO DE AUXÍLIO & CRIAÇÃO DE MOEDA DE 900 DIAS",
      description: `📅 **Obtenção das Moedas:** 25/08 a 08/09 | **Período de Criação:** 25/08 a 15/09, 08:00 (UTC+8)\n🎯 **Servidores:** Todos os servidores\n\n**Como Obter:**\n• Conclua campanhas diárias: ganhe **30 moedas por campanha** (até **900 moedas/dia**, totalizando até 12.600 moedas no evento!).\n\n**Itens para Criar na Oficina:**\n• Tônico de Celebração de 900 Dias (10x/dia)\n• Invocação de Visual de Arma e Montaria Deslumbrante do Pôr do Sol 11x (5x cada)\n• Extração de Elemento Deslumbrante da Harmonia 11x (10x)\n• Pétalas Consumidas pela Luz Estelar, Fragmentos do Caos e Baús de Cristais de Magia (Incomum, Raro e Épico)\n• Baú de Visual de Arma de Monstro, Bolas de Cristal e Cristais da Libertação.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752815`,
      color: 0xF1C40F
    }],
    filePath: './screenshots/04_criacao_moeda_900_dias.png'
  });

  // 5. Criação de Evento
  await sendWebhookMessage({
    embeds: [{
      title: "5️⃣ CRIAÇÃO DE EVENTO (RECEITAS ESPECIAIS)",
      description: `📅 **Período:** Após a atualização de 25/08 até antes da manutenção de 08/09\n🎯 **Servidores:** Todos os servidores\n\n**Detalhes:**\n• Abertura de receitas temporárias na aba de Criação do menu de Eventos com limites por personagem/semana.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752813`,
      color: 0x2ECC71
    }],
    filePath: './screenshots/05_criacao_evento.png'
  });

  // 6. Hora do Bônus (Hot Time)
  await sendWebhookMessage({
    embeds: [{
      title: "6️⃣ EVENTO DA HORA DO BÔNUS (HOT TIME)",
      description: `📅 **Período:** Após a atualização de 25/08 até 06/09, 23:59 (UTC+8)\n🎯 **Servidores:** Todos os servidores\n\n**Bônus Ativos:**\n• Aumento nas taxas de obtenção de **Experiência (EXP)** e **Ouro** nos horários programados de Hot Time para acelerar o progresso dos personagens.\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752816`,
      color: 0xE67E22
    }],
    filePath: './screenshots/06_hora_do_bonus.png'
  });

  // 7. Desafio Rumo ao Pico e Missões
  await sendWebhookMessage({
    embeds: [{
      title: "7️⃣ DESAFIO RUMO AO PICO & 13 DIRETIVAS DE MISSÕES (900 DIAS)",
      description: `📅 **Período:** Após a atualização de 25/08 (datas de término variam de 01/09 a 22/09 conforme a missão)\n🎯 **Servidores:** Todos os servidores\n\n**Conjunto Completo de 13 Missões do Evento:**\n1. **Desafio Rumo ao Pico (Setembro):** Fusões e Invocações Épicas → Recompensa Final: Baú de Seleção de Invocação Designada de Elemento/Visual/Montaria Lendária.\n2. **Moeda Radiante do Pombinho:** Campanhas, monstros e gasto de ouro → Moedas da Roleta e Bola de Cristal do Flor x9.\n3. **Presente de Comemoração dos Piadores:** Desmontagem e criação de equipamentos → Peças de Voo e Pedaço de Céu Azul x10.\n4. **Provisão de Batalha Especial:** Fortalecimento e refino de equipamentos → Baús de Seleção de Equipamento dos Corvos da Noite VI.\n5. **Missão Conjunta Gaspard & Alberto:** Fortalecimento de equipamentos e ferramentas de voo → Baú de Seleção Gaspard e Alberto.\n6. **Oficina Secreta de Planador:** Uso de Kits de Planador da Oficina Secreta → Baú de Planador Lendário (Vinculado).\n7. **Diretiva de Fortalecimento de Equipamento (Gaspard):** Sucessos de refino +3 a +6 → Baús dos Corvos da Noite VI a VIII.\n8. **Diretiva de Elite de Equipamento (Gaspard):** Fortalecimento +4 a +7 → Lingotes de Equipamento dos Corvos da Noite.\n9. **Diretiva de Planador de Alberto:** Criação e uso de Ferramentas de Voo do Artesão → Baú de Troca de Planador Lendário.\n10. **Diretiva de Desafio de Planador Mítico:** Uso de Ferramentas de Voo de Alberto → Morion x100 e Baú do Desafio de Planador Mítico!\n11. **Presente Especial do Pombinho:** Obtenção acumulada de Pontos da Roleta → Invocações de Espírito do Juramento x3.\n12. **Missão de Auxílio Semanal:** Campanhas, Raides e Masmorras → Moedas de Abilius x1 a x5.\n13. **Missão de Obtenção de Moeda de Abilius:** Acúmulo de moedas → Baús de Seleção de Invocação Épica de Abilius!\n\n🔗 Link direto: https://www.nightcrows.com/pt/notice/event/ongoing/752809`,
      color: 0x1ABC9C
    }],
    filePath: './screenshots/07_desafio_pico_missoes.png'
  });

  console.log('All webhook messages sent successfully!');
}

run().catch(console.error);
