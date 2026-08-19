import { createWorker } from 'tesseract.js';

/**
 * Processa uma imagem via OCR (Tesseract.js) e extrai especificamente os status do jogo:
 * - Nível
 * - Dano (Swords)
 * - Defesa (Shield)
 * - Acerto (Target)
 * - Acerto em JvA
 * - Defesa em JvA
 * @param {string} imageUrl 
 * @returns {Promise<{ rawText: string, parsedStats: Object }>}
 */
export async function processImageOCR(imageUrl) {
  let worker = null;
  try {
    worker = await createWorker('por+eng');
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();

    const cleanText = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const parsedStats = parseNCGameStats(cleanText);

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
 * Extrai os 6 status principais focados em Boss de Guild e progressão
 * @param {string} text 
 * @returns {Object}
 */
export function parseNCGameStats(text) {
  const stats = {};

  // 1. Acerto em JvA (PvE Accuracy)
  const jvaAcerto = text.match(/(?:acerto|certo)\s+em\s+jva\s*[:\s-]*(\d+)/i);
  if (jvaAcerto) stats.acertoJvA = parseInt(jvaAcerto[1], 10);

  // 2. Defesa em JvA (PvE Defense)
  const jvaDefesa = text.match(/(?:defesa)\s+em\s+jva\s*[:\s-]*(\d+)/i);
  if (jvaDefesa) stats.defesaJvA = parseInt(jvaDefesa[1], 10);

  // 3. Acerto Geral
  const acertoMatch = text.match(/^acerto\s+[:\s-]*(\d+)/im);
  if (acertoMatch) stats.acerto = parseInt(acertoMatch[1], 10);

  // 4. Procurar Nível (ex: 62)
  const levelMatch = text.match(/(?:n[íi]vel|lvl|level)\s*[:\s-]*(\d+)/i) || text.match(/\b([5-9]\d)\b/);
  if (levelMatch) stats.nivel = parseInt(levelMatch[1], 10);

  // 5. Procurar trio de números do HUD (Dano / Defesa / Acerto)
  const numbers = text.match(/\b\d{3,4}\b/g);
  if (numbers && numbers.length >= 3) {
    const candidates = numbers.map(n => parseInt(n, 10)).filter(n => n >= 100 && n <= 4000);
    if (candidates.length >= 3) {
      if (!stats.dano) stats.dano = candidates[0];
      if (!stats.defesa) stats.defesa = candidates[1];
      if (!stats.acerto) stats.acerto = candidates[2];
    }
  }

  return stats;
}
