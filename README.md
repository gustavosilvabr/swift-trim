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
Retorna horários disponíveis para agendamento. Horários passados, ocupados e bloqueados são filtrados automaticamente.

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

**Response (201):**
```json
{ "appointment": { "id": "uuid", "status": "pendente", ... } }
```

---

## 🔐 Autenticação

### `POST /auth/login`
**Body:**
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

---

### `POST /auth/refresh`
**Body:**
```json
{ "refresh_token": "abc..." }
```

**Response:**
```json
{ "access_token": "new_token", "refresh_token": "new_refresh", "expires_at": 1234567890 }
```

---

### `GET /auth/me` 🔒
Retorna dados do usuário logado.

**Response:**
```json
{ "user": { "id": "uuid", "email": "...", "role": "owner", "barber_id": "uuid|null" } }
```

---

### `POST /auth/update-password` 🔒
**Body:**
```json
{ "password": "novaSenha123" }
```

---

## 📅 Agendamentos (Autenticado) 🔒

### `GET /appointments`
Lista agendamentos. Barbeiro vê apenas os seus; Owner vê todos.

| Param | Descrição |
|-------|-----------|
| `date` | Filtrar por data exata (YYYY-MM-DD) |
| `date_from` | Data início |
| `date_to` | Data fim |
| `status` | `pendente`, `confirmado`, `concluido`, `cancelado` |

**Response:**
```json
{
  "appointments": [
    { "id": "uuid", "client_name": "Carlos", "appointment_date": "2026-03-15", "appointment_time": "10:00:00", "status": "pendente", "barbers": { "name": "João", "photo_url": "..." }, ... }
  ]
}
```

---

### `GET /appointments/:id` 🔒
Retorna um agendamento específico.

---

### `PATCH /appointments/:id` 🔒
Atualiza agendamento.

**Body (campos opcionais):**
```json
{
  "status": "confirmado",
  "service_type": "corte + barba",
  "total_amount": 55,
  "payment_method": "pix",
  "observation": "Cliente VIP",
  "products_sold": "Pomada"
}
```

---

### `DELETE /appointments/:id` 🔒 (Owner only)
Exclui agendamento.

---

## 📱 Push Notifications 🔒

### `POST /push-tokens`
Registra token de push notification (Expo Push Token).

**Body:**
```json
{
  "token": "ExponentPushToken[xxxxxx]",
  "device_info": "iPhone 15 Pro"
}
```

**Response (201):**
```json
{ "push_token": { "id": "uuid", "token": "...", "user_id": "..." } }
```

---

### `DELETE /push-tokens` 🔒
Remove token de push (logout/desinstalar).

**Body:**
```json
{ "token": "ExponentPushToken[xxxxxx]" }
```

---

### 🔔 Quando as notificações são enviadas?
- Automaticamente ao criar um novo agendamento (público ou autenticado)
- Enviadas para: o barbeiro específico + todos os owners
- Usa a API do **Expo Push Notifications** (compatível com React Native/Expo)

### Configuração no React Native (Expo):
```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function registerForPushNotifications(accessToken: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;

  // Registrar token na API
  await fetch('BASE_URL/push-tokens', {
    method: 'POST',
    headers: {
      'apikey': 'SUA_ANON_KEY',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, device_info: Constants.deviceName }),
  });
}
```

---

## 💰 Financeiro 🔒

### `GET /financial/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
Resumo financeiro. Barbeiro vê apenas seu faturamento; Owner vê tudo + despesas.

**Response:**
```json
{
  "period": { "from": "2026-03-01", "to": "2026-03-31" },
  "total_revenue": 3500,
  "total_expenses": 800,
  "profit": 2700,
  "total_appointments": 100,
  "per_barber": [
    { "barber_id": "uuid", "name": "João", "revenue": 2000, "count": 57 }
  ]
}
```

---

### `GET /financial/expenses?date_from=&date_to=` 🔒 (Owner only)
Lista despesas.

---

### `POST /financial/expenses` 🔒 (Owner only)
**Body:**
```json
{ "category": "aluguel", "description": "Aluguel março", "amount": 2000, "expense_date": "2026-03-01" }
```

---

### `DELETE /financial/expenses/:id` 🔒 (Owner only)

---

## 📤 Upload de Fotos 🔒 (Owner only)

### `POST /upload?bucket=barber-photos&file_name=foto.jpg`

Faz upload de imagem para o storage.

| Param | Descrição | Valores |
|-------|-----------|---------|
| `bucket` | Bucket de destino | `barber-photos`, `gallery`, `site-assets` |
| `file_name` | Nome do arquivo | Ex: `foto.jpg` |

**Headers:**
```
Content-Type: image/jpeg (ou image/png, etc.)
Authorization: Bearer <token>
apikey: <anon_key>
```

**Body:** Raw binary data da imagem.

**Response (201):**
```json
{ "url": "https://...supabase.co/storage/v1/object/public/barber-photos/uuid.jpg", "path": "uuid.jpg", "bucket": "barber-photos" }
```

### Exemplo React Native:
```typescript
async function uploadPhoto(uri: string, accessToken: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const result = await fetch(
    'BASE_URL/upload?bucket=barber-photos&file_name=foto.jpg',
    {
      method: 'POST',
      headers: {
        'apikey': 'SUA_ANON_KEY',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    }
  );

  const data = await result.json();
  return data.url; // URL pública da foto
}
```

---

## 🛠️ Gestão (Owner only) 🔒

### Barbeiros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/barbers` | Lista todos os barbeiros + usuários vinculados |
| `POST` | `/manage/barbers` | Cria barbeiro `{ name, phone, photo_url?, specialty? }` |
| `PATCH` | `/manage/barbers/:id` | Atualiza barbeiro |
| `POST` | `/manage/barber-user` | Cria login para barbeiro `{ email, password, barber_id }` |
| `DELETE` | `/manage/barber-user/:user_id` | Remove login do barbeiro |

### Serviços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/services` | Lista todos (incluindo inativos) |
| `POST` | `/manage/services` | Cria serviço `{ name, price, category?, sort_order? }` |
| `PATCH` | `/manage/services/:id` | Atualiza serviço |
| `DELETE` | `/manage/services/:id` | Remove serviço |

### Horários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/manage/timeslots?barber_id=UUID` | Lista horários configurados |
| `POST` | `/manage/timeslots` | Cria horário `{ barber_id, day_of_week (0-6), slot_time }` |
| `DELETE` | `/manage/timeslots/:id` | Remove horário |

### Bloqueios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/manage/blocked-slots` | Bloqueia horário/dia `{ barber_id, blocked_date, blocked_time? }` |
| `DELETE` | `/manage/blocked-slots/:id` | Remove bloqueio |

---

## 🚀 Guia Rápido React Native

### 1. Instalar dependências
```bash
npx create-expo-app BarbeariaApp
cd BarbeariaApp
npx expo install expo-notifications expo-constants
npm install @react-navigation/native @react-navigation/native-stack axios
```

### 2. Criar serviço API (`src/services/api.ts`)
```typescript
import axios from 'axios';

const BASE_URL = 'https://jwgjrdyhoqygwbdnywji.supabase.co/functions/v1/barbershop-api';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z2pyZHlob3F5Z3diZG55d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzkyNTksImV4cCI6MjA4NjMxNTI1OX0.UmWofcvzoM0zKxB2ghtYuZjXIpDJUlMHz8q_G41Z9Z0';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
});

// Interceptor para adicionar token
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;
```

### 3. Exemplo de Login
```typescript
import api, { setToken } from './api';

async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  setToken(data.access_token);
  // Salvar refresh_token no AsyncStorage
  return data.user;
}
```

### 4. Exemplo de Listagem
```typescript
// Listar agendamentos do dia
const { data } = await api.get('/appointments', { params: { date: '2026-03-15' } });
console.log(data.appointments);

// Resumo financeiro do mês
const { data } = await api.get('/financial/summary', {
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
| Financeiro completo | ✅ | ❌ (só seu faturamento) |
| Despesas | ✅ | ❌ |
| Gestão barbeiros/serviços | ✅ | ❌ |
| Upload de fotos | ✅ | ❌ |
| Criar login barbeiro | ✅ | ❌ |

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
