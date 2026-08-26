// Estado da Aplicação
const state = {
  user: null,
  eligibleMembers: [],
  channels: [],
  multiItems: [
    { name: '10.000 Diamantes', quantity: 10000, winnersCount: 1 },
    { name: 'Baú de Seleção Lendário', quantity: 2, winnersCount: 2 }
  ],
  isMultiMode: false
};

// Elementos DOM
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const keyLoginForm = document.getElementById('keyLoginForm');
const adminKeyInput = document.getElementById('adminKeyInput');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Perfil Topo / Sidebar
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userId = document.getElementById('userId');
const eligibleCountHeader = document.getElementById('eligibleCountHeader');
const pingTag = document.getElementById('pingTag');
const botStatusTag = document.getElementById('botStatusTag');
const roleLabelTag = document.getElementById('roleLabelTag');

// Navegação
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// Sorteio
const raffleForm = document.getElementById('raffleForm');
const singleModeBtn = document.getElementById('singleModeBtn');
const multiModeBtn = document.getElementById('multiModeBtn');
const singleItemSection = document.getElementById('singleItemSection');
const multiItemSection = document.getElementById('multiItemSection');
const multiItemsContainer = document.getElementById('multiItemsContainer');
const addPrizeBtn = document.getElementById('addPrizeBtn');
const membersListContainer = document.getElementById('membersListContainer');
const memberCountBadge = document.getElementById('memberCountBadge');
const memberSearchInput = document.getElementById('memberSearchInput');
const refreshMembersBtn = document.getElementById('refreshMembersBtn');
const targetChannelSelect = document.getElementById('targetChannelSelect');

// Modal
const raffleResultModal = document.getElementById('raffleResultModal');
const modalResultBody = document.getElementById('modalResultBody');
const discordLinkBtn = document.getElementById('discordLinkBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeModalBtn2 = document.getElementById('closeModalBtn2');

// ==========================================
// INICIALIZAÇÃO E AUTENTICAÇÃO
// ==========================================
async function initApp() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();

    if (data.authenticated && data.user) {
      state.user = data.user;
      showApp();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    showLogin();
  }
}

function showLogin() {
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

function showApp() {
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');

  userAvatar.src = state.user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
  userName.textContent = state.user.globalName || state.user.username;
  userId.textContent = `ID: ${state.user.id}`;

  loadBotStatus();
  loadChannels();
  loadEligibleMembers();
  renderMultiItems();
}

// Login por Chave
keyLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const key = adminKeyInput.value.trim();

  try {
    const res = await fetch('/auth/login-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      window.location.reload();
    } else {
      loginError.textContent = data.error || 'Chave incorreta.';
    }
  } catch (err) {
    loginError.textContent = 'Erro de conexão com o servidor.';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.reload();
});

// ==========================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    item.classList.add('active');
    const tabId = item.dataset.tab;
    document.getElementById(tabId).classList.add('active');

    // Atualiza cabeçalho
    if (tabId === 'raffleTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-dice"></i> Central de Sorteios';
      pageSubtitle.textContent = 'Sorteie itens para todos os membros com o cargo oficial de forma rápida e segura.';
    } else if (tabId === 'membersTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-users-gear"></i> Tabelão & Elegibilidade da Guilda';
      pageSubtitle.textContent = 'Gerencie a pontuação semanal de boss, faltas, pontos de corte e verifique a elegibilidade dos membros.';
      loadMembersTab();
    } else if (tabId === 'historyTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Histórico de Sorteios';
      pageSubtitle.textContent = 'Registro detalhado de todos os sorteios e ganhadores passados.';
      loadRaffleHistory();
    } else if (tabId === 'eventsTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-calendar-days"></i> Eventos da Guilda';
      pageSubtitle.textContent = 'Gerenciamento de eventos e disparos de avisos automáticos.';
      loadGuildEvents();
    } else if (tabId === 'newsTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-newspaper"></i> Publicador de Notícias';
      pageSubtitle.textContent = 'Dispare avisos de atualização e eventos de Night Crows diretamente no Discord.';
    } else if (tabId === 'statusTab') {
      pageTitle.innerHTML = '<i class="fa-solid fa-server"></i> Status do Bot';
      pageSubtitle.textContent = 'Informações técnicas e monitoramento em tempo real da instância.';
      loadBotStatus();
    }
  });
});

// ==========================================
// STATUS DO BOT & CANAIS
// ==========================================
async function loadBotStatus() {
  try {
    const res = await fetch('/api/bot/status');
    const data = await res.json();

    if (data.online) {
      botStatusTag.textContent = `Bot: ${data.botTag}`;
      pingTag.textContent = `Ping: ${data.ping}ms`;
      document.getElementById('infoBotTag').textContent = data.botTag;
      document.getElementById('infoGuildName').textContent = `${data.guildName} (${data.memberCount} membros)`;
      document.getElementById('infoStaffRole').textContent = data.staffRoleId;
      document.getElementById('infoEventRole').textContent = data.eventRoleId;
      document.getElementById('infoAllowedId').textContent = data.allowedUserId;
      
      const hours = Math.floor(data.uptime / 3600000);
      const minutes = Math.floor((data.uptime % 3600000) / 60000);
      document.getElementById('infoUptime').textContent = `${hours}h ${minutes}m`;
    }
  } catch (err) {
    console.error('Erro ao carregar status do bot:', err);
  }
}

async function loadChannels() {
  try {
    const res = await fetch('/api/channels');
    const data = await res.json();

    targetChannelSelect.innerHTML = '';
    if (data.channels && data.channels.length > 0) {
      data.channels.forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = `# ${ch.name}`;
        if (ch.id === data.defaultChannelId) {
          opt.selected = true;
        }
        targetChannelSelect.appendChild(opt);
      });
    } else {
      targetChannelSelect.innerHTML = '<option value="">Nenhum canal encontrado</option>';
    }
  } catch (err) {
    console.error('Erro ao carregar canais:', err);
  }
}

// ==========================================
// MEMBROS ELEGÍVEIS
// ==========================================
async function loadEligibleMembers() {
  membersListContainer.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando membros...</div>';
  
  try {
    const res = await fetch('/api/raffle/eligible-members');
    const data = await res.json();

    if (res.ok && data.members) {
      state.eligibleMembers = data.members;
      memberCountBadge.textContent = `${data.eligibleTotal}/${data.total} Elegíveis`;
      eligibleCountHeader.textContent = `Cadastrados: ${data.total} (${data.eligibleTotal} Elegíveis)`;
      document.getElementById('cargoNameDisplay').textContent = 'Membros Cadastrados (Status)';
      roleLabelTag.textContent = 'Banco de Status NC';
      renderMembersGrid(data.members);
    } else {
      membersListContainer.innerHTML = `<div class="error-msg">${data.error || 'Erro ao buscar membros'}</div>`;
    }
  } catch (err) {
    membersListContainer.innerHTML = '<div class="error-msg">Falha na comunicação com a API.</div>';
  }
}

function renderMembersGrid(members) {
  membersListContainer.innerHTML = '';
  if (members.length === 0) {
    membersListContainer.innerHTML = '<div class="role-desc">Nenhum membro cadastrou status ainda. Envie /registrar-status no Discord.</div>';
    return;
  }

  members.forEach(m => {
    const pill = document.createElement('div');
    pill.className = `member-pill ${m.eligible ? 'selected' : 'unselected'}`;
    const badgeText = m.eligible ? '🟢 Elegível' : `🔴 Inapto (${m.reasons ? m.reasons.length : 0})`;
    const titleText = m.eligible 
      ? `${m.displayName} (PC: ${m.pc.toLocaleString('pt-BR')} | Boss: ${m.weeklyBossScore}pts)`
      : `${m.displayName} - ${m.reasons ? m.reasons.join(', ') : 'Inapto'}`;
    
    pill.title = titleText;
    pill.innerHTML = `
      <img src="${m.avatar}" alt="${m.displayName}" loading="lazy">
      <span style="font-weight:600;">${m.displayName}</span>
      <small style="font-size:10px; opacity:0.85; margin-left:4px;">${badgeText}</small>
    `;
    membersListContainer.appendChild(pill);
  });
}

// Filtro de membros
memberSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = state.eligibleMembers.filter(m => 
    m.displayName.toLowerCase().includes(query) || 
    m.username.toLowerCase().includes(query) ||
    m.id.includes(query)
  );
  renderMembersGrid(filtered);
});

refreshMembersBtn.addEventListener('click', loadEligibleMembers);

// ==========================================
// MODO ITEM ÚNICO / MÚLTIPLOS PRÊMIOS
// ==========================================
singleModeBtn.addEventListener('click', () => {
  state.isMultiMode = false;
  singleModeBtn.classList.add('active');
  multiModeBtn.classList.remove('active');
  singleItemSection.classList.remove('hidden');
  multiItemSection.classList.add('hidden');
  document.getElementById('singleItemName').required = true;
});

multiModeBtn.addEventListener('click', () => {
  state.isMultiMode = true;
  multiModeBtn.classList.add('active');
  singleModeBtn.classList.remove('active');
  multiItemSection.classList.remove('hidden');
  singleItemSection.classList.add('hidden');
  document.getElementById('singleItemName').required = false;
});

function renderMultiItems() {
  multiItemsContainer.innerHTML = '';
  state.multiItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'multi-item-row';
    row.innerHTML = `
      <input type="text" placeholder="Nome do Prêmio ${index + 1}" value="${item.name}" required onchange="updateMultiItem(${index}, 'name', this.value)">
      <input type="number" placeholder="Qtd" value="${item.quantity}" min="1" required title="Quantidade do Item" onchange="updateMultiItem(${index}, 'quantity', this.value)">
      <input type="number" placeholder="Ganhadores" value="${item.winnersCount}" min="1" required title="Número de Ganhadores" onchange="updateMultiItem(${index}, 'winnersCount', this.value)">
      <button type="button" class="btn-remove-item" onclick="removeMultiItem(${index})" title="Remover"><i class="fa-solid fa-trash"></i></button>
    `;
    multiItemsContainer.appendChild(row);
  });
}

window.updateMultiItem = (index, field, value) => {
  if (field === 'name') state.multiItems[index].name = value;
  else state.multiItems[index][field] = parseInt(value || '1', 10);
};

window.removeMultiItem = (index) => {
  if (state.multiItems.length > 1) {
    state.multiItems.splice(index, 1);
    renderMultiItems();
  }
};

addPrizeBtn.addEventListener('click', () => {
  state.multiItems.push({ name: '', quantity: 1, winnersCount: 1 });
  renderMultiItems();
});

// ==========================================
// EXECUÇÃO DO SORTEIO
// ==========================================
raffleForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const executeBtn = document.getElementById('executeRaffleBtn');
  executeBtn.disabled = true;
  executeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> SORTEANDO...';

  // Monta a lista de itens
  let itemsToRaffle = [];
  if (!state.isMultiMode) {
    itemsToRaffle = [{
      name: document.getElementById('singleItemName').value.trim(),
      quantity: parseInt(document.getElementById('singleItemQty').value, 10),
      winnersCount: parseInt(document.getElementById('singleItemWinners').value, 10)
    }];
  } else {
    itemsToRaffle = state.multiItems.filter(i => i.name.trim().length > 0);
  }

  const payload = {
    items: itemsToRaffle,
    allowDuplicates: document.getElementById('allowDuplicatesCheck').checked,
    guaranteeSelfWin: document.getElementById('guaranteeSelfWinCheck').checked,
    postToDiscord: document.getElementById('postDiscordCheck').checked,
    channelId: targetChannelSelect.value,
    mentionRole: document.getElementById('mentionRoleCheck').checked,
    customTitle: document.getElementById('customTitleInput').value.trim() || null
  };

  try {
    const res = await fetch('/api/raffle/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      // Dispara Confetti comemorativo!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Exibe Modal de Resultados
      showRaffleResultModal(data);
    } else {
      alert(`❌ Erro ao realizar sorteio: ${data.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    alert('❌ Erro de comunicação com o servidor.');
  } finally {
    executeBtn.disabled = false;
    executeBtn.innerHTML = '<i class="fa-solid fa-dice-d20"></i> REALIZAR SORTEIO AGORA';
  }
});

function showRaffleResultModal(data) {
  modalResultBody.innerHTML = '';

  data.results.forEach((resItem, idx) => {
    const itemBlock = document.createElement('div');
    itemBlock.style.marginBottom = '16px';
    itemBlock.innerHTML = `
      <h3 style="color:var(--gold-primary);margin-bottom:8px;font-size:15px;">
        <i class="fa-solid fa-gift"></i> Prêmio ${idx + 1}: ${resItem.item} (${resItem.totalQuantity}x total)
      </h3>
    `;

    resItem.winners.forEach((wId, wIdx) => {
      // Procura o nome do membro
      const member = state.eligibleMembers.find(m => m.id === wId);
      const memberName = member ? member.displayName : `Usuário (ID: ${wId})`;
      const memberAvatar = member ? member.avatar : 'https://cdn.discordapp.com/embed/avatars/0.png';

      const winnerRow = document.createElement('div');
      winnerRow.className = 'winner-item';
      winnerRow.innerHTML = `
        <div class="winner-info">
          <span class="winner-medal">🥇</span>
          <img src="${memberAvatar}" style="width:32px;height:32px;border-radius:50%;" alt="${memberName}">
          <div>
            <div class="winner-name">${memberName}</div>
            <div style="font-size:11px;color:var(--text-muted);">ID: ${wId}</div>
          </div>
        </div>
        <div class="winner-prize">${resItem.quantityPerWinner}x ${resItem.item}</div>
      `;
      itemBlock.appendChild(winnerRow);
    });

    modalResultBody.appendChild(itemBlock);
  });

  if (data.discordMessageUrl) {
    discordLinkBtn.href = data.discordMessageUrl;
    discordLinkBtn.classList.remove('hidden');
  } else {
    discordLinkBtn.classList.add('hidden');
  }

  raffleResultModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => raffleResultModal.classList.add('hidden'));
closeModalBtn2.addEventListener('click', () => raffleResultModal.classList.add('hidden'));

// ==========================================
// HISTÓRICO DE SORTEIOS
// ==========================================
async function loadRaffleHistory() {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</td></tr>';

  try {
    const res = await fetch('/api/raffle/history');
    const data = await res.json();

    if (data.history && data.history.length > 0) {
      tbody.innerHTML = '';
      data.history.forEach(st => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(st.timestamp).toLocaleString('pt-BR');
        
        let prizesText = '';
        let winnersText = '';

        if (st.results) {
          prizesText = st.results.map(r => `• ${r.totalQuantity}x ${r.item}`).join('<br>');
          winnersText = st.results.map(r => r.winners.map(w => `<span class="badge" style="background:rgba(212,175,55,0.2);color:#fff;"><@${w}></span>`).join(' ')).join('<br>');
        } else {
          prizesText = `${st.totalQuantity}x ${st.item}`;
          winnersText = st.winners.map(w => `<span class="badge"><@${w}></span>`).join(' ');
        }

        tr.innerHTML = `
          <td>${dateFormatted}</td>
          <td><code>${st.id}</code></td>
          <td><span class="badge">${st.type || 'ÚNICO'}</span></td>
          <td>${prizesText}</td>
          <td>${winnersText}</td>
          <td>${st.participantsCount || '--'}</td>
          <td>${st.author || 'Staff'}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum sorteio registrado ainda.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center error-msg">Erro ao carregar histórico.</td></tr>';
  }
}

document.getElementById('refreshHistoryBtn')?.addEventListener('click', loadRaffleHistory);

// ==========================================
// EVENTOS DA GUILDA
// ==========================================
async function loadGuildEvents() {
  const container = document.getElementById('eventsListContainer');
  container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';

  try {
    const res = await fetch('/api/events');
    const data = await res.json();

    if (data.events && data.events.length > 0) {
      container.innerHTML = '';
      data.events.forEach(evt => {
        const item = document.createElement('div');
        item.className = 'winner-item';
        item.style.border = '1px solid rgba(212, 175, 55, 0.2)';
        item.style.background = 'rgba(0, 0, 0, 0.3)';

        const dt = new Date(evt.dateTimeISO).toLocaleString('pt-BR');
        item.innerHTML = `
          <div>
            <h4 style="color:var(--gold-primary);font-size:14px;">${evt.title}</h4>
            <p style="font-size:12px;color:var(--text-muted);">${evt.description || 'Sem descrição'}</p>
            <div style="font-size:11px;margin-top:4px;color:#f1c40f;">
              <i class="fa-solid fa-clock"></i> ${dt} • Recorrência: ${evt.recorrencia || 'nenhuma'}
            </div>
          </div>
          <button class="btn-remove-item" onclick="deleteEvent('${evt.id}')" title="Cancelar Evento"><i class="fa-solid fa-trash"></i></button>
        `;
        container.appendChild(item);
      });
    } else {
      container.innerHTML = '<div class="role-desc">Nenhum evento agendado no momento.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div class="error-msg">Erro ao carregar eventos.</div>';
  }
}

window.deleteEvent = async (id) => {
  if (confirm('Deseja realmente cancelar este evento agendado?')) {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    loadGuildEvents();
  }
};

document.getElementById('createEventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('eventTitle').value.trim(),
    description: document.getElementById('eventDesc').value.trim(),
    dateTimeISO: new Date(document.getElementById('eventDateTime').value).toISOString(),
    recorrencia: document.getElementById('eventRecorrencia').value
  };

  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('✅ Evento agendado com sucesso!');
    document.getElementById('createEventForm').reset();
    loadGuildEvents();
  } else {
    alert('❌ Erro ao criar evento.');
  }
});

// ==========================================
// DISPARADOR DE NOTÍCIAS WEBHOOK
// ==========================================
document.getElementById('triggerNewsBtn')?.addEventListener('click', async () => {
  const statusMsg = document.getElementById('newsStatusMsg');
  statusMsg.classList.remove('hidden');
  statusMsg.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Disparando notícia no Webhook...';

  const customWebhookUrl = document.getElementById('customWebhookInput').value.trim() || null;

  try {
    const res = await fetch('/api/news/publish-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customWebhookUrl })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      statusMsg.innerHTML = '✅ <strong>Notícia enviada com sucesso no Webhook!</strong>';
      statusMsg.style.color = 'var(--accent-green)';
    } else {
      statusMsg.innerHTML = `❌ Erro: ${data.error || 'Falha ao enviar'}`;
      statusMsg.style.color = 'var(--accent-red)';
    }
  } catch (err) {
    statusMsg.innerHTML = '❌ Erro de conexão com a API.';
    statusMsg.style.color = 'var(--accent-red)';
  }
});

// ==========================================
// TABELÃO DE MEMBROS & PONTOS DE CORTE
// ==========================================
async function loadMembersTab() {
  await loadCutoffSettings();
  await loadGuildMembersTable();
}

async function loadCutoffSettings() {
  try {
    const res = await fetch('/api/guild/cutoff');
    const data = await res.json();
    if (data.cutoff) {
      document.getElementById('cutoffMinPCInput').value = data.cutoff.minPC || 1500;
      document.getElementById('cutoffMinScoreInput').value = data.cutoff.minWeeklyScore || 50;
      document.getElementById('cutoffMaxDaysInput').value = data.cutoff.maxStatusAgeDays || 3;
      document.getElementById('cutoffBlockFaltaCheckbox').checked = Boolean(data.cutoff.blockIfFaltouBoss);
    }
  } catch (err) {
    console.error('Erro ao carregar cutoff settings:', err);
  }
}

async function loadGuildMembersTable() {
  const tbody = document.getElementById('guildMembersTbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/guild/members');
    const data = await res.json();
    const members = data.members || [];

    if (members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Nenhum membro registrou status ainda. Use /registrar-status no Discord.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    members.forEach(m => {
      const tr = document.createElement('tr');
      tr.dataset.userId = m.userId;
      tr.dataset.userTag = m.userTag;

      const lastUpdateText = m.lastStatusUpdateISO 
        ? new Date(m.lastStatusUpdateISO).toLocaleDateString('pt-BR')
        : 'Nunca';

      const pcVal = m.parsedStats?.pc || 0;
      const eligibleBadge = m.eligible 
        ? '<span style="color:#57F287;font-weight:600;"><i class="fa-solid fa-circle-check"></i> Elegível</span>' 
        : `<span style="color:#ED4245;font-weight:600;" title="${m.reasons.join(', ')}"><i class="fa-solid fa-circle-xmark"></i> Inapto (${m.reasons.length})</span>`;

      tr.innerHTML = `
        <td><strong>${m.userTag}</strong><br><small style="color:var(--text-muted);">${m.userId}</small></td>
        <td><input type="text" class="char-name-input" value="${m.charName || ''}" style="width:120px; padding:4px 6px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:4px;"></td>
        <td><input type="number" class="weekly-score-input" value="${m.weeklyBossScore || 0}" style="width:80px; padding:4px 6px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:4px;"></td>
        <td style="text-align:center;"><input type="checkbox" class="faltou-boss-checkbox" ${m.flagFaltouBoss ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;"></td>
        <td>${lastUpdateText}</td>
        <td><strong>${pcVal}</strong></td>
        <td>${eligibleBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar tabelão:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--accent-red);">Erro ao carregar o tabelão da guilda.</td></tr>';
  }
}

document.getElementById('cutoffSettingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    minPC: parseInt(document.getElementById('cutoffMinPCInput').value, 10) || 0,
    minWeeklyScore: parseInt(document.getElementById('cutoffMinScoreInput').value, 10) || 0,
    maxStatusAgeDays: parseInt(document.getElementById('cutoffMaxDaysInput').value, 10) || 3,
    blockIfFaltouBoss: document.getElementById('cutoffBlockFaltaCheckbox').checked
  };

  const res = await fetch('/api/guild/cutoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('✅ Pontos de Corte salvos com sucesso!');
    loadMembersTab();
  } else {
    alert('❌ Erro ao salvar pontos de corte.');
  }
});

document.getElementById('saveBulkMembersBtn')?.addEventListener('click', async () => {
  const rows = document.querySelectorAll('#guildMembersTbody tr');
  const updates = [];

  rows.forEach(tr => {
    const userId = tr.dataset.userId;
    const userTag = tr.dataset.userTag;
    if (!userId) return;

    const charName = tr.querySelector('.char-name-input')?.value || '';
    const weeklyBossScore = parseInt(tr.querySelector('.weekly-score-input')?.value, 10) || 0;
    const flagFaltouBoss = tr.querySelector('.faltou-boss-checkbox')?.checked || false;

    updates.push({ userId, userTag, charName, weeklyBossScore, flagFaltouBoss });
  });

  const res = await fetch('/api/guild/members/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates })
  });

  if (res.ok) {
    alert('✅ Tabelão salvo com sucesso!');
    loadMembersTab();
  } else {
    alert('❌ Erro ao salvar tabelão.');
  }
});

document.getElementById('resetWeeklyScoresBtn')?.addEventListener('click', async () => {
  if (confirm('Deseja realmente zerar a pontuação semanal de boss e limpar as faltas de todos os membros?')) {
    const res = await fetch('/api/guild/members/reset', { method: 'POST' });
    if (res.ok) {
      alert('🔄 Pontuações e faltas zeradas com sucesso!');
      loadMembersTab();
    }
  }
});

// Inicia aplicação
initApp();
