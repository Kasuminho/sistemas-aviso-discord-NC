import { config } from '../config.js';

// Mapa em memória para rastrear usuários mutados: userId -> { mutedSince, guildId }
const mutedUsers = new Map();

/**
 * Inicializa o serviço de verificação de tempo em Mute nos canais de voz.
 * @param {import('discord.js').Client} client 
 */
export function initVoiceMuteChecker(client) {
  console.log(`🎙️ [VOICE MUTE] Serviço de monitoramento ativado (Categoria: ${config.voiceCategoryId}, Limite: ${config.muteTimeoutMinutes} min).`);

  // Evento escutado a cada alteração no estado de voz de qualquer membro
  client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(newState);
  });

  // Varredura periódica a cada 30 segundos
  setInterval(() => {
    checkMutedUsers(client);
  }, 30 * 1000);

  // Varredura inicial nos canais para rastrear quem já estava mutado ao ligar o bot
  scanExistingVoiceStates(client);
}

/**
 * Atualiza o rastreamento de um membro baseado no seu VoiceState atual
 * @param {import('discord.js').VoiceState} state 
 */
function handleVoiceStateUpdate(state) {
  const userId = state.id;
  const channel = state.channel;

  // Se o usuário desconectou da voz
  if (!channel) {
    mutedUsers.delete(userId);
    return;
  }

  const guild = state.guild;
  const afkChannelId = config.afkChannelId || guild.afkChannelId;

  // Verifica se o canal está na Categoria especificada E NÃO é o próprio canal AFK
  const isTargetCategory = channel.parentId === config.voiceCategoryId;
  const isAfkChannel = channel.id === afkChannelId;

  const isMuted = state.selfMute || state.serverMute || state.mute;

  if (isTargetCategory && !isAfkChannel && isMuted) {
    // Se ainda não estava no mapa, inicia a contagem
    if (!mutedUsers.has(userId)) {
      mutedUsers.set(userId, {
        mutedSince: Date.now(),
        guildId: guild.id
      });
      console.log(`🎙️ [VOICE MUTE] Membro ${state.member?.user.tag || userId} mutou em ${channel.name}. Iniciando cronômetro de ${config.muteTimeoutMinutes} min.`);
    }
  } else {
    // Se desmutou, trocou de categoria ou foi para o AFK, remove da contagem
    if (mutedUsers.has(userId)) {
      mutedUsers.delete(userId);
      console.log(`🎙️ [VOICE MUTE] Cronômetro cancelado para o membro ${state.member?.user.tag || userId} (desmutou ou saiu).`);
    }
  }
}

/**
 * Varre todos os membros rastreados e move os que excederam o tempo limite mutados
 */
async function checkMutedUsers(client) {
  const timeoutMs = config.muteTimeoutMinutes * 60 * 1000;
  const now = Date.now();

  for (const [userId, info] of mutedUsers.entries()) {
    if (now - info.mutedSince >= timeoutMs) {
      try {
        const guild = await client.guilds.fetch(info.guildId);
        if (!guild) {
          mutedUsers.delete(userId);
          continue;
        }

        const member = await guild.members.fetch(userId);
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
 * Varre os canais na categoria ao ligar o bot
 */
async function scanExistingVoiceStates(client) {
  try {
    const guilds = await client.guilds.fetch();
    for (const [guildId] of guilds) {
      const guild = await client.guilds.fetch(guildId);
      const voiceStates = guild.voiceStates.cache;

      for (const [userId, state] of voiceStates) {
        handleVoiceStateUpdate(state);
      }
    }
  } catch (err) {
    console.error('Erro na varredura inicial de estados de voz:', err);
  }
}
