---
name: lgpd-compliance
description: Audita, implementa e mantém conformidade LGPD para o sistema Gerenc.AI. Use esta skill sempre que o usuário mencionar LGPD, privacidade, dados pessoais, consentimento, anonimização, política de privacidade, termos de uso, DPO, vazamento, incidente, ou qualquer termo relacionado à proteção de dados.
---

# LGPD Compliance — Gerenc.AI

## Contexto
O Gerenc.AI é um SaaS multi-tenant de gestão comercial (PDV, estoque, clientes, pedidos) construído com Django 5 + DRF + SimpleJWT (backend) e React + Vite (frontend). O sistema coleta dados pessoais de operadores (User), clientes (Customer), lojas (Store) e fornecedores (Supplier).

## Dados Pessoais Mapeados

| Model | Campos Sensíveis | Classificação |
|---|---|---|
| `User` | whatsapp (PK), first_name, password | Pessoal |
| `Customer` | whatsapp, name, email, cpf_cnpj, address | Pessoal + Fiscal |
| `Store` | whatsapp, cnpj, email, address | Pessoal (titular) |
| `Supplier` | phone, email, cnpj, address | Pessoal (se PF) |
| `Order` | customer_name_manual, delivery_address, pix_qr_code | Pessoal + Financeiro |

## Checklist de Implementação

### Prioridade Urgente
- [ ] `SECRET_KEY` em variável de ambiente (não hardcoded)
- [ ] `DEBUG=False` em produção
- [ ] `ALLOWED_HOSTS` restrito
- [ ] `CORS_ALLOWED_ORIGINS` restrito
- [ ] JWT lifetime ≤ 30min
- [ ] Política de Privacidade publicada
- [ ] Termos de Uso publicados
- [ ] DPO designado

### Prioridade 30 dias
- [ ] Campos de consentimento no `Customer` (privacy_accepted, marketing_consent)
- [ ] Checkbox de aceite no frontend
- [ ] Criptografia AES-256 para `cpf_cnpj`
- [ ] Model `DataAccessLog` para auditoria de acessos
- [ ] Sanitização de dados pessoais em logs/stack traces
- [ ] Banner de cookies

### Prioridade 60 dias
- [ ] Endpoint `GET /customers/{id}/export-data/` (portabilidade)
- [ ] Endpoint `POST /customers/{id}/request-deletion/` (eliminação)
- [ ] Job `lgpd_cleanup` para retenção automática
- [ ] Migrar de SQLite para PostgreSQL
- [ ] HTTPS + `SECURE_*` settings
- [ ] Rate limiting em `/api/token/`

### Prioridade 120 dias
- [ ] Migração PK (WhatsApp → UUID)
- [ ] DPIA documentado
- [ ] ROPA (Registro de Operações de Tratamento)
- [ ] Tela "Meus Dados" no frontend
- [ ] Teste de penetração

## Política de Retenção

| Dado | Prazo | Ação |
|---|---|---|
| `pix_qr_code` | 72h | SET NULL |
| `delivery_address` | 90 dias | Anonimizar |
| `DataAccessLog` | 1 ano | Excluir |
| Clientes inativos | 2 anos | Notificar → anonimizar |
| Pedidos (fiscal) | 5 anos | Obrigatório manter |
| Logs de erro | 30 dias | Rotação |

## Como Usar
1. Referir à auditoria completa: `.gemini/antigravity/brain/*/lgpd_audit.md`
2. Executar os sprints na ordem indicada
3. Iniciar pelo Sprint 1 (segurança básica + documentos jurídicos)
4. Rodar `python manage.py lgpd_cleanup` diariamente via cron
5. Revisar a política a cada trimestre

## Arquivos Relacionados
- `core/settings.py` — Configurações de segurança
- `core/audit.py` — Sistema de auditoria
- `core/crypto.py` — Criptografia de campos (a criar)
- `core/fields.py` — EncryptedCharField (a criar)
- `customers/models.py` — Campos de consentimento (a adicionar)
- `core/models.py` — DataAccessLog (a criar)
- `core/management/commands/lgpd_cleanup.py` — Job de limpeza (a criar)
