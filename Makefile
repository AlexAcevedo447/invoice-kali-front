SHELL := /bin/sh

COMPOSE_DEV := docker compose -f docker-compose.dev.yml --env-file .env.dev
COMPOSE_PROD := docker compose -f docker-compose.prod.yml
DEV_CONTAINER := invoice-kali-front-dev
PROD_CONTAINER := invoice-kali-front-prod
PROD_HEALTH_URL ?= http://localhost:15080/health

.PHONY: help network-check dev-up dev-build dev-ps dev-logs dev-down dev-restart dev-shell \
	prod-up prod-build prod-ps prod-logs prod-down prod-restart prod-health \
	up down ps logs build status

help:
	@echo "Comandos disponibles:" \
	&& echo "  make network-check  -> Lista redes y subredes Docker" \
	&& echo "  make dev-up         -> Levanta desarrollo con build" \
	&& echo "  make dev-build      -> Rebuild desarrollo" \
	&& echo "  make dev-ps         -> Estado contenedores dev" \
	&& echo "  make dev-logs       -> Sigue logs dev" \
	&& echo "  make dev-down       -> Baja entorno dev" \
	&& echo "  make dev-restart    -> Reinicia dev" \
	&& echo "  make dev-shell      -> Shell dentro del contenedor dev" \
	&& echo "  make prod-up        -> Levanta producción con build" \
	&& echo "  make prod-build     -> Rebuild producción" \
	&& echo "  make prod-ps        -> Estado contenedores prod" \
	&& echo "  make prod-logs      -> Sigue logs prod" \
	&& echo "  make prod-health    -> Verifica /health en prod" \
	&& echo "  make prod-down      -> Baja entorno prod" \
	&& echo "  make prod-restart   -> Reinicia prod" \
	&& echo "  make up             -> Levanta dev + prod" \
	&& echo "  make down           -> Baja dev + prod" \
	&& echo "  make ps             -> Estado dev + prod" \
	&& echo "  make logs           -> Logs dev + prod" \
	&& echo "  make build          -> Build dev + prod"

network-check:
	docker network ls --format '{{.Name}}'
	@echo "\nSubredes en uso:"
	@for n in $$(docker network ls --format '{{.Name}}'); do \
		echo "=== $$n ==="; \
		docker network inspect "$$n" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'; \
	done

dev-up:
	$(COMPOSE_DEV) up -d --build

dev-build:
	$(COMPOSE_DEV) build

dev-ps:
	$(COMPOSE_DEV) ps

dev-logs:
	docker logs -f $(DEV_CONTAINER)

dev-down:
	$(COMPOSE_DEV) down

dev-restart: dev-down dev-up

dev-shell:
	docker exec -it $(DEV_CONTAINER) sh

prod-up:
	$(COMPOSE_PROD) up -d --build

prod-build:
	$(COMPOSE_PROD) build

prod-ps:
	$(COMPOSE_PROD) ps

prod-logs:
	docker logs -f $(PROD_CONTAINER)

prod-health:
	curl -fsS $(PROD_HEALTH_URL) && echo

prod-down:
	$(COMPOSE_PROD) down

prod-restart: prod-down prod-up

up: dev-up prod-up

down: dev-down prod-down

ps: dev-ps prod-ps

logs:
	@echo "=== DEV ==="
	@docker logs --tail 100 $(DEV_CONTAINER) || true
	@echo "\n=== PROD ==="
	@docker logs --tail 100 $(PROD_CONTAINER) || true

build: dev-build prod-build

status: network-check ps prod-health
