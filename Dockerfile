# Dockerfile (Produção Otimizado para Next.js Standalone com Prisma)

# ---- Stage 1: Dependências e Build ----
# Usamos uma imagem Node com Alpine para um tamanho menor, mas que tenha 'build-base' ou ferramentas
# necessárias para compilar dependências nativas que o Prisma possa precisar.
# node:22-alpine é uma boa escolha. Ajuste a versão do Node se necessário.
FROM node:22-alpine AS deps
# Instala python, make e g++ que podem ser necessários para compilar
# dependências nativas de alguns pacotes (incluindo potencialmente o Prisma em alguns casos).
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copia apenas os arquivos de manifesto de dependência
COPY package.json package-lock.json* ./
# Instala APENAS as dependências de produção (reduz o tamanho da pasta node_modules)
RUN npm ci --omit=dev --ignore-scripts

# ---- Stage 2: Builder ----
# Reutiliza a mesma imagem base ou uma similar
FROM node:22-alpine AS builder
WORKDIR /app
# Copia a pasta node_modules já instalada do estágio 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Copia o restante dos arquivos necessários para o build
COPY . .

# Define variáveis de ambiente que o Prisma pode precisar durante o generate/build
# (Garante que o Prisma saiba onde encontrar o schema, mesmo que não precise do DB aqui)
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED 1

# Instala temporariamente as devDependencies para rodar 'prisma generate' e 'next build'
# Fazemos isso separadamente para que 'deps' permaneça apenas com dependências de produção.
# Copia os manifests novamente (pode parecer redundante, mas garante que o estado está correto)
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts
# Gera o Prisma Client baseado no schema
# Isso é crucial para que o Next.js possa analisar tipos e o cliente seja incluído corretamente
RUN npx prisma generate

# Constrói a aplicação Next.js para produção com output standalone
RUN npm run build
# Remove as devDependencies após o build (opcional, mas limpa um pouco)
RUN npm prune --omit=dev

# ---- Stage 3: Runner ----
# Imagem final baseada em Alpine para manter o tamanho pequeno
FROM node:22-alpine AS runner
WORKDIR /app

# Define o ambiente como produção (importante para Next.js e outras libs)
ENV NODE_ENV production
# Desabilita telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Cria um usuário e grupo não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a saída standalone otimizada do estágio 'builder'
# Define o usuário/grupo 'nextjs:nodejs' como proprietário dos arquivos copiados
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copia a pasta 'public'
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copia a pasta '.next/static' para assets otimizados
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# **IMPORTANTE PARA PRISMA + STANDALONE:**
# Copia o schema Prisma E os binários do Prisma Client gerados para a imagem final.
# O cliente standalone precisa deles em runtime para se conectar ao banco.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/


# Define o usuário não-root para rodar a aplicação
USER nextjs

# Expõe a porta que o Next.js rodará (padrão 3000)
EXPOSE 3000

# Define a variável de ambiente PORT (Next.js standalone a utiliza)
ENV PORT 3000

# Comando para iniciar a aplicação Next.js standalone
# Ele executa o servidor Node.js otimizado gerado pelo build.
CMD ["node", "server.js"]