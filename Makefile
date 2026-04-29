# Creator Armour Build & Test Makefile

.PHONY: help install migrate seed test test-unit test-integration test-e2e build dev clean

help:
	@echo "Creator Armour Development Commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make migrate       - Run database migrations"
	@echo "  make seed          - Seed demo data"
	@echo "  make test          - Run all tests"
	@echo "  make test-unit     - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-e2e      - Run E2E tests"
	@echo "  make build         - Build production bundles"
	@echo "  make dev           - Start dev servers"
	@echo "  make clean         - Clean build artifacts"

install:
	@echo "📦 Installing dependencies..."
	cd server && npm install
	npm install

migrate:
	@echo "🗄️  Running migrations..."
	supabase db push
	@echo "✅ Migrations complete"

seed:
	@echo "🌱 Seeding demo data..."
	psql $$DATABASE_URL -f scripts/seed-demo-data.sql || echo "⚠️  Seed script requires DATABASE_URL env var"
	@echo "✅ Seed data loaded"

test:
	@echo "🧪 Running all tests..."
	make test-unit
	make test-integration
	make test-e2e

test-unit:
	@echo "🧪 Running unit tests..."
	cd server && npm test

test-integration:
	@echo "🧪 Running integration tests..."
	cd server && npm run test:integration

test-e2e:
	@echo "🧪 Running E2E tests..."
	npx playwright test

build:
	@echo "🏗️  Building production bundles..."
	cd server && npm run build
	npm run build
	@echo "✅ Build complete"

dev:
	@echo "🚀 Starting development servers..."
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3001"
	npm run dev &
	cd server && npm run dev

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf server/dist
	rm -rf dist
	rm -rf node_modules/.cache
	@echo "✅ Clean complete"

