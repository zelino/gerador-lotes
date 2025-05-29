# Implantação em Produção - Gerador de Lotes

Este guia descreve como implantar o Gerador de Lotes em um ambiente de produção usando apenas o PostgreSQL no Docker e a aplicação Next.js rodando diretamente no servidor.

## Pré-requisitos

- Ubuntu Server 20.04 LTS ou superior
- Node.js 16 ou superior
- Docker
- Git

## Implantação Rápida

1. Clone o repositório:
   ```bash
   git clone https://github.com/zelino/gerador-lotes.git
   cd gerador-lotes
   ```

2. Execute o script de implantação:
   ```bash
   chmod +x deploy-prod.sh
   sudo ./deploy-prod.sh
   ```

3. Acesse a aplicação em:
   ```
   http://SEU_IP_DO_SERVIDOR:3000
   ```

## O que o Script de Implantação Faz

O script `deploy-prod.sh` automatiza as seguintes tarefas:

1. Verifica dependências (Docker, Node.js)
2. Configura o arquivo `.env.prod` com variáveis de ambiente para produção
3. Inicia o PostgreSQL em um contêiner Docker
4. Instala dependências do Node.js
5. Executa migrações do banco de dados
6. Constrói a aplicação Next.js
7. Instala PM2 (gerenciador de processos)
8. Inicia a aplicação com PM2
9. Configura PM2 para iniciar na inicialização do sistema

## Scripts Disponíveis

- **deploy-prod.sh**: Implanta a aplicação em produção
- **update-prod.sh**: Atualiza a aplicação com as últimas alterações do repositório
- **cleanup-prod.sh**: Para a aplicação e remove recursos

## Comandos NPM

```bash
# Implantar em produção
npm run deploy

# Atualizar a aplicação
npm run update

# Limpar recursos
npm run cleanup

# Executar migrações do Prisma
npm run prisma:deploy

# Abrir Prisma Studio (interface para o banco de dados)
npm run prisma:studio
```

## Credenciais Padrão

Após a implantação, você pode fazer login com as seguintes credenciais:

- **Usuário**: admin
- **Senha**: URpoLadI

**IMPORTANTE**: Altere a senha do usuário admin após o primeiro login!

## Monitoramento e Logs

Para monitorar a aplicação:
```bash
pm2 monit
```

Para ver os logs:
```bash
pm2 logs gerador-lotes
```

## Configuração do Proxy Reverso (Opcional)

Para expor a aplicação na porta 80/443 com HTTPS, é recomendado configurar um proxy reverso como Nginx.

### Instalação do Nginx:
```bash
sudo apt update
sudo apt install -y nginx
```

### Configuração do Nginx:
```bash
sudo nano /etc/nginx/sites-available/gerador-lotes
```

Adicione a seguinte configuração:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative a configuração:
```bash
sudo ln -s /etc/nginx/sites-available/gerador-lotes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Configuração HTTPS com Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## Solução de Problemas

### Banco de Dados
- Verificar status do contêiner: `docker ps`
- Ver logs do PostgreSQL: `docker logs gerador_lotes_db_prod`

### Aplicação
- Verificar status da aplicação: `pm2 status`
- Ver logs detalhados: `pm2 logs gerador-lotes`
- Reiniciar aplicação: `pm2 restart gerador-lotes`
