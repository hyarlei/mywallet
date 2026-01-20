-- Script SQL para popular o banco de dados com dados de teste
-- Execute este script após criar as migrations

-- 1. Criar usuário de teste
INSERT INTO "Users" ("Id", "Name", "Email", "GoogleId", "AvatarUrl", "CreatedAt", "UpdatedAt")
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Hyarlei Dev', 'hyarlei@test.com', 'google123', NULL, NOW(), NULL)
ON CONFLICT ("Id") DO NOTHING;

-- 2. Criar categorias
INSERT INTO "Categories" ("Id", "Name", "Type", "Color", "Icon", "UserId", "CreatedAt", "UpdatedAt")
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Freelas', 1, '#10b981', 'laptop', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('33333333-3333-3333-3333-333333333333', 'Salário', 1, '#22c55e', 'banknote', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('44444444-4444-4444-4444-444444444444', 'Alimentação', 2, '#f97316', 'utensils', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('55555555-5555-5555-5555-555555555555', 'Transporte', 2, '#3b82f6', 'car', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('66666666-6666-6666-6666-666666666666', 'Casa', 2, '#6366f1', 'home', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('77777777-7777-7777-7777-777777777777', 'Lazer', 2, '#a855f7', 'gamepad-2', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    ('88888888-8888-8888-8888-888888888888', 'Outros', 2, '#6b7280', 'package', '11111111-1111-1111-1111-111111111111', NOW(), NULL)
ON CONFLICT ("Id") DO NOTHING;

-- 3. Criar algumas transações de exemplo
INSERT INTO "Transactions" ("Id", "Description", "Amount", "Date", "Type", "IsPaid", "CategoryId", "UserId", "CreatedAt", "UpdatedAt")
VALUES 
    (gen_random_uuid(), 'Freela BarberFlow', 2500.00, '2026-01-15', 1, true, '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Salário Janeiro', 5000.00, '2026-01-05', 1, true, '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Almoço Restaurante', 45.90, '2026-01-16', 2, true, '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Uber para o trabalho', 25.00, '2026-01-16', 2, true, '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Mercado', 320.50, '2026-01-14', 2, true, '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Gasolina', 250.00, '2026-01-12', 2, true, '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Netflix', 55.90, '2026-01-10', 2, true, '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', NOW(), NULL),
    (gen_random_uuid(), 'Conta de Luz', 180.00, '2026-01-08', 2, true, '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', NOW(), NULL);

-- Verificar dados inseridos
SELECT 'Usuários' as Tabela, COUNT(*) as Total FROM "Users"
UNION ALL
SELECT 'Categorias', COUNT(*) FROM "Categories"
UNION ALL
SELECT 'Transações', COUNT(*) FROM "Transactions";
