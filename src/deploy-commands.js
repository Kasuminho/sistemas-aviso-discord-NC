import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import * as agendarEvento from './commands/agendarEvento.js';
import * as listarEventos from './commands/listarEventos.js';
import * as cancelarEvento from './commands/cancelarEvento.js';
import * as sortearItem from './commands/sortearItem.js';

export async function registerCommands() {
  const commands = [
    agendarEvento.data.toJSON(),
    listarEventos.data.toJSON(),
    cancelarEvento.data.toJSON(),
    sortearItem.data.toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log(`🚀 Registrando ${commands.length} comandos Slash com a API do Discord...`);

    if (config.guildId) {
      // Registra no Servidor específico (Disponibilização instantânea)
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`✅ Sucesso! ${data.length} comandos registrados no servidor (GUILD_ID: ${config.guildId}).`);
    } else {
      // Registra Globalmente (Pode levar alguns minutos para propagar)
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`✅ Sucesso! ${data.length} comandos registrados globalmente.`);
    }
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
}

// Se executado diretamente via terminal (`node src/deploy-commands.js`)
if (process.argv[1] && process.argv[1].endsWith('deploy-commands.js')) {
  registerCommands();
}
