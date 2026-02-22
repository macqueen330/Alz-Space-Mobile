# Alz Space Admin Panel — Functional Logic & Specification

> **Purpose**: This document describes the business logic, data model, and functional requirements for the Alz Space Admin Panel. It is written for AI agents and developers to implement or extend the admin panel without ambiguity.

---

## 1. Context

- **Parent App**: Alz Space Mobile — a React Native/Expo app for Alzheimer's care coordination.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime). Same database as mobile app.
- **Admin Panel**: Separate web application that connects to the same Supabase instance.
- **Admin Role**: Distinct from app roles (CAREGIVER, PATIENT, FAMILY_MEMBER). Admins must be identified via `profiles.role = 'ADMIN'` or a dedicated admin table with RLS.

---

## 2. Database Schema (Supabase Tables)

All entities below map 1:1 to Supabase tables. Use `src/types/database.types.ts` for TypeScript types.

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (id, email, phone, name, avatar_url, role, uid, created_at, updated_at) |
| `family_members` | Family group members (user_id, name, phone, role, relation, age, gender, condition, invitation_status, linked_profile_id) |
| `family_invitations` | Invitations (inviter_id, invitee_identifier, invited_role, status, expires_at) |
| `patient_ai_settings` | AI persona config per patient (voice_gender, ai_bio, preferred_topics, common_questions, chat_style) |
| `assets` | Media library (user_id, title, duration, type, subtype, category, quiz_data) |
| `tasks` | Scheduled tasks (user_id, patient_profile_id, title, start_time, end_time, repeat, is_completed, automation_enabled) |
| `task_assets` | Links tasks to assets (task_id, asset_id, type, title, duration) |
| `posts` | Community posts (author_id, title, content, image_url, type, tags, likes_count, views_count) |
| `post_likes` | Post likes (post_id, user_id) |
| `chat_messages` | Chat history (user_id, message, sender: 'user'|'ai') |

**Relationships**:
- `profiles.id` → referenced by `family_members.user_id`, `assets.user_id`, `tasks.user_id`, `posts.author_id`, `chat_messages.user_id`
- `family_members.id` = `tasks.assigned_to` (patient profile in family)
- `family_members.linked_profile_id` → `profiles.id` when invitation accepted
- `patient_ai_settings.patient_profile_id` → `family_members.id` (patient)
- `tasks.patient_profile_id` → `family_members.id`
- `posts.attached_task` → `tasks.id`

---

## 3. Admin Panel Functional Modules

### 3.1 Users & Roles

**Purpose**: View and manage app users and their roles.

**Data source**: `profiles`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List users | Paginated table of all users | SELECT with filters (role, date range, search by name/email) |
| View user | Full profile + related data | SELECT profile, family_members, asset count, task count |
| Edit role | Change user role | UPDATE profiles SET role = ? WHERE id = ? |
| Search | Find by name, email, phone | LIKE/ilike on name, email, phone |
| Export | CSV of filtered users | Same query, export as CSV |

**Filters**:
- Role: CAREGIVER | PATIENT | FAMILY_MEMBER
- Date range: created_at
- Search: name, email, phone (partial match)

**Display columns**: id, name, email, phone, role, created_at, updated_at

**Business rules**:
- Admins cannot demote themselves.
- Role change must be one of: CAREGIVER, PATIENT, FAMILY_MEMBER (or ADMIN if supported).

---

### 3.2 Family Networks

**Purpose**: View family groups, members, and invitation status.

**Data sources**: `family_members`, `family_invitations`, `profiles`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List families | Group by user_id (family owner) | SELECT family_members, JOIN profiles for owner |
| View family | Members + invitations | SELECT family_members WHERE user_id = ?, SELECT family_invitations WHERE inviter_id = ? |
| View invitation | Single invitation details | SELECT family_invitations, JOIN inviter profile |
| Resend invitation | Resend invite (if pending) | Logic: create new invitation or extend expires_at (implementation depends on app design) |

**Key fields to display**:
- **Family**: owner (profile), member count, pending invitations count
- **Member**: name, phone, role, relation, age, gender, condition, invitation_status, linked_profile_id
- **Invitation**: invitee_identifier, invited_role, status, created_at, expires_at

**Filters**:
- Invitation status: pending | accepted | declined | expired
- Role: CAREGIVER | PATIENT | FAMILY_MEMBER
- Family owner: search by name/email

**Business rules**:
- `invitation_status`: none | pending | accepted | declined
- `family_invitations.status`: pending | accepted | declined | expired
- Expired invitations: expires_at < now()

---

### 3.3 Content Management — Assets

**Purpose**: Manage the asset library (games, quizzes, media).

**Data source**: `assets`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List assets | Paginated table | SELECT with filters |
| View asset | Full metadata | SELECT single row |
| Edit asset | Update title, type, category, etc. | UPDATE assets SET ... WHERE id = ? |
| Delete asset | Remove asset | DELETE FROM assets WHERE id = ? |
| Bulk delete | Delete multiple by ids | DELETE FROM assets WHERE id IN (?) |

**Display columns**: id, title, type, subtype, category, duration, user_id (owner), created_at

**Filters**:
- Category: Cognitive Games, Cognitive Quizzes, Family Media, Interactive Media (from app)
- Type: varies by category
- Owner: user_id or owner name (JOIN profiles)
- Date range: created_at

**Business rules**:
- Deleting an asset may orphan `task_assets` rows. Handle: set asset_id NULL or prevent delete if in use (define policy).
- category is required; type is required.

---

### 3.4 Content Management — Community Posts

**Purpose**: Moderate community posts (stories, tips, questions, tasks).

**Data sources**: `posts`, `post_likes`, `profiles`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List posts | Paginated with author info | SELECT posts, JOIN profiles ON author_id |
| View post | Full content, images, likes, views | SELECT post, COUNT post_likes |
| Delete post | Remove post and likes | DELETE post_likes, DELETE post |
| Edit post | Update title, content, tags | UPDATE posts SET ... WHERE id = ? |
| Filter by type | Story, Question, Tip, Task | WHERE type = ? |

**Display columns**: id, title, type, author (name), likes_count, views_count, tags, created_at

**Filters**:
- Type: Story | Question | Tip | Task
- Author: author_id or name
- Date range
- Tags: array contains

**Business rules**:
- Deleting a post must DELETE from `post_likes` first (or use CASCADE).
- posts.type: 'Story' | 'Question' | 'Tip' | 'Task'
- attached_task: nullable task id if post references a task

---

### 3.5 Content Management — Tasks Overview

**Purpose**: View tasks across the system (read-heavy, optionally limited edit).

**Data sources**: `tasks`, `task_assets`, `family_members`, `profiles`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List tasks | Paginated, filterable | SELECT tasks, JOIN family_members, profiles |
| View task | Full task + task_assets | SELECT task, SELECT task_assets WHERE task_id = ? |
| Filter | By user, patient, date, completion | WHERE user_id, patient_profile_id, is_completed, start_time |

**Display columns**: id, title, user_id (owner), patient_profile_id (patient name), start_time, end_time, repeat, is_completed, automation_enabled, created_at

**Filters**:
- User (owner)
- Patient (patient_profile_id)
- Completion: is_completed true/false
- Date range: start_time
- Automation: automation_enabled true/false

**Business rules**:
- tasks.assigned_to = family_members.id (patient in family)
- tasks.patient_profile_id = family_members.id
- repeat: 'once' | 'daily' | 'weekly' | 'custom'; custom_days used when repeat = 'custom'

---

### 3.6 Patient Management — Profiles

**Purpose**: View patient metadata within family groups.

**Data source**: `family_members` (role = PATIENT), `profiles` (via linked_profile_id), `patient_ai_settings`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List patients | All family members with role PATIENT | SELECT family_members WHERE role = 'PATIENT' |
| View patient | Full patient info + AI settings | SELECT family_member, patient_ai_settings WHERE patient_profile_id = family_member.id |
| Edit patient | Update age, gender, condition, relation | UPDATE family_members SET ... WHERE id = ? |

**Display columns**: id, name, phone, relation, age, gender, condition, invitation_status, linked_profile_id, user_id (family owner), created_at

**Filters**:
- Family owner
- Condition (text)
- Invitation status

---

### 3.7 Patient Management — AI Settings

**Purpose**: View and optionally edit AI persona configuration for patients.

**Data source**: `patient_ai_settings`, `family_members`

**Capabilities**:

| Action | Description | Allowed Operations |
|--------|-------------|-------------------|
| List AI settings | All patient AI configs | SELECT patient_ai_settings, JOIN family_members |
| View AI settings | Full config | SELECT single row |
| Edit AI settings | Update voice, bio, topics, FAQs, style | UPDATE patient_ai_settings SET ... WHERE id = ? |

**Fields**:
- voice_gender: Male | Female
- ai_bio: string
- preferred_topics: string[]
- common_questions: { id, question, answer }[]
- chat_style: string | null
- patient_self_description: string | null

---

### 3.8 Community Moderation

**Purpose**: Moderate posts, handle reports (if report table exists), manage inappropriate content.

**Data sources**: `posts`, `post_likes`, `profiles`

**Capabilities** (overlap with 3.4):
- Same as Content Management — Posts
- Optional: If `post_reports` or similar table exists, add:
  - List reports
  - Resolve report (delete post, warn user, dismiss)
  - Ban user (would require new field or separate table)

**Note**: Current schema has no `post_reports`. Moderation = delete/edit posts.

---

### 3.9 Analytics & Reports

**Purpose**: Aggregate metrics for dashboards and exports.

**Data sources**: All relevant tables

**Metrics to compute**:

| Metric | Query / Logic |
|--------|---------------|
| Total users | COUNT(profiles) |
| Users by role | GROUP BY role |
| New users (last 7/30 days) | WHERE created_at >= ? |
| Total families | COUNT(DISTINCT user_id) FROM family_members |
| Pending invitations | COUNT(*) WHERE status = 'pending' |
| Total assets | COUNT(assets) |
| Assets by category | GROUP BY category |
| Total tasks | COUNT(tasks) |
| Tasks completed | COUNT WHERE is_completed = true |
| Completion rate | completed / total * 100 |
| Automation usage | COUNT WHERE automation_enabled = true |
| Total posts | COUNT(posts) |
| Posts by type | GROUP BY type |
| Total likes | SUM(posts.likes_count) or COUNT(post_likes) |
| Chat messages count | COUNT(chat_messages) |
| AI interactions | COUNT(chat_messages) WHERE sender = 'ai' |

**Visualization**:
- Time-series: registrations, tasks completed, posts created (group by day/week)
- Pie/bar: role distribution, post types, asset categories
- Tables: top users by activity, top posts by engagement

---

### 3.10 System Administration

**Purpose**: Manage invitations, system health, audit.

**Invitations** (`family_invitations`):
- List all with status filter
- Resend: create new row or update expires_at (depends on app)
- Mark expired: status = 'expired' where expires_at < now()
- Cancel: status = 'declined'

**Audit logs** (if implemented):
- New table: admin_audit_log (admin_id, action, entity, entity_id, changes, timestamp)
- Log: role changes, post deletes, asset deletes, etc.

**Notifications** (future):
- Push notification delivery status — requires additional tables if not present.

---

## 4. Permissions & Access Control

- **Who can access admin panel**: Only users with `profiles.role = 'ADMIN'` (or in admin_users table).
- **RLS**: Supabase RLS policies must allow admins to:
  - SELECT all rows from profiles, family_members, family_invitations, assets, tasks, task_assets, posts, post_likes, patient_ai_settings, chat_messages
  - UPDATE profiles (role), family_members, assets, posts, patient_ai_settings
  - DELETE assets, posts
- **Chat messages**: Read-only for support/quality; no edit. Consider privacy/compliance before exposing.

---

## 5. API / Data Access Patterns

All access via Supabase client:

```typescript
// Example: List users with filters
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'CAREGIVER')  // optional filter
  .ilike('name', `%${search}%`)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .range(offset, offset + pageSize - 1)
  .order('created_at', { ascending: false });
```

**Joins** (Supabase `.select` with foreign keys):
```typescript
.from('posts')
.select('*, profiles!author_id(name, email)')
```

**Aggregates**: Use Supabase RPC or client-side aggregation for complex metrics.

---

## 6. Summary Checklist for Implementation

| Module | Tables | Key Actions |
|--------|--------|-------------|
| Users & Roles | profiles | List, view, edit role, search, export |
| Family Networks | family_members, family_invitations, profiles | List families, view members, resend invite |
| Assets | assets | List, view, edit, delete, bulk delete |
| Posts | posts, post_likes | List, view, edit, delete |
| Tasks | tasks, task_assets | List, view, filter |
| Patients | family_members | List patients, view, edit |
| AI Settings | patient_ai_settings | List, view, edit |
| Analytics | all | Aggregate metrics, charts, export |
| System | family_invitations | List invitations, resend, expire |

---

## 7. File Reference

- **Database types**: `src/types/database.types.ts`
- **Mobile theme/colors**: `src/constants/colors.ts`, `src/constants/layout.ts`, `src/constants/theme.ts`
- **Services (for reference)**:
  - `src/services/taskService.ts`
  - `src/services/assetService.ts`
  - `src/services/postService.ts`
  - `src/services/familyService.ts`
  - `src/services/authService.ts`
