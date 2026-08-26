import { config } from '../config.js';

// Mapa em memória para rastrear usuários mutados e o horário em que o mute iniciou
// Chave: userId, Valor: { mutedSince: timestamp, channelId: string, guildId: string }
const mutedUsers = new Map();

/**
 * Inicializa o monitoramento de Mute nos canais de voz da categoria configurada
 * @param {import('discord.js').Client} client 
 */
export function initVoiceMuteChecker(client) {
  console.log(`🎙️ [VOICE MUTE] Serviço de monitoramento ativado (Categoria: ${config.voiceCategoryId}, Limite: ${config.muteTimeoutMinutes} min).`);

  // Evento disparado quando o estado de voz de um usuário muda (Entrou, saiu, mutou, desmutou)
  client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(newState);
  });

  // Executa verificação a cada 30 segundos em memória
  setInterval(() => {
    checkMutedUsers(client);
  }, 30 * 1000);

  // Faz uma varredura inicial dos usuários já conectados e mutados ao iniciar
  scanExistingVoiceStates(client);
}

/**
 * Processa a atualização do estado de voz de um usuário
 * @param {import('discord.js').VoiceState} state 
 */
function handleVoiceStateUpdate(state) {
  const userId = state.id;
  const channel = state.channel;

  // Se o usuário não está em um canal de voz
  if (!channel) {
    mutedUsers.delete(userId);
    return;
  }

  // Verifica se o canal pertence à categoria monitorada
  const isTargetCategory = channel.parentId === config.voiceCategoryId;
  if (!isTargetCategory) {
    mutedUsers.delete(userId);
    return;
  }

  // Verifica se o usuário está mutado (Self-mute pelo Discord, Mute de Servidor ou Mute pelo Microfone)
  const isMuted = state.selfMute || state.serverMute || state.mute;

  if (isMuted) {
    // Se ainda não estava sendo rastreado, inicia a contagem
    if (!mutedUsers.has(userId)) {
      mutedUsers.set(userId, {
        mutedSince: Date.now(),
        channelId: channel.id,
        guildId: state.guild.id
      });
      console.log(`🎙️ [VOICE MUTE] Membro ${state.member?.user.tag || userId} mutou em ${channel.name}. Iniciando cronômetro de ${config.muteTimeoutMinutes} min.`);
    }
  } else {
    // Se o usuário desmutou, remove do rastreamento
    if (mutedUsers.has(userId)) {
      mutedUsers.delete(userId);
      console.log(`🔊 [VOICE MUTE] Membro ${state.member?.user.tag || userId} desmutou em ${channel.name}. Cronômetro cancelado.`);
    }
  }
}

/**
 * Verifica se algum usuário ultrapassou o tempo limite de mute (10 minutos por padrão) e o move para AFK
 * @param {import('discord.js').Client} client 
 */
async function checkMutedUsers(client) {
  const timeoutMs = config.muteTimeoutMinutes * 60 * 1000;
  const now = Date.now();

  for (const [userId, info] of mutedUsers.entries()) {
    if (now - info.mutedSince >= timeoutMs) {
      try {
        const guild = client.guilds.cache.get(info.guildId) || await client.guilds.fetch(info.guildId).catch(() => null);
        if (!guild) {
          mutedUsers.delete(userId);
          continue;
        }

        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        if (!member || !member.voice || !member.voice.channel) {
          mutedUsers.delete(userId);
          continue;
        }

        const currentChannel = member.voice.channel;
        const afkChannelId = config.afkChannelId || guild.afkChannelId;

        // Valida se o membro ainda está na categoria alvo, mutado e se existe um canal AFK válido
        const isTargetCategory = currentChannel.parentId === config.voiceCategoryId;
        const isAfkChannel = currentChannel.id === afkChannelId;
        const isMuted = member.voice.selfMute || member.voice.serverMute || member.voice.mute;

        if (isTargetCategory && !isAfkChannel && isMuted) {
          if (afkChannelId) {
            await member.voice.setChannel(afkChannelId, `Auto-AFK: Mutado por mais de ${config.muteTimeoutMinutes} minutos.`);
            console.log(`🚨 [VOICE MUTE] Membro ${member.user.tag} movido para o canal AFK por estar mutado há mais de ${config.muteTimeoutMinutes} minutos.`);
          } else {
            console.warn(`⚠️ [VOICE MUTE] Canal AFK não encontrado no servidor ${guild.name} para mover o membro ${member.user.tag}.`);
          }
        }

        // Limpa do rastreamento após processar
        mutedUsers.delete(userId);

      } catch (err) {
        console.error(`Erro ao tentar mover usuário mutado (${userId}) para AFK:`, err);
        mutedUsers.delete(userId);
      }
    }
  }
}

/**
 * Varre os canais na categoria ao ligar o bot usando apenas o cache em memória
 */
function scanExistingVoiceStates(client) {
  try {
    for (const [, guild] of client.guilds.cache) {
      const voiceStates = guild.voiceStates.cache;
      for (const [, state] of voiceStates) {
        handleVoiceStateUpdate(state);
      }
    }
  } catch (err) {
    console.error('Erro na varredura inicial de estados de voz:', err);
  }
}
