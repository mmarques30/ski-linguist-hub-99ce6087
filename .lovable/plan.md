

# Notifications dynamiques dans le TopHeader

## Contexte
Le badge "3" est hardcode dans `TopHeader.tsx` (ligne 58). Il faut le remplacer par un systeme connecte a la base de donnees.

## 1. Migration SQL

### Table `notifications`
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'inscription',
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (is_admin());

-- Enable realtime for live badge updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

## 2. Hook `src/hooks/useNotifications.ts`

- `useUnreadCount()` : query `notifications` where `user_id = auth.uid()` and `is_read = false`, return count. Subscribe to realtime changes for live updates.
- `useRecentNotifications()` : fetch 10 most recent notifications for current user, ordered by `created_at DESC`.
- `useMarkAsRead(id)` : mutation to set `is_read = true` on a single notification.
- `useMarkAllAsRead()` : mutation to mark all unread as read.

## 3. Modifier `src/components/layout/TopHeader.tsx`

- Import `Popover` / `PopoverTrigger` / `PopoverContent` from `@/components/ui/popover`
- Replace the hardcoded `<button>` with a `Popover` wrapping the bell icon
- Badge shows `unreadCount` from `useUnreadCount()` ; hidden when 0
- Popover content: list of 10 recent notifications with icon by type, title, relative time
- Click on a notification: call `markAsRead(id)`, then `navigate(link)`
- "Tout marquer comme lu" button at the bottom

## 4. Fichiers

| Action | Fichier |
|--------|---------|
| Creer | `src/hooks/useNotifications.ts` |
| Modifier | `src/components/layout/TopHeader.tsx` |
| Migration | Table `notifications` + RLS + realtime |

## Resume
- 1 migration (table + RLS + realtime)
- 1 nouveau hook
- 1 fichier modifie (TopHeader)
- Badge dynamique avec realtime, dropdown au clic, marquage lu avec redirection

