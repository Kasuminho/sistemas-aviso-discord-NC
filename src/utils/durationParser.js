/**
 * Converte strings flexíveis de tempo (ex: "48h", "2d", "1d 12h", "30m", "48") em minutos totais.
 * @param {string} input 
 * @returns {number|null} Minutos totais ou null se for inválido
 */
export function parseDurationToMinutes(input) {
  if (!input) return null;
  const str = input.toLowerCase().trim();

  // Se for apenas número puro (ex: "48"), assume como horas
  if (/^\d+$/.test(str)) {
    const hours = parseInt(str, 10);
    return hours > 0 ? hours * 60 : null;
  }

  let totalMinutes = 0;
  const daysMatch = str.match(/(\d+)\s*d/);
  const hoursMatch = str.match(/(\d+)\s*h/);
  const minsMatch = str.match(/(\d+)\s*m/);

  if (daysMatch) totalMinutes += parseInt(daysMatch[1], 10) * 24 * 60;
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);

  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Formata minutos em string legível em português (ex: "1 dia e 12 horas", "48 horas", "30 minutos")
 * @param {number} totalMinutes 
 * @returns {string}
 */
export function formatMinutesToHumanReadable(totalMinutes) {
  if (totalMinutes <= 0) return 'Tempo esgotado (Zerado)';

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const parts = [];
  if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);

  return parts.join(' e ') || 'Menos de 1 minuto';
}
