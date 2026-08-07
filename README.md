# 🤖 BOT NC - Discord Bot para Staff (Eventos & Sorteios)

Bot exclusivo para gerenciamento de **Eventos Automatizados com Avisos em GMT-3** e **Sorteio de Itens com Divisão Proporcional**, protegido por verificação do **Cargo Staff** (`1526370359652122826`).

---

## 🛠️ Recursos Principais

1. **Apenas Staff**: Somente membros com o Cargo Staff configurado (ou Administradores) podem executar as Slash Commands.
2. **Agendamento de Eventos (GMT-3)**:
   - Cadastre eventos informando título, descrição e data/hora (`DD/MM/YYYY HH:mm`).
   - **Aviso Diário automático às 15:00 GMT-3** (Horário de Brasília) para todos os eventos ativos.
   - **Avisos no dia do evento**: Envia lembretes automáticos **4 horas antes**, **1 hora antes** e **30 minutos antes**.
3. **Sorteio de Itens**:
   - Defina o nome do item, quantidade total, número de ganhadores e marque os participantes elegíveis (`@Jogador1 @Jogador2`).
   - Sorteia vencedores de forma totalmente aleatória e justa, calculando e exibindo a fração exata do item que cada ganhador receberá.
4. **Pronto para Docker & VPS**: Totalmente containerizado com volume persistente para banco de dados local.

---

## 📋 Passo a Passo: Configuração do Bot no Discord Developer Portal

### 1. Criar a Aplicação do Bot
1. Acesse o portal de desenvolvedores: [Discord Developer Portal](https://discord.com/developers/applications).
2. Clique no botão **"New Application"** no canto superior direito.
3. Defina o nome do seu bot (ex: `Bot NC`) e clique em **Create**.
4. Na aba **General Information**, copie o **Application ID**. Este valor será o seu `CLIENT_ID` no arquivo `.env`.

### 2. Pegar o Token do Bot & Ativar Intents
1. No menu lateral esquerdo, clique em **Bot**.
2. Clique em **Reset Token** e confirme. Copie o token exibido. Este valor será o seu `DISCORD_TOKEN` no arquivo `.env`. *(Guardar este token em local seguro!)*.
3. Role a página até a seção **Privileged Gateway Intents** e ATIVE as 3 opções abaixo:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **MESSAGE CONTENT INTENT**
4. Clique em **Save Changes**.

### 3. Convidar o Bot para o Servidor (Permissão Administrador)
1. No menu lateral esquerdo, vá em **OAuth2** ➡️ **URL Generator**.
2. Na caixa **Scopes**, marque:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Na caixa **Bot Permissions**, marque:
   - ✅ **Administrator**
4. Copie a URL gerada no final da página, cole no seu navegador e selecione o seu servidor Discord para autorizar o bot.

---

## 🔍 Onde Pegar os IDs no Discord (Modo Desenvolvedor)

Antes de copiar os IDs, você precisa ativar o **Modo Desenvolvedor** no seu aplicativo do Discord:
- No Discord, vá em **Configurações do Usuário** ⚙️ ➡️ **Avançado** ➡️ Ative **Modo Desenvolvedor**.

Agora você pode copiar os IDs clicando com o **botão direito**:

1. **`GUILD_ID` (ID do Servidor)**: Clique com o botão direito no ícone do seu Servidor no Discord ➡️ **Copiar ID do Servidor**.
2. **`STAFF_ROLE_ID` (ID do Cargo Staff)**: Vá em Configurações do Servidor ➡️ Cargos ➡️ Clique com o botão direito no cargo Staff (`1526370359652122826`) ➡️ **Copiar ID do Cargo**.
3. **`ANNOUNCEMENT_CHANNEL_ID` (ID do Canal de Avisos)**: Clique com o botão direito no canal onde deseja que os avisos diários e lembretes de eventos sejam enviados ➡️ **Copiar ID do Canal**.

---

## ⚙️ Criando e Preenchendo o Arquivo `.env`

Crie um arquivo chamado `.env` na raiz do projeto (ou copie o `.env.example`) e preencha com as suas credenciais:

```env
DISCORD_TOKEN=seu_token_aqui_gerado_no_developer_portal
CLIENT_ID=seu_client_id_da_aplicacao
GUILD_ID=seu_id_do_servidor
STAFF_ROLE_ID=1526370359652122826
ANNOUNCEMENT_CHANNEL_ID=seu_id_do_canal_de_avisos
```

---

## 💻 Rodando Localmente para Testes

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Registre as Slash Commands no Discord:
   ```bash
   npm run deploy-commands
   ```

3. Inicie o Bot:
   ```bash
   npm start
   ```

---

## 🚀 Como Subir para o seu GitHub

1. Inicialize o repositório Git no projeto:
   ```bash
   git init
   ```

2. Adicione os arquivos e crie o commit inicial:
   ```bash
   git add .
   git commit -m "feat: bot nc inicializacao"
   ```

3. Associe ao seu repositório do GitHub e faça o push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/seu-usuario/bot-nc.git
   git push -u origin main
   ```
*(O arquivo `.env` e as pastas `node_modules/` e `data/` já estão configurados no `.gitignore` e não serão enviados por segurança)*.

---

## 🐳 Como Rodar na VPS (Docker Container)

Para colocar o bot rodando 24/7 na sua VPS Linux usando Docker:

1. Na sua VPS, clone o seu repositório do GitHub:
   ```bash
   git clone https://github.com/seu-usuario/bot-nc.git
   cd bot-nc
   ```

2. Crie e preencha o arquivo `.env` na VPS:
   ```bash
   nano .env
   ```
   *(Cole as suas variáveis de ambiente e salve com `Ctrl+O` e saia com `Ctrl+X`)*.

3. Registre os comandos slash (executando um container temporário):
   ```bash
   docker run --rm --env-file .env node:20-alpine npx node -e "import('./src/deploy-commands.js')"
   ```
   *Ou instale as dependências localmente na VPS uma vez e rode `npm run deploy-commands`.*

4. Suba o container com Docker Compose:
   ```bash
   docker compose up -d --build
   ```

5. Para verificar os logs do bot rodando na VPS:
   ```bash
   docker compose logs -f
   ```

---

## 🎮 Comandos do Bot (Restritos à Staff)

- `/agendar-evento` : Agenda um novo evento no fuso GMT-3.
- `/listar-eventos` : Exibe a lista de todos os eventos futuros com seus IDs.
- `/cancelar-evento` : Cancela e remove um evento agendado informando o ID.
- `/sortear-item` : Sorteia itens com divisão entre os jogadores marcados com `@menção`.
