#!/bin/bash

# ANSI color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de Deploy para Gerador de Lotes ===${NC}"
echo -e "${YELLOW}Este script configura o ambiente de produção com PostgreSQL no Docker${NC}"
echo -e "${YELLOW}e a aplicação Next.js rodando diretamente no servidor.${NC}"
echo ""

# Configurações do PostgreSQL
DB_USER="lotes"
DB_PASSWORD="hzURMxmcRStB"
DB_NAME="db_lotes"
DB_PORT="5432"
DB_CONTAINER_NAME="gerador_lotes_db_prod"

# Verificar se o script está sendo executado como root ou com sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
    echo -e "${YELLOW}Este script não está sendo executado como root ou com sudo.${NC}"
    echo -e "${YELLOW}Algumas operações podem falhar por falta de permissões.${NC}"
    echo -e "${YELLOW}Recomendamos executar com sudo.${NC}"
    read -p "Deseja continuar mesmo assim? (s/n): " CONTINUE
    if [[ $CONTINUE != "s" && $CONTINUE != "S" ]]; then
        echo -e "${RED}Operação cancelada pelo usuário.${NC}"
        exit 1
    fi
fi

# Verificar dependências
echo -e "${BLUE}Verificando dependências...${NC}"
DEPS_MISSING=0

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não está instalado. Instale-o primeiro.${NC}"
    DEPS_MISSING=1
fi

# Quando executado com sudo, precisamos identificar o usuário real
REAL_USER=${SUDO_USER:-$USER}
REAL_HOME=$(eval echo ~$REAL_USER)

# Verificar se NVM está presente no ambiente do usuário real
if [ -f "$REAL_HOME/.nvm/nvm.sh" ]; then
    echo -e "${BLUE}NVM detectado em $REAL_HOME/.nvm, carregando...${NC}"
    export NVM_DIR="$REAL_HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # Carrega NVM
fi

# Tentar várias abordagens para detectar o Node.js
if command -v node &> /dev/null; then
    NODE_CMD="node"
elif [ -x "$REAL_HOME/.nvm/versions/node/v"*"/bin/node" ]; then
    # Encontrar a última versão do Node instalada pelo NVM
    NODE_CMD=$(ls -t $REAL_HOME/.nvm/versions/node/v*/bin/node | head -1)
    echo -e "${BLUE}Usando Node.js em: $NODE_CMD${NC}"
    PATH=$(dirname $NODE_CMD):$PATH
    export PATH
else
    echo -e "${RED}Node.js não está instalado. Instale-o primeiro.${NC}"
    DEPS_MISSING=1
fi

# Verificar a versão do Node.js se detectado
if [ -n "$NODE_CMD" ]; then
    NODE_VERSION=$($NODE_CMD -v | cut -d'v' -f2)
    echo -e "${GREEN}Node.js versão $NODE_VERSION detectada.${NC}"
    if [[ $(echo "$NODE_VERSION < 16" | bc -l) -eq 1 ]]; then
        echo -e "${RED}É necessário Node.js 16 ou superior.${NC}"
        DEPS_MISSING=1
    fi
fi

# Verificar NPM
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}npm versão $NPM_VERSION detectada.${NC}"
elif [ -x "$REAL_HOME/.nvm/versions/node/v"*"/bin/npm" ]; then
    # Encontrar o npm associado à última versão do Node
    NPM_CMD=$(ls -t $REAL_HOME/.nvm/versions/node/v*/bin/npm | head -1)
    echo -e "${BLUE}Usando npm em: $NPM_CMD${NC}"
    PATH=$(dirname $NPM_CMD):$PATH
    export PATH
    NPM_VERSION=$($NPM_CMD -v)
    echo -e "${GREEN}npm versão $NPM_VERSION detectada.${NC}"
else
    echo -e "${RED}npm não está instalado. Instale-o primeiro.${NC}"
    DEPS_MISSING=1
fi

if [ $DEPS_MISSING -eq 1 ]; then
    echo -e "${RED}Dependências não atendidas. Por favor, instale-as e tente novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}Todas as dependências estão instaladas!${NC}"

# Configurando o ambiente de produção
echo -e "${BLUE}Configurando ambiente de produção...${NC}"

# Criar arquivo .env.prod
echo -e "${BLUE}Criando arquivo .env.prod...${NC}"
cat > .env.prod << EOL
# Configuração do Banco de Dados (PostgreSQL)
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=$DB_NAME
POSTGRES_PORT=$DB_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME?schema=public

# Configuração do NextAuth
NEXTAUTH_URL=http://$(hostname -I | awk '{print $1}'):3000
# Gerando um segredo aleatório
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Configuração de Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_FROM_ADDRESS=seu-email@gmail.com
EMAIL_APP_PASSWORD=sua-senha-de-app
EMAIL_RECIPIENTS=destinatario1@email.com,destinatario2@email.com
EOL

echo -e "${GREEN}Arquivo .env.prod criado com sucesso!${NC}"

# Parar contêiner se já existir
if docker ps -a | grep -q $DB_CONTAINER_NAME; then
    echo -e "${BLUE}Parando e removendo contêiner existente do PostgreSQL...${NC}"
    docker stop $DB_CONTAINER_NAME >/dev/null 2>&1
    docker rm $DB_CONTAINER_NAME >/dev/null 2>&1
fi

# Iniciar PostgreSQL em Docker
echo -e "${BLUE}Iniciando PostgreSQL em Docker...${NC}"
docker run -d \
    --name $DB_CONTAINER_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=$DB_NAME \
    -p $DB_PORT:5432 \
    -v postgres_prod_data:/var/lib/postgresql/data \
    --restart unless-stopped \
    postgres:16

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao iniciar o PostgreSQL. Verifique os logs do Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}PostgreSQL iniciado com sucesso!${NC}"

# Aguardar PostgreSQL inicializar
echo -e "${YELLOW}Aguardando PostgreSQL inicializar (10 segundos)...${NC}"
sleep 10

# Instalar dependências do Node.js
echo -e "${BLUE}Instalando dependências do Node.js...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao instalar dependências do Node.js. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Dependências instaladas com sucesso!${NC}"

# Executar migrações do Prisma
echo -e "${BLUE}Executando migrações do Prisma...${NC}"
npm run prisma:deploy

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Comando personalizado prisma:deploy não encontrado, tentando diretamente...${NC}"
    npx prisma migrate deploy --env-file .env.prod
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao executar migrações do Prisma. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Migrações do Prisma executadas com sucesso!${NC}"

# Executar seed do Prisma
echo -e "${BLUE}Executando seed do Prisma...${NC}"
npm run db:seed

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Comando personalizado db:seed não encontrado, tentando diretamente...${NC}"
    npx prisma db seed --env-file .env.prod
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao executar seed do Prisma. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Seed do Prisma executado com sucesso!${NC}"

# Construir a aplicação Next.js
echo -e "${BLUE}Construindo a aplicação Next.js...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao construir a aplicação Next.js. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Aplicação Next.js construída com sucesso!${NC}"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}Instalando PM2 para gerenciar a aplicação...${NC}"
    npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Falha ao instalar PM2. Verifique o log acima.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}PM2 já está instalado!${NC}"
fi

# Parar instância anterior se existir
if pm2 list | grep -q "gerador-lotes"; then
    echo -e "${BLUE}Parando instância anterior da aplicação...${NC}"
    pm2 stop gerador-lotes
    pm2 delete gerador-lotes
fi

# Iniciar a aplicação com PM2
echo -e "${BLUE}Iniciando a aplicação com PM2...${NC}"
# Verifica qual comando deve ser usado para iniciar o aplicativo
if [ -f ".next/standalone/server.js" ]; then
    # Para aplicações com output: 'standalone'
    pm2 start .next/standalone/server.js --name gerador-lotes --env production
else
    # Para aplicações padrão
    pm2 start npm --name gerador-lotes -- start
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao iniciar a aplicação com PM2. Verifique o log acima.${NC}"
    exit 1
fi

# Salvar configuração do PM2
pm2 save

echo -e "${GREEN}Aplicação iniciada com sucesso!${NC}"

# Configurar PM2 para iniciar na inicialização do sistema
echo -e "${BLUE}Configurando PM2 para iniciar na inicialização do sistema...${NC}"
pm2 startup

echo -e "${GREEN}===== DEPLOY CONCLUÍDO COM SUCESSO! =====${NC}"
echo -e "${YELLOW}A aplicação está rodando em: http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo -e "${YELLOW}Para monitorar a aplicação: pm2 monit${NC}"
echo -e "${YELLOW}Para ver os logs: pm2 logs gerador-lotes${NC}"
echo -e "${YELLOW}Banco de dados PostgreSQL está rodando em Docker (porta $DB_PORT)${NC}"
echo ""
echo -e "${BLUE}Credenciais padrão:${NC}"
echo -e "${YELLOW}Usuário: admin${NC}"
echo -e "${YELLOW}Senha: URpoLadI${NC}"
echo -e "${RED}IMPORTANTE: Altere a senha do usuário admin após o primeiro login!${NC}"
