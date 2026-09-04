import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const SORTEIOS_FILE = path.join(DATA_DIR, 'sorteios.json');
const ALT_TIMERS_FILE = path.join(DATA_DIR, 'alt_timers.json');
const GUILD_MEMBERS_FILE = path.join(DATA_DIR, 'guild_members.json');
const CUTOFF_SETTINGS_FILE = path.join(DATA_DIR, 'cutoff_settings.json');
const SAVED_ITEMS_FILE = path.join(DATA_DIR, 'saved_items.json');

// Garante que o diretório data exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Erro ao salvar no arquivo ${filePath}:`, error);
  }
}

export const db = {
  // Eventos
  getEvents() {
    return readJSON(EVENTS_FILE, []);
  },

  saveEvents(events) {
    writeJSON(EVENTS_FILE, events);
  },

  addEvent(event) {
    const events = this.getEvents();
    events.push(event);
    this.saveEvents(events);
    return event;
  },

  removeEvent(eventId) {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== eventId);
    const removed = events.length !== filtered.length;
    if (removed) {
      this.saveEvents(filtered);
    }
    return removed;
  },

  updateEvent(updatedEvent) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      events[index] = updatedEvent;
      this.saveEvents(events);
    }
  },

  // Sorteios
  getSorteios() {
    return readJSON(SORTEIOS_FILE, []);
  },

  addSorteio(sorteio) {
    const sorteios = this.getSorteios();
    sorteios.push(sorteio);
    writeJSON(SORTEIOS_FILE, sorteios);
  },

  // Itens Salvos (Predefinições de Sorteio)
  getSavedItems() {
    return readJSON(SAVED_ITEMS_FILE, ['VIP 30 Dias', 'Moedas de Ouro', 'Chave de Baú', 'Poção Especial']);
  },

  addSavedItem(name) {
    if (!name || !name.trim()) return this.getSavedItems();
    const items = this.getSavedItems();
    const cleanName = name.trim();
    if (!items.includes(cleanName)) {
      items.push(cleanName);
      writeJSON(SAVED_ITEMS_FILE, items);
    }
    return items;
  },

  removeSavedItem(name) {
    const items = this.getSavedItems();
    const filtered = items.filter(i => i.toLowerCase() !== String(name).toLowerCase());
    writeJSON(SAVED_ITEMS_FILE, filtered);
    return filtered;
  },

  // Alt Timers
  getAltTimers() {
    return readJSON(ALT_TIMERS_FILE, []);
  },

  saveAltTimers(timers) {
    writeJSON(ALT_TIMERS_FILE, timers);
  },

  getUserAltTimers(userId) {
    const timers = this.getAltTimers();
    return timers.filter(t => t.userId === userId);
  },

  setAltTimer(userId, slot, altName, expiresAtISO) {
    const timers = this.getAltTimers();
    const existingIndex = timers.findIndex(t => t.userId === userId && t.slot === slot);

    const timerData = {
      userId,
      slot,
      altName: altName || `Alt ${slot}`,
      expiresAtISO,
      createdAtISO: new Date().toISOString(),
      notified: false
    };

    if (existingIndex !== -1) {
      timers[existingIndex] = timerData;
    } else {
      timers.push(timerData);
    }

    this.saveAltTimers(timers);
    return timerData;
  },

  removeAltTimer(userId, slot) {
    const timers = this.getAltTimers();
    const filtered = timers.filter(t => !(t.userId === userId && t.slot === slot));
    const removed = timers.length !== filtered.length;
    if (removed) {
      this.saveAltTimers(filtered);
    }
    return removed;
  },

  updateAltTimer(updatedTimer) {
    const timers = this.getAltTimers();
    const index = timers.findIndex(t => t.userId === updatedTimer.userId && t.slot === updatedTimer.slot);
    if (index !== -1) {
      timers[index] = updatedTimer;
      this.saveAltTimers(timers);
    }
  },

  // Settings de Pontos de Corte
  getCutoffSettings() {
    const defaultSettings = {
      minPC: 1500,
      minWeeklyScore: 50,
      blockIfFaltouBoss: true,
      maxStatusAgeDays: 3
    };
    return readJSON(CUTOFF_SETTINGS_FILE, defaultSettings);
  },

  saveCutoffSettings(settings) {
    const current = this.getCutoffSettings();
    const updated = { ...current, ...settings };
    writeJSON(CUTOFF_SETTINGS_FILE, updated);
    return updated;
  },

  // Membros da Guild (Status & Pontuação)
  getGuildMembersList() {
    return readJSON(GUILD_MEMBERS_FILE, []);
  },

  saveGuildMembersList(list) {
    writeJSON(GUILD_MEMBERS_FILE, list);
  },

  getMemberData(userId) {
    const list = this.getGuildMembersList();
    return list.find(m => m.userId === userId);
  },

  setPlayerStatus(userId, userTag, charName, parsedStats, imageUrls = [], observacao = '') {
    const list = this.getGuildMembersList();
    const index = list.findIndex(m => m.userId === userId);

    // Prioriza o Desenvolvimento oficial do jogo, ou calcula Dano + Defesa + Acerto
    const pc = parsedStats.desenvolvimento || ((parsedStats.dano || 0) + (parsedStats.defesa || 0) + (parsedStats.acerto || 0));
    
    // Mescla com estatísticas anteriores para não perder dados nulos
    const existingStats = index !== -1 ? (list[index].parsedStats || {}) : {};
    const updatedStats = {
      desenvolvimento: parsedStats.desenvolvimento || existingStats.desenvolvimento || null,
      classe: parsedStats.classe || existingStats.classe || null,
      nivel: parsedStats.nivel || existingStats.nivel || null,
      dano: parsedStats.dano || existingStats.dano || null,
      defesa: parsedStats.defesa || existingStats.defesa || null,
      acerto: parsedStats.acerto || existingStats.acerto || null,
      acertoJvA: parsedStats.acertoJvA || existingStats.acertoJvA || null,
      defesaJvA: parsedStats.defesaJvA || existingStats.defesaJvA || null,
      acertoJvJ: parsedStats.acertoJvJ || existingStats.acertoJvJ || null,
      defesaJvJ: parsedStats.defesaJvJ || existingStats.defesaJvJ || null,
      pc
    };

    const memberEntry = {
      userId,
      userTag,
      charName: charName ? charName.trim() : (index !== -1 ? list[index].charName : userTag),
      parsedStats: updatedStats,
      imageUrls: imageUrls.filter(Boolean),
      observacao,
      lastStatusUpdateISO: new Date().toISOString(),
      weeklyBossScore: index !== -1 ? (list[index].weeklyBossScore || 0) : 0,
      flagFaltouBoss: index !== -1 ? (list[index].flagFaltouBoss || false) : false
    };

    if (index !== -1) {
      list[index] = memberEntry;
    } else {
      list.push(memberEntry);
    }

    this.saveGuildMembersList(list);
    return memberEntry;
  },

  bulkUpdateMembers(updatesArray) {
    const list = this.getGuildMembersList();

    for (const update of updatesArray) {
      const index = list.findIndex(m => m.userId === update.userId);
      if (index !== -1) {
        if (update.charName !== undefined) list[index].charName = update.charName.trim();
        if (update.weeklyBossScore !== undefined) list[index].weeklyBossScore = parseInt(update.weeklyBossScore, 10) || 0;
        if (update.flagFaltouBoss !== undefined) list[index].flagFaltouBoss = Boolean(update.flagFaltouBoss);
      } else {
        list.push({
          userId: update.userId,
          userTag: update.userTag || update.userId,
          charName: update.charName ? update.charName.trim() : update.userId,
          parsedStats: {},
          imageUrls: [],
          observacao: '',
          lastStatusUpdateISO: null,
          weeklyBossScore: parseInt(update.weeklyBossScore, 10) || 0,
          flagFaltouBoss: Boolean(update.flagFaltouBoss)
        });
      }
    }

    this.saveGuildMembersList(list);
    return list;
  },

  resetWeeklyBossScores() {
    const list = this.getGuildMembersList();
    const updated = list.map(m => ({
      ...m,
      weeklyBossScore: 0,
      flagFaltouBoss: false
    }));
    this.saveGuildMembersList(updated);
    console.log('🔄 [WEEKLY RESET] Pontuações de boss da semana e faltas zeradas com sucesso!');
    return updated;
  },

  /**
   * Avalia os 4 critérios de elegibilidade para sorteio de um jogador
   * @param {string} userId 
   * @returns {{ eligible: boolean, reasons: Array<string>, memberData: Object|null }}
   */
  isPlayerEligibleForRaffle(userId) {
    const member = this.getMemberData(userId);
    const cutoff = this.getCutoffSettings();
    const reasons = [];

    if (!member) {
      return {
        eligible: false,
        reasons: ['Nenhum status cadastrado no sistema (Use `/registrar-status`)'],
        memberData: null
      };
    }

    // 1. Atualização nos últimos X dias (72h)
    if (!member.lastStatusUpdateISO) {
      reasons.push('Status nunca foi enviado (Use `/registrar-status`)');
    } else {
      const lastUpdate = new Date(member.lastStatusUpdateISO);
      const now = new Date();
      const diffDays = (now - lastUpdate) / (1000 * 60 * 60 * 24);
      if (diffDays > cutoff.maxStatusAgeDays) {
        reasons.push(`Status desatualizado (Enviado há ${Math.floor(diffDays)} dias. Máximo permitido: ${cutoff.maxStatusAgeDays} dias)`);
      }
    }

    // 2. PC / Desenvolvimento Mínimo
    const pc = member.parsedStats?.pc || 0;
    if (pc < cutoff.minPC) {
      reasons.push(`Desenvolvimento/PC insuficiente (${pc.toLocaleString('pt-BR')}/${cutoff.minPC.toLocaleString('pt-BR')})`);
    }

    // 3. Presença Mínima no Boss
    const score = member.weeklyBossScore || 0;
    if (score < cutoff.minWeeklyScore) {
      reasons.push(`Presença semanal em Boss insuficiente (${score}/${cutoff.minWeeklyScore} pts)`);
    }

    // 4. Flag de Faltou ao Boss
    if (cutoff.blockIfFaltouBoss && member.flagFaltouBoss) {
      reasons.push('Marcado com flag de FALTOU ao Boss da Guild');
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      memberData: member
    };
  }
};
