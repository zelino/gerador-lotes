#!/bin/bash

# ANSI color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de Atualização para Gerador de Lotes ===${NC}"
echo -e "${YELLOW}Este script atualiza a aplicação com as últimas alterações do repositório.${NC}"
echo ""

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
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git não está instalado. Instale-o primeiro.${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}PM2 não está instalado. Execute deploy-prod.sh primeiro.${NC}"
    exit 1
fi

# Puxar as últimas alterações do repositório
echo -e "${BLUE}Puxando as últimas alterações do repositório...${NC}"
git fetch origin

# Verificar se há mudanças para puxar
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${YELLOW}O código já está atualizado. Nenhuma alteração encontrada.${NC}"
    echo -e "${YELLOW}Deseja forçar a reconstrução mesmo assim? (s/n): ${NC}"
    read FORCE_REBUILD
    
    if [[ $FORCE_REBUILD != "s" && $FORCE_REBUILD != "S" ]]; then
        echo -e "${BLUE}Nenhuma ação necessária. Operação concluída.${NC}"
        exit 0
    fi
else
    # Puxar as alterações
    echo -e "${BLUE}Atualizando código-fonte...${NC}"
    git pull
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Falha ao puxar alterações. Verifique o log acima.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Código-fonte atualizado com sucesso!${NC}"
fi

# Instalar dependências atualizadas
echo -e "${BLUE}Atualizando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao atualizar dependências. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Dependências atualizadas com sucesso!${NC}"

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
echo -e "${BLUE}Reconstruindo a aplicação Next.js...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao reconstruir a aplicação Next.js. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}Aplicação Next.js reconstruída com sucesso!${NC}"

# Reiniciar a aplicação com PM2
echo -e "${BLUE}Reiniciando a aplicação...${NC}"
pm2 restart gerador-lotes

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao reiniciar a aplicação com PM2. Verifique o log acima.${NC}"
    exit 1
fi

echo -e "${GREEN}===== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO! =====${NC}"
echo -e "${YELLOW}A aplicação foi atualizada e reiniciada.${NC}"
echo -e "${YELLOW}Para monitorar a aplicação: pm2 monit${NC}"
echo -e "${YELLOW}Para ver os logs: pm2 logs gerador-lotes${NC}"
