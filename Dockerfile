# Utiliza uma imagem leve do Node.js 20 Alpine
FROM node:20-alpine

# Define o fuso horário como America/Sao_Paulo (GMT-3)
RUN apk add --no-cache tzdata
ENV TZ=America/Sao_Paulo

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências de produção
RUN npm ci --only=production

# Copia o código fonte da aplicação
COPY . .

# Cria e expõe o diretório de persistência de dados
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Comando para iniciar o Bot
CMD ["npm", "start"]
