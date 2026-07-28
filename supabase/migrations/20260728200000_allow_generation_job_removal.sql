-- Queue history is user-owned. Only terminal jobs may be removed so active work
-- cannot disappear without going through the cancellation path.
create policy "Users can remove their terminal generation jobs" on public.generation_jobs
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('succeeded', 'failed', 'cancelled')
  );

grant delete on public.generation_jobs to authenticated;
