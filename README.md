# 🏪 Barbearia Goldblad — API Documentation

API REST para integração com aplicativo React Native.

## 🔗 Base URL

```
https://jwgjrdyhoqygwbdnywji.supabase.co/functions/v1/barbershop-api
```

## 🔑 Headers Obrigatórios

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z2pyZHlob3F5Z3diZG55d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzkyNTksImV4cCI6MjA4NjMxNTI1OX0.UmWofcvzoM0zKxB2ghtYuZjXIpDJUlMHz8q_G41Z9Z0` | Sempre |
| `Content-Type` | `application/json` | POST/PATCH |
| `Authorization` | `Bearer <access_token>` | Endpoints autenticados |

---

## 📖 Endpoints Públicos (sem autenticação)

### `GET /barbers`
Lista barbeiros ativos.

**Response:**
```json
{
  "barbers": [
    { "id": "uuid", "name": "João", "phone": "11999...", "photo_url": "https://...", "specialty": "Degradê" }
  ]
}
```

---

### `GET /services`
Lista serviços ativos.

**Response:**
```json
{
  "services": [
    { "id": "uuid", "name": "Corte", "price": 35, "category": "servico", "is_active": true, "sort_order": 0 }
  ]
}
```

---

### `GET /timeslots?barber_id=UUID&date=YYYY-MM-DD`
Retorna horários disponíveis para agendamento.

**Response:**
```json
{ "available_slots": ["09:00:00", "09:30:00", "10:00:00"] }
```

---

### `POST /appointments`
Cria agendamento (cliente, sem login). Envia push notification automaticamente.

**Body:**
```json
{
  "barber_id": "uuid",
  "client_name": "Carlos",
  "client_phone": "11999999999",
  "appointment_date": "2026-03-15",
  "appointment_time": "10:00:00",
  "service_type": "corte",
  "total_amount": 35
}
```

---

## 🔐 Autenticação

### `POST /auth/login`
```json
{ "email": "barbeiro@email.com", "password": "123456" }
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "expires_at": 1234567890,
  "user": { "id": "uuid", "email": "...", "role": "owner|barber", "barber_id": "uuid|null" }
}
```

### `POST /auth/refresh`
```json
{ "refresh_token": "abc..." }
```

### `GET /auth/me` 🔒
Retorna dados do usuário logado.

### `POST /auth/update-password` 🔒
```json
{ "password": "novaSenha123" }
```

---

## 📅 Agendamentos (Autenticado) 🔒

### `GET /appointments`
| Param | Descrição |
|-------|-----------|
| `date` | Data exata (YYYY-MM-DD) |
| `date_from` | Data início |
| `date_to` | Data fim |
| `status` | `pendente`, `confirmado`, `concluido`, `cancelado` |

### `GET /appointments/:id` 🔒
### `POST /appointments` 🔒 (com push notification)
### `PATCH /appointments/:id` 🔒
Campos: `status`, `service_type`, `total_amount`, `products_sold`, `observation`, `payment_method`

### `DELETE /appointments/:id` 🔒 (Owner only)

---

## 👑 Planos / Assinaturas (Corte Ilimitado)

### `GET /subscriptions` 🔒
Lista assinaturas. Barbeiro vê apenas as suas; Owner vê todas.

| Param | Descrição |
|-------|-----------|
| `status` | Filtrar por status: `active`, `inactive`, `cancelled` |

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "client_name": "Carlos",
      "client_phone": "11999999999",
      "barber_id": "uuid",
      "plan_name": "Corte Ilimitado",
      "plan_price": 100,
      "status": "active",
      "start_date": "2026-03-07",
      "end_date": "2026-04-06",
      "created_at": "...",
      "barbers": { "name": "João" }
    }
  ],
  "summary": {
    "total": 5,
    "active": 3,
    "total_plan_revenue": 300
  }
}
```

---

### `POST /subscriptions`
Cria assinatura (público ou autenticado).

**Body:**
```json
{
  "client_name": "Carlos",
  "client_phone": "11999999999",
  "barber_id": "uuid",
  "plan_name": "Corte Ilimitado",
  "plan_price": 100
}
```

**Response (201):**
```json
{ "subscription": { "id": "uuid", "status": "active", ... } }
```

---

### `PATCH /subscriptions/:id` 🔒 (Owner only)
Atualiza assinatura (ex: desativar).

**Body:**
```json
{ "status": "inactive" }
```

---

### `DELETE /subscriptions/:id` 🔒 (Owner only)
Remove assinatura.

---

## 📱 Push Notifications 🔒

### `POST /push-tokens`
```json
{ "token": "ExponentPushToken[xxxxxx]", "device_info": "iPhone 15 Pro" }
```

### `DELETE /push-tokens` 🔒
```json
{ "token": "ExponentPushToken[xxxxxx]" }
```

---

## 💰 Financeiro 🔒

### `GET /financial/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
Resumo financeiro do período. Inclui receita de assinaturas.

**Response (Owner):**
```json
{
  "period": { "from": "2026-03-01", "to": "2026-03-31" },
  "total_revenue": 3500,
  "total_expenses": 800,
  "total_subscription_revenue": 300,
  "total_active_subscribers": 3,
  "profit": 3000,
  "total_appointments": 100,
  "per_barber": [
    {
      "barber_id": "uuid",
      "name": "João",
      "revenue": 2000,
      "count": 57,
      "subscribers": 2,
      "sub_revenue": 200
    }
  ]
}
```

---

### `GET /financial/expenses?date_from=&date_to=` 🔒 (Owner only)

### `POST /financial/expenses` 🔒 (Owner only)
```json
{ "category": "aluguel", "description": "Aluguel março", "amount": 2000, "expense_date": "2026-03-01" }
```

### `DELETE /financial/expenses/:id` 🔒 (Owner only)

---

## 📤 Upload de Fotos 🔒 (Owner only)

### `POST /upload?bucket=barber-photos&file_name=foto.jpg`

| Param | Valores |
|-------|---------|
| `bucket` | `barber-photos`, `gallery`, `site-assets` |
| `file_name` | Ex: `foto.jpg` |

**Headers:** `Content-Type: image/jpeg` | **Body:** Raw binary data

---

## 🛠️ Gestão (Owner only) 🔒

### Barbeiros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/barbers` | Lista todos + usuários vinculados |
| `POST` | `/manage/barbers` | Cria barbeiro (auto-gera horários) |
| `PATCH` | `/manage/barbers/:id` | Atualiza barbeiro |
| `POST` | `/manage/barber-user` | Cria login `{ email, password, barber_id }` |
| `DELETE` | `/manage/barber-user/:user_id` | Remove login |

### Serviços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/services` | Lista todos (incluindo inativos) |
| `POST` | `/manage/services` | Cria serviço |
| `PATCH` | `/manage/services/:id` | Atualiza |
| `DELETE` | `/manage/services/:id` | Remove |

### Horários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/timeslots?barber_id=UUID` | Lista horários |
| `POST` | `/manage/timeslots` | Cria horário |
| `DELETE` | `/manage/timeslots/:id` | Remove |

### Bloqueios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/manage/blocked-slots` | Bloqueia horário/dia |
| `DELETE` | `/manage/blocked-slots/:id` | Remove bloqueio |

---

## 🚀 Guia Rápido React Native

### 1. Criar serviço API (`src/services/api.ts`)
```typescript
import axios from 'axios';

const BASE_URL = 'https://jwgjrdyhoqygwbdnywji.supabase.co/functions/v1/barbershop-api';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z2pyZHlob3F5Z3diZG55d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzkyNTksImV4cCI6MjA4NjMxNTI1OX0.UmWofcvzoM0zKxB2ghtYuZjXIpDJUlMHz8q_G41Z9Z0';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export default api;
```

### 2. Exemplos de uso
```typescript
// Login
const { data } = await api.post('/auth/login', { email, password });
setToken(data.access_token);

// Listar assinaturas
const { data: subs } = await api.get('/subscriptions');

// Criar assinatura
await api.post('/subscriptions', {
  client_name: 'Carlos',
  client_phone: '11999999999',
  barber_id: 'uuid',
});

// Resumo financeiro (inclui assinaturas)
const { data: finance } = await api.get('/financial/summary', {
  params: { date_from: '2026-03-01', date_to: '2026-03-31' }
});
```

---

## 📊 Hierarquia de Acesso (RBAC)

| Recurso | Owner | Barber |
|---------|-------|--------|
| Ver todos agendamentos | ✅ | ❌ (só os seus) |
| Criar/editar agendamentos | ✅ | ✅ (só os seus) |
| Deletar agendamentos | ✅ | ❌ |
| Assinaturas (ver todas) | ✅ | ❌ (só as suas) |
| Assinaturas (gerenciar) | ✅ | ❌ |
| Financeiro completo | ✅ | ❌ (só seu faturamento) |
| Despesas (CRUD) | ✅ | ❌ |
| Gestão barbeiros/serviços | ✅ | ❌ |
| Upload de fotos | ✅ | ❌ |
| Criar login barbeiro | ✅ | ❌ |
| Push tokens | ✅ | ✅ (só os seus) |

---

## ⚠️ Códigos de Erro

| Status | Significado |
|--------|-------------|
| 400 | Campos obrigatórios faltando |
| 401 | Não autenticado / token inválido |
| 403 | Sem permissão (role insuficiente) |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

Todos os erros retornam: `{ "error": "mensagem descritiva" }`
