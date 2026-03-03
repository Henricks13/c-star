# C-Star Platform

Casca inicial da plataforma de cursos (white-label ready), com stack:

- Backend: Spring Boot + Liquibase + JWT base
- Frontend: Angular
- Banco local: PostgreSQL via Docker Compose

## Estrutura

- `backend` API principal
- `frontend` app Angular
- `infra` serviços locais (Postgres/Adminer)
- `settings-c-star` settings Maven exclusivos do projeto
- `repository-c-star` cache Maven local exclusivo do projeto

## Padrão Maven do projeto

Para evitar conflito com outros projetos na mesma máquina, o backend usa configuração Maven isolada:

- Arquivo: `backend/.mvn/maven.config`
- Settings: `settings-c-star/settings.xml`
- Repositório local: `repository-c-star`

Isso já está configurado por padrão. Qualquer comando Maven rodando dentro de `backend` usa esse repositório isolado.

Exemplo:

```bash
cd backend
mvn clean package
```

## Pré-requisitos

- Java 21
- Maven 3.9+
- Node 20+
- Docker Desktop

## Subir ambiente local

1. Banco

```bash
cd infra
docker compose up -d
```

2. Backend

```bash
cd backend
mvn spring-boot:run
```

Healthcheck:

- `http://localhost:8080/actuator/health`
- `http://localhost:8080/api/public/ping`

3. Frontend

```bash
cd frontend
npm start
```

App:

- `http://localhost:4200`

4. Banco (UI)

- Adminer: `http://localhost:8081`
- Server: `postgres` (se abrir pelo Adminer no browser local, também pode usar `localhost:55432`)
- User: `cstar`
- Password: `cstar123`
- Database: `cstar`

## Próximas fases

1. Entidades de domínio (`user`, `course`, `lesson`, `enrollment`, `payment`)
2. Auth JWT completo (login/refresh/roles)
3. Integração S3 + CloudFront com Signed URL
4. Modo white-label (tenant por schema/config)

## Git + CI/CD

### 1) Subir no GitHub

```bash
cd c:\Temp\Projects\c-star
git add .
git commit -m "chore: bootstrap c-star with ci/cd"
git remote add origin <URL_DO_REPOSITORIO_GITHUB>
git push -u origin main
```

### 2) Pipeline de CI

Arquivo: `.github/workflows/ci.yml`

Executa em push/PR:

- build backend (`mvn -DskipTests package`)
- build frontend (`npm ci && npm run build`)

### 3) Pipeline de Deploy (servidor)

Arquivo: `.github/workflows/deploy.yml`

Executa em `main` e manualmente (`workflow_dispatch`):

- copia o projeto para servidor via SSH
- executa `docker compose -f infra/docker-compose.server.yml up -d --build`

### 4) Secrets do GitHub necessários

No repositório GitHub, em `Settings > Secrets and variables > Actions`, criar:

- `VPS_HOST` (IP ou domínio do servidor)
- `VPS_USER` (usuário SSH)
- `VPS_SSH_KEY` (chave privada SSH)
- `VPS_PORT` (normalmente 22)
- `DEPLOY_PATH` (ex: `/opt/c-star`)

### 5) Pré-requisitos no servidor

- Docker + Docker Compose instalados
- Porta 80 liberada (frontend)
- Porta 8080 liberada apenas se quiser expor backend direto

## Deploy manual na AWS EC2 (recomendado para primeira subida)

### 1) Conectar no servidor

```bash
ssh -i "caminho/da/sua-chave.pem" ubuntu@SEU_IP_PUBLICO
```

### 2) Instalar Docker no servidor

```bash
sudo mkdir -p /opt/c-star
sudo chown -R $USER:$USER /opt/c-star
cd /opt/c-star
git clone <URL_DO_SEU_REPO> .
bash infra/scripts/bootstrap-ubuntu.sh
exit
```

Conecte novamente por SSH após o `exit`.

### 3) Configurar variáveis de produção

```bash
cd /opt/c-star
cp infra/.env.server.example infra/.env.server
nano infra/.env.server
```

Defina:

- `POSTGRES_PASSWORD` forte
- `JWT_SECRET` com alta entropia (mínimo 32 caracteres)

### 4) Subir aplicação

```bash
cd /opt/c-star
bash infra/scripts/deploy-ec2.sh
```

### 5) Validar

```bash
docker compose --env-file infra/.env -f infra/docker-compose.server.yml ps
curl http://localhost/actuator/health
```

Se o health retornar `UP`, acesse no navegador:

- `http://SEU_IP_PUBLICO`
