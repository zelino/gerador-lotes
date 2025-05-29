#!/bin/bash

# ANSI color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de Limpeza para Gerador de Lotes ===${NC}"
echo -e "${YELLOW}Este script para a aplicação e opcionalmente remove recursos.${NC}"
echo ""

# Configurações
DB_CONTAINER_NAME="gerador_lotes_db_prod"

# Parar a aplicação com PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "gerador-lotes"; then
        echo -e "${BLUE}Parando a aplicação...${NC}"
        pm2 stop gerador-lotes
        echo -e "${GREEN}Aplicação parada com sucesso!${NC}"
    else
        echo -e "${YELLOW}Aplicação não está rodando no PM2.${NC}"
    fi
else
    echo -e "${YELLOW}PM2 não está instalado. Não foi possível parar a aplicação.${NC}"
fi

# Verificar se o contêiner do PostgreSQL está em execução
if command -v docker &> /dev/null; then
    if docker ps | grep -q $DB_CONTAINER_NAME; then
        echo -e "${BLUE}Parando o contêiner do PostgreSQL...${NC}"
        docker stop $DB_CONTAINER_NAME
        echo -e "${GREEN}Contêiner do PostgreSQL parado com sucesso!${NC}"
    else
        echo -e "${YELLOW}Contêiner do PostgreSQL não está em execução.${NC}"
    fi
else
    echo -e "${YELLOW}Docker não está instalado. Não foi possível parar o PostgreSQL.${NC}"
fi

# Perguntar se deseja remover o contêiner
read -p "Deseja remover o contêiner do PostgreSQL? (s/n): " REMOVE_CONTAINER
if [[ $REMOVE_CONTAINER == "s" || $REMOVE_CONTAINER == "S" ]]; then
    if command -v docker &> /dev/null; then
        docker rm $DB_CONTAINER_NAME
        echo -e "${GREEN}Contêiner do PostgreSQL removido com sucesso!${NC}"
    else
        echo -e "${YELLOW}Docker não está instalado. Não foi possível remover o PostgreSQL.${NC}"
    fi
fi

# Perguntar se deseja remover o volume (isso apagará TODOS os dados do banco)
read -p "ATENÇÃO: Deseja remover o volume do PostgreSQL? Isso apagará TODOS os dados! (s/n): " REMOVE_VOLUME
if [[ $REMOVE_VOLUME == "s" || $REMOVE_VOLUME == "S" ]]; then
    if command -v docker &> /dev/null; then
        docker volume rm postgres_prod_data
        echo -e "${GREEN}Volume do PostgreSQL removido com sucesso!${NC}"
        echo -e "${YELLOW}Todos os dados do banco foram apagados.${NC}"
    else
        echo -e "${YELLOW}Docker não está instalado. Não foi possível remover o volume.${NC}"
    fi
fi

# Perguntar se deseja remover a aplicação do PM2
read -p "Deseja remover a aplicação do PM2? (s/n): " REMOVE_PM2
if [[ $REMOVE_PM2 == "s" || $REMOVE_PM2 == "S" ]]; then
    if command -v pm2 &> /dev/null; then
        pm2 delete gerador-lotes
        pm2 save
        echo -e "${GREEN}Aplicação removida do PM2 com sucesso!${NC}"
    else
        echo -e "${YELLOW}PM2 não está instalado. Não foi possível remover a aplicação.${NC}"
    fi
fi

echo -e "${GREEN}Limpeza concluída!${NC}"
