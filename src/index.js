import { Client, GatewayIntentBits, Collection, ActivityType } from 'discord.js';
import { config, validateConfig } from './config.js';
import { initScheduler } from './services/scheduler.js';
import { initVoiceMuteChecker } from './services/voiceMuteChecker.js';
import { registerCommands } from './deploy-commands.js';

import * as agendarEvento from './commands/agendarEvento.js';
import * as listarEventos from './commands/listarEventos.js';
import * as cancelarEvento from './commands/cancelarEvento.js';
import * as sortearItem from './commands/sortearItem.js';

validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Registra os comandos na coleção
client.commands = new Collection();
const commandsList = [agendarEvento, listarEventos, cancelarEvento, sortearItem];

for (const cmd of commandsList) {
  client.commands.set(cmd.data.name, cmd);
}

// Evento quando o bot está pronto
client.once('ready', async () => {
  console.log(`==========================================`);
  console.log(`🤖 Bot conectado como: ${client.user.tag}`);
  console.log(`🛡️ Cargo Staff Permitido: ${config.staffRoleId}`);
  console.log(`🎙️ Categoria Voz Monitorada: ${config.voiceCategoryId}`);
  console.log(`==========================================`);

  // Tenta registrar/atualizar as Slash Commands automaticamente
  await registerCommands();

  // Define a presença/status do bot
  client.user.setPresence({
    activities: [{ name: 'Gerenciando Eventos & Voice NC', type: ActivityType.Custom }],
    status: 'online'
  });

  // Inicializa o serviço de agendamento de avisos (15h GMT-3 e 4h/1h/30m)
  initScheduler(client);

  // Inicializa o serviço de verificação de mute em voz (mover para AFK após 10 min)
  initVoiceMuteChecker(client);
});

// Evento de recepção de comandos Slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erro ao executar o comando ${interaction.commandName}:`, error);
    const errorMessage = {
      content: '❌ Ocorreu um erro interno ao tentar executar este comando.',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Login no Discord
client.login(config.token);
