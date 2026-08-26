# 🤖 BOT NC - Discord Bot para Staff & Portal de Gestão (Raven Hub)

Bot e **Portal Web** exclusivo para gerenciamento de **Sorteios Avançados**, **Eventos Automatizados com Avisos em GMT-3**, **Publicador de Notícias Night Crows** e **Monitoramento de Alts & Status OCR**, protegido por verificação de segurança estrita para o usuário **Proprietário** (`273600843251712020`) e **Cargo Staff** (`1526370359652122826`).

---

## 🌐 1. Portal de Gestão Web (Raven Hub)

O bot agora possui um **Painel Web Moderno (Porta 3000)** para você gerenciar sorteios e eventos sem precisar digitar comandos no Discord.

### 🛡️ Segurança e Acesso
- **Autenticação com Discord (OAuth2)**: Somente o seu usuário do Discord com o ID **`273600843251712020`** tem permissão de entrada. Qualquer outro usuário recebe `403 Acesso Negado`.
- **Acesso Direto por Chave Mestra**: Possibilidade de login rápido via Chave de Admin (`ADMIN_KEY` configurada no `.env`).

### 🎲 Central de Sorteios (Sorteador Pro)
- **Carregamento Automático**: Lista em tempo real todos os membros do servidor que possuem o cargo **`1525526128725459065`** (`EVENT_ROLE_ID`).
- **Modos de Sorteio**:
  - **Item Único**: Define o item, quantidade total e quantidade de ganhadores (com cálculo de divisão e restos).
  - **Múltiplos Prêmios**: Permite cadastrar vários itens de uma só vez (ex: Prêmio 1: 1x Montaria Lendária, Prêmio 2: 5x Baú de Ouro, etc.).
- **Opções Avançadas**:
  - Permitir ou bloquear que a mesma pessoa ganhe múltiplos itens diferentes.
  - Seleção do canal de texto do Discord onde o anúncio público e Embed serão publicados.
  - Menção automática do cargo de Jogadores NC.
- ⭐ **Caixinha Especial do Administrador**:
  - Opção discreta: `[⭐] Garantir minha vitória (Me incluir como ganhador)`.
  - Garante a inclusão do seu usuário (`273600843251712020`) entre os vencedores de forma 100% natural, embaralhando as posições no anúncio público sem deixar rastros!

### 📜 Histórico de Sorteios
- Consulta completa de todos os sorteios já realizados, data, itens sorteados, quantidade e vencedores.

### 📅 Agendador de Eventos da Guilda
- Interface para criar, agendar e cancelar eventos com avisos automáticos diários (15h GMT-3) e lembretes pré-evento (4h, 1h e 30 min).

### 🦅 Disparador de Notícias Night Crows
- Envio com 1 clique de resumos e avisos diretamente para o Webhook do Discord com o perfil oficial do **Blow, Enviado por Raven**.

---

## 🐳 Como Rodar no Docker / Container

O container expõe a porta **`3000`** para acesso ao painel web:

```bash
docker compose up -d --build
```

Acesse pelo navegador: `http://SEU_IP_OU_DOMINIO:3000`

---

## ⚙️ Variáveis de Ambiente (`.env`)

```env
# Discord Bot
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
CLIENT_SECRET=seu_client_secret_aqui
GUILD_ID=seu_guild_id_aqui

# Cargos
STAFF_ROLE_ID=1526370359652122826
EVENT_ROLE_ID=1525526128725459065

# Canais
ANNOUNCEMENT_CHANNEL_ID=id_canal_avisos
ALT_TIMER_CHANNEL_ID=1527700863345229834
VOICE_CATEGORY_ID=1525526402500395189

# Portal Web & Segurança
PORT=3000
ALLOWED_USER_ID=273600843251712020
ADMIN_KEY=raven273600843251712020
SESSION_SECRET=secret_nc_token_session_2026
WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🎮 Comandos do Bot (Slash Commands)

- `/sortear-item` : Sorteia itens com divisão entre os jogadores marcados com `@menção`.
- `/agendar-evento` : Agenda um novo evento no fuso GMT-3.
- `/listar-eventos` : Exibe a lista de todos os eventos futuros.
- `/cancelar-evento` : Cancela e remove um evento agendado informando o ID.
- `/cadastrar-alt-timer` : Registra timer de masmorra de Alt.
- `/consultar-alt-timer` : Consulta timers ativos.
- `/remover-alt-timer` : Remove timer de Alt.
- `/registrar-status-print` : Registra status via OCR de print.
- `/consultar-status` : Consulta status de jogador.
- `/listar-status-guild` : Lista status e poder de combate da guilda.
