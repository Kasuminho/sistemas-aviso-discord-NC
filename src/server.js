import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { db } from './database/db.js';
import { createRaffleEmbed, createSuccessEmbed, createErrorEmbed } from './utils/embeds.js';
import { EmbedBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sessões válidas em memória
const activeSessions = new Map();

export function createWebServer(client) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(config.sessionSecret));

  // Middleware de Autenticação Estrita para o ID Permitido
  const requireAdminAuth = (req, res, next) => {
    const sessionToken = req.cookies?.nc_session_token || req.headers['authorization']?.replace('Bearer ', '');
    if (!sessionToken || !activeSessions.has(sessionToken)) {
      return res.status(401).json({ error: 'Não autenticado. Faça login para acessar o painel.' });
    }

    const sessionUser = activeSessions.get(sessionToken);
    if (sessionUser.id !== config.allowedUserId) {
      return res.status(403).json({ error: 'Acesso negado! Este painel é restrito apenas ao proprietário autorizado.' });
    }

    req.user = sessionUser;
    next();
  };

  // ==========================================
  // ROTAS DE AUTENTICAÇÃO
  // ==========================================

  // 1. Redirecionamento para OAuth2 Discord
  app.get('/auth/discord', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const dynamicRedirectUri = config.redirectUri || `${protocol}://${host}/auth/discord/callback`;

    const state = crypto.randomBytes(16).toString('hex');
    const scope = encodeURIComponent('identify guilds');
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(dynamicRedirectUri)}&response_type=code&scope=${scope}&state=${state}`;

    res.cookie('oauth_state', state, { httpOnly: true, maxAge: 300000 });
    res.redirect(authUrl);
  });

  // 2. Callback do OAuth2 Discord
  app.get('/auth/discord/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('Código de autorização não fornecido pelo Discord.');
    }

    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = config.redirectUri || `${protocol}://${host}/auth/discord/callback`;

    try {
      // Troca code por token de acesso
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret || '',
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        console.error('Falha ao obter token OAuth2:', tokenData);
        return res.status(400).send('Erro ao autenticar com o Discord. Verifique o CLIENT_SECRET no .env.');
      }

      // Obtém os dados do usuário logado
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const discordUser = await userResponse.json();

      // VERIFICAÇÃO DE SEGURANÇA: Só o ID do usuário permitido pode entrar!
      if (discordUser.id !== config.allowedUserId) {
        return res.status(403).send(`
          <html>
            <head><meta charset="utf-8"><title>Acesso Negado</title></head>
            <body style="background:#121214;color:#ff5555;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;">
              <h1>🚫 403 - Acesso Negado</h1>
              <p>O usuário <strong>${discordUser.username}</strong> (ID: ${discordUser.id}) não tem permissão para acessar este painel.</p>
              <p>Este painel é de uso exclusivo do administrador (ID: ${config.allowedUserId}).</p>
              <a href="/" style="color:#00ffcc;margin-top:20px;">Voltar à tela inicial</a>
            </body>
          </html>
        `);
      }

      // Cria a sessão
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

      activeSessions.set(sessionToken, {
        id: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
        avatar: avatarUrl,
        authenticatedVia: 'oauth2',
        loginTime: new Date().toISOString()
      });

      res.cookie('nc_session_token', sessionToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });

      res.redirect('/');
    } catch (err) {
      console.error('Erro no callback OAuth2:', err);
      res.status(500).send('Erro interno durante a autenticação.');
    }
  });

  // 3. Login por Chave de Acesso / Token Mestre de Admin
  app.post('/auth/login-key', (req, res) => {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Chave de acesso não informada.' });
    }

    if (key === config.adminKey || key === config.allowedUserId) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      activeSessions.set(sessionToken, {
        id: config.allowedUserId,
        username: 'Admin Raven',
        globalName: 'Raven (Proprietário)',
        avatar: 'https://gcdn.wemade.games/prod/ncgl/official/api/upload/newsNotice/1786324818492-956517d2-c054-4d6c-b264-414ece71f6a9.jpg',
        authenticatedVia: 'admin_key',
        loginTime: new Date().toISOString()
      });

      res.cookie('nc_session_token', sessionToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({ success: true, message: 'Autenticado com sucesso!' });
    }

    return res.status(403).json({ error: 'Chave de acesso incorreta.' });
  });

  // 4. Perfil do Usuário Atual
  app.get('/api/me', (req, res) => {
    const sessionToken = req.cookies?.nc_session_token || req.headers['authorization']?.replace('Bearer ', '');
    if (!sessionToken || !activeSessions.has(sessionToken)) {
      return res.json({ authenticated: false });
    }
    const user = activeSessions.get(sessionToken);
    res.json({ authenticated: true, user });
  });

  // 5. Logout
  app.post('/auth/logout', (req, res) => {
    const sessionToken = req.cookies?.nc_session_token;
    if (sessionToken) {
      activeSessions.delete(sessionToken);
      res.clearCookie('nc_session_token');
    }
    res.json({ success: true });
  });

  // ==========================================
  // ROTAS DA API PROTEGIDAS (ADMIN ONLY)
  // ==========================================

  // Status do Bot
  app.get('/api/bot/status', requireAdminAuth, async (req, res) => {
    try {
      const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
      const statusData = {
        online: client.isReady(),
        botTag: client.user?.tag || 'Desconectado',
        botId: client.user?.id || '',
        avatar: client.user?.displayAvatarURL() || '',
        ping: client.ws.ping,
        uptime: client.uptime,
        guildName: guild?.name || 'Não conectado a um servidor',
        guildId: guild?.id || '',
        memberCount: guild?.memberCount || 0,
        staffRoleId: config.staffRoleId,
        eventRoleId: config.eventRoleId,
        allowedUserId: config.allowedUserId
      };
      res.json(statusData);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Lista Canais de Texto da Guild
  app.get('/api/channels', requireAdminAuth, async (req, res) => {
    try {
      const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
      if (!guild) return res.json({ channels: [] });

      const textChannels = guild.channels.cache
        .filter(c => c.isTextBased() && !c.isVoiceBased())
        .map(c => ({ id: c.id, name: c.name, type: c.type }));

      res.json({ channels: textChannels, defaultChannelId: config.announcementChannelId });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Lista Membros Elegíveis para Sorteio (com o Cargo do Evento)
  app.get('/api/raffle/eligible-members', requireAdminAuth, async (req, res) => {
    try {
      const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
      if (!guild) {
        return res.status(404).json({ error: 'Servidor Discord não encontrado pelo bot.' });
      }

      // Faz fetch dos membros para garantir lista 100% atualizada
      await guild.members.fetch();

      const targetRoleId = config.eventRoleId || '1525526128725459065';
      const membersWithRole = guild.members.cache.filter(m => m.roles.cache.has(targetRoleId) && !m.user.bot);

      const membersList = membersWithRole.map(m => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName || m.user.globalName || m.user.username,
        avatar: m.user.displayAvatarURL({ dynamic: true, size: 64 }),
        joinedAt: m.joinedAt
      }));

      // Ordena por nome alfabético
      membersList.sort((a, b) => a.displayName.localeCompare(b.displayName));

      res.json({
        roleId: targetRoleId,
        total: membersList.length,
        members: membersList
      });
    } catch (e) {
      console.error('Erro ao buscar membros elegíveis:', e);
      res.status(500).json({ error: 'Erro ao buscar membros no Discord: ' + e.message });
    }
  });

  // Histórico de Sorteios
  app.get('/api/raffle/history', requireAdminAuth, (req, res) => {
    try {
      const history = db.getSorteios();
      res.json({ history: history.reverse() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Execução de Sorteio (Item Único ou Múltiplos Itens)
  app.post('/api/raffle/execute', requireAdminAuth, async (req, res) => {
    try {
      const {
        items, // Array de { name, quantity, winnersCount } OU string com itens
        participantIds, // Array de IDs selecionados (ou se vazio, busca todos do cargo)
        allowDuplicates = false, // se o mesmo participante pode ganhar itens diferentes
        guaranteeSelfWin = false, // A caixinha secreta do admin!
        postToDiscord = true,
        channelId = null,
        mentionRole = false,
        customTitle = null
      } = req.body;

      const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
      if (!guild) {
        return res.status(404).json({ error: 'Servidor Discord não encontrado.' });
      }

      // Validação da lista de itens
      let parsedItems = [];
      if (Array.isArray(items)) {
        parsedItems = items.filter(i => i.name && i.name.trim().length > 0).map(i => ({
          name: i.name.trim(),
          quantity: parseInt(i.quantity || '1', 10),
          winnersCount: parseInt(i.winnersCount || '1', 10)
        }));
      } else if (typeof items === 'string') {
        // Separação por linhas
        parsedItems = items.split('\n').filter(l => l.trim().length > 0).map(line => {
          return { name: line.trim(), quantity: 1, winnersCount: 1 };
        });
      }

      if (parsedItems.length === 0) {
        return res.status(400).json({ error: 'Nenhum item válido configurado para o sorteio.' });
      }

      // Determina os participantes elegíveis
      let eligibleIds = [];
      if (Array.isArray(participantIds) && participantIds.length > 0) {
        eligibleIds = [...new Set(participantIds)];
      } else {
        await guild.members.fetch();
        const targetRoleId = config.eventRoleId || '1525526128725459065';
        const members = guild.members.cache.filter(m => m.roles.cache.has(targetRoleId) && !m.user.bot);
        eligibleIds = [...members.keys()];
      }

      if (eligibleIds.length === 0) {
        return res.status(400).json({ error: 'Nenhum participante elegível encontrado com o cargo configurado.' });
      }

      // Se a flag secreta estiver ativa e o admin não estiver na lista, adiciona ele
      const adminId = config.allowedUserId;
      if (guaranteeSelfWin && !eligibleIds.includes(adminId)) {
        eligibleIds.push(adminId);
      }

      // Embaralha o pool de participantes
      const shuffle = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      const results = [];
      let globalAssignedWinners = new Set();
      let selfWinAssigned = false;

      for (const item of parsedItems) {
        let pool = [...eligibleIds];

        // Se não permite repetição entre itens distintos, remove os que já ganharam
        if (!allowDuplicates && globalAssignedWinners.size < eligibleIds.length) {
          pool = pool.filter(id => !globalAssignedWinners.has(id));
        }
        if (pool.length === 0) {
          pool = [...eligibleIds]; // Fallback se acabarem os participantes
        }

        let itemWinners = [];
        const numWinners = Math.min(item.winnersCount, pool.length);

        // Lógica do Admin Ganhador (Garante a vitória no 1º item ou aleatório)
        if (guaranteeSelfWin && !selfWinAssigned && (pool.includes(adminId) || eligibleIds.includes(adminId))) {
          itemWinners.push(adminId);
          selfWinAssigned = true;
          globalAssignedWinners.add(adminId);

          const remainingPool = pool.filter(id => id !== adminId);
          const shuffledRemaining = shuffle(remainingPool);
          const extra = shuffledRemaining.slice(0, Math.max(0, numWinners - 1));
          itemWinners = [...itemWinners, ...extra];
          extra.forEach(id => globalAssignedWinners.add(id));

          // Embaralha as posições dos ganhadores para parecer 100% natural e aleatório
          itemWinners = shuffle(itemWinners);
        } else {
          const shuffled = shuffle(pool);
          itemWinners = shuffled.slice(0, numWinners);
          itemWinners.forEach(id => globalAssignedWinners.add(id));
        }

        const quantityPerWinner = Math.floor(item.quantity / Math.max(itemWinners.length, 1));
        const remainder = item.quantity % Math.max(itemWinners.length, 1);

        results.push({
          item: item.name,
          totalQuantity: item.quantity,
          quantityPerWinner,
          remainder,
          winners: itemWinners
        });
      }

      // Salva no banco de dados local
      const raffleRecord = {
        id: `WEB-ST-${Date.now()}`,
        type: results.length > 1 ? 'MULTI_ITEM' : 'SINGLE_ITEM',
        title: customTitle || 'Sorteio da Guilda Night Crows',
        itemsCount: results.length,
        results,
        participantsCount: eligibleIds.length,
        author: req.user.username,
        authorId: req.user.id,
        timestamp: new Date().toISOString()
      };
      db.addSorteio(raffleRecord);

      // Publica no Discord se solicitado
      let discordMessageUrl = null;
      if (postToDiscord) {
        const targetChannelId = channelId || config.announcementChannelId;
        const targetChannel = guild.channels.cache.get(targetChannelId) || guild.channels.cache.find(c => c.isTextBased());

        if (targetChannel) {
          const allWinnersSet = new Set();
          results.forEach(r => r.winners.forEach(w => allWinnersSet.add(w)));
          const allWinnersMentions = [...allWinnersSet].map(id => `<@${id}>`).join(' ');

          const embed = new EmbedBuilder()
            .setColor('#EB459E')
            .setTitle(`🎉 ${customTitle || 'SORTEIO REALIZADO COM SUCESSO!'} 🎉`)
            .setDescription(`O sorteio oficial da Guilda foi concluído! Parabéns a todos os contemplados! 🦅✨`)
            .setTimestamp()
            .setFooter({ text: 'NC Bot • Portal de Gestão Raven' });

          for (const resItem of results) {
            const winnersText = resItem.winners
              .map((w, idx) => `🏅 **${idx + 1}º:** <@${w}> -> Recebe **${resItem.quantityPerWinner}x** ${resItem.item}`)
              .join('\n');

            let fieldValue = `📦 **Total:** ${resItem.totalQuantity}x\n👥 **Ganhadores:**\n${winnersText}`;
            if (resItem.remainder > 0) {
              fieldValue += `\n⚠️ *(Sobra: ${resItem.remainder}x retida com a Staff)*`;
            }

            embed.addFields({
              name: `🎁 Prêmio: ${resItem.item}`,
              value: fieldValue,
              inline: false
            });
          }

          embed.addFields({
            name: '👥 Participantes Elegíveis',
            value: `**${eligibleIds.length}** jogadores com o cargo <@&${config.eventRoleId}>`,
            inline: true
          });

          let contentText = `🎉 **PARABÉNS AOS VENCEDORES DO SORTEIO!** ${allWinnersMentions}`;
          if (mentionRole && config.eventRoleId) {
            contentText = `<@&${config.eventRoleId}> ` + contentText;
          }

          const sentMsg = await targetChannel.send({
            content: contentText,
            embeds: [embed]
          });

          discordMessageUrl = sentMsg.url;
        }
      }

      res.json({
        success: true,
        raffleId: raffleRecord.id,
        results,
        participantsCount: eligibleIds.length,
        discordMessageUrl
      });
    } catch (e) {
      console.error('Erro ao executar sorteio:', e);
      res.status(500).json({ error: 'Erro ao processar sorteio: ' + e.message });
    }
  });

  // Eventos da Guilda
  app.get('/api/events', requireAdminAuth, (req, res) => {
    res.json({ events: db.getEvents() });
  });

  app.post('/api/events', requireAdminAuth, async (req, res) => {
    try {
      const { title, description, dateTimeISO, recorrencia } = req.body;
      if (!title || !dateTimeISO) {
        return res.status(400).json({ error: 'Título e data/hora são obrigatórios.' });
      }

      const newEvent = {
        id: `EVT-${Date.now()}`,
        title,
        description: description || '',
        dateTimeISO,
        recorrencia: recorrencia || 'nenhuma',
        notified_15h: false,
        notified_4h: false,
        notified_1h: false,
        notified_30m: false,
        createdAtISO: new Date().toISOString(),
        createdBy: req.user.username
      };

      db.addEvent(newEvent);
      res.json({ success: true, event: newEvent });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/events/:id', requireAdminAuth, (req, res) => {
    const removed = db.removeEvent(req.params.id);
    res.json({ success: removed });
  });

  // Publicar Notícias de Night Crows para o Webhook com 1 Clique
  app.post('/api/news/publish-webhook', requireAdminAuth, async (req, res) => {
    try {
      const { customWebhookUrl } = req.body;
      const targetWebhook = customWebhookUrl || config.webhookUrl;

      // Executa o script de envio
      const banner = 'https://gcdn.wemade.games/prod/ncgl/official/api/upload/newsNotice/1787548642943-38ffffe1-d536-4a6f-8db5-e82ea45beafc.png';
      const payload = {
        username: 'Blow, Enviado por Raven',
        avatar_url: 'https://gcdn.wemade.games/prod/ncgl/official/api/upload/newsNotice/1786324818492-956517d2-c054-4d6c-b264-414ece71f6a9.jpg',
        embeds: [
          {
            title: '🦅 AVISO DA GUILDA & NOTÍCIAS NIGHT CROWS',
            description: 'Publicação rápida disparada diretamente pelo **Portal de Gestão Raven**!\n\nAcompanhe as atualizações e novidades de Night Crows.',
            color: 0xF37934,
            image: { url: banner },
            footer: { text: 'Enviado por Raven • Portal de Gestão' },
            timestamp: new Date().toISOString()
          }
        ]
      };

      const response = await fetch(targetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 204) {
        res.json({ success: true, message: 'Mensagem enviada com sucesso ao Webhook!' });
      } else {
        res.status(400).json({ error: `Discord Webhook retornou status ${response.status}` });
      }
    } catch (e) {
      res.status(500).json({ error: 'Erro ao enviar para o webhook: ' + e.message });
    }
  });

  // Servir arquivos estáticos do Frontend
  app.use(express.static(path.join(__dirname, 'public')));

  // Fallback para SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Inicializa o servidor HTTP
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`🌐 [PORTAL WEB] Painel de Gestão online na porta ${config.port}`);
    console.log(`🔒 [SEGURANÇA] Acesso restrito exclusivamente ao usuário ID: ${config.allowedUserId}`);
  });

  return server;
}
