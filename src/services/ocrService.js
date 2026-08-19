import { createWorker } from 'tesseract.js';

/**
 * Processa a imagem enviada por URL via OCR (Tesseract.js) e extrai textos e estatísticas
 * @param {string} imageUrl 
 * @returns {Promise<{ rawText: string, parsedStats: Object }>}
 */
export async function processImageOCR(imageUrl) {
  let worker = null;
  try {
    // Inicializa o worker em português e inglês para melhor precisão
    worker = await createWorker('por+eng');
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();

    const cleanText = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const parsedStats = parseStatsFromText(cleanText);

    return {
      rawText: cleanText || 'Nenhum texto pôde ser lido da imagem.',
      parsedStats
    };
  } catch (error) {
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    console.error('Erro no processamento OCR:', error);
    throw error;
  }
}

/**
 * Tenta extrair padrões comuns de status de jogos (Nível, Poder, Ouro, Nick, etc.) a partir do texto lido
 * @param {string} text 
 * @returns {Object}
 */
function parseStatsFromText(text) {
  const stats = {};

  // Nível / Level / Lvl
  const levelMatch = text.match(/(?:n[íi]vel|lvl|level)\s*[:\s-]*(\d+)/i);
  if (levelMatch) stats.level = levelMatch[1];

  // Poder / Power / CP / PWR
  const powerMatch = text.match(/(?:poder|power|cp|pwr)\s*[:\s-]*([\d\.\,\s]+[kKmM]?)/i);
  if (powerMatch) stats.power = powerMatch[1].trim();

  // Ouro / Gold / Moedas
  const goldMatch = text.match(/(?:ouro|gold|moedas)\s*[:\s-]*([\d\.\,\s]+)/i);
  if (goldMatch) stats.gold = goldMatch[1].trim();

  // Nick / Nome / Player
  const nickMatch = text.match(/(?:nick|nome|player|jogador)\s*[:\s-]*([a-zA-Z0-9_\-]{3,16})/i);
  if (nickMatch) stats.nick = nickMatch[1].trim();

  return stats;
}
