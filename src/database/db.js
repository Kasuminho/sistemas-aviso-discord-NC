import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const SORTEIOS_FILE = path.join(DATA_DIR, 'sorteios.json');
const ALT_TIMERS_FILE = path.join(DATA_DIR, 'alt_timers.json');

// Garante que o diretório data exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return [];
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
    return readJSON(EVENTS_FILE);
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
    return readJSON(SORTEIOS_FILE);
  },

  addSorteio(sorteio) {
    const sorteios = this.getSorteios();
    sorteios.push(sorteio);
    writeJSON(SORTEIOS_FILE, sorteios);
  },

  // Alt Timers
  getAltTimers() {
    return readJSON(ALT_TIMERS_FILE);
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
  }
};
