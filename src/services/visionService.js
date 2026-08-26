import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

/**
 * Envia uma ou mais imagens (URLs/buffers) para a API do Gemini
 * e extrai em formato JSON os status do jogo (Desenvolvimento, Classe, HUD, JvA, JvJ).
 * @param {Array<string>} imageUrls Array com até 3 URLs de imagens anexadas no Discord
 * @returns {Promise<Object>} JSON estruturado com os status lidos
 */
export async function analyzeScreenshotsWithGemini(imageUrls) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada no arquivo .env.');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  // Converte as URLs das imagens em partes inline base64 para a API
  const imageParts = [];
  for (const url of imageUrls) {
    if (!url) continue;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';

      imageParts.push({
        inlineData: {
          data: base64,
          mimeType
        }
      });
    } catch (fetchErr) {
      console.error(`Erro ao carregar a imagem da URL (${url}):`, fetchErr);
    }
  }

  if (imageParts.length === 0) {
    throw new Error('Nenhuma imagem válida pôde ser baixada do Discord.');
  }

  const prompt = `Você é um leitor óptico especialista em prints de jogos MMORPG (Night Crows).
Analise a(s) imagem(ns) fornecida(s) e extraia com exatidão os seguintes atributos:
1. "desenvolvimento": Valor numérico da linha "Desenvolvimento" (ex: 355.361 ou 355361 -> retorne número puro ex: 355361).
2. "classe": Nome da classe exibido acima do desenvolvimento (ex: "Atirador Fantasma").
3. "nivel": Nível numérico do personagem (ex: 62).
4. "dano": Dano numérico exibido ao lado do ícone de espadas no HUD (ex: 480).
5. "defesa": Defesa numérica exibida ao lado do ícone de escudo no HUD (ex: 562).
6. "acerto": Acerto numérico exibido ao lado do ícone de alvo/mira no HUD (ex: 567).
7. "acertoJvA": Valor numérico da linha "Acerto em JvA" (ex: 90).
8. "defesaJvA": Valor numérico da linha "Defesa em JvA" (ex: 45).
9. "acertoJvJ": Valor numérico da linha "Acerto em JvJ" (ex: 13).
10. "defesaJvJ": Valor numérico da linha "Defesa em JvJ" (ex: 18).

Retorne APENAS um objeto JSON válido no formato estrito abaixo, sem marcações markdown de código e sem texto adicional:
{
  "desenvolvimento": 0,
  "classe": "string",
  "nivel": 0,
  "dano": 0,
  "defesa": 0,
  "acerto": 0,
  "acertoJvA": 0,
  "defesaJvA": 0,
  "acertoJvJ": 0,
  "defesaJvJ": 0
}
Se algum dado não estiver visível nas imagens, coloque null naquele campo específico.`;

  // Modelos suportados pela API da Google em ordem de preferência
  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest'
  ];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      const jsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(jsonString);

      // Limpa pontuação do número de Desenvolvimento (ex: 355.361 -> 355361)
      let desVal = null;
      if (parsed.desenvolvimento) {
        const desStr = String(parsed.desenvolvimento).replace(/\./g, '').replace(/\,/g, '').trim();
        desVal = parseInt(desStr, 10) || null;
      }

      return {
        desenvolvimento: desVal,
        classe: parsed.classe ? String(parsed.classe).trim() : null,
        nivel: parsed.nivel ? parseInt(parsed.nivel, 10) : null,
        dano: parsed.dano ? parseInt(parsed.dano, 10) : null,
        defesa: parsed.defesa ? parseInt(parsed.defesa, 10) : null,
        acerto: parsed.acerto ? parseInt(parsed.acerto, 10) : null,
        acertoJvA: parsed.acertoJvA ? parseInt(parsed.acertoJvA, 10) : null,
        defesaJvA: parsed.defesaJvA ? parseInt(parsed.defesaJvA, 10) : null,
        acertoJvJ: parsed.acertoJvJ ? parseInt(parsed.acertoJvJ, 10) : null,
        defesaJvJ: parsed.defesaJvJ ? parseInt(parsed.defesaJvJ, 10) : null
      };
    } catch (err) {
      console.warn(`[VISION] Tentativa com modelo ${modelName} falhou (${err.message}). Tentando próximo modelo...`);
      lastError = err;
    }
  }

  throw new Error(`Falha ao ler prints com a API do Gemini: ${lastError?.message || 'Erro desconhecido'}`);
}
