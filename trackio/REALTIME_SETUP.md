# Enable Real-Time Sync (one-time setup)

Run this SQL in your Supabase project → SQL Editor to enable
real-time push for the trackio_store table:

```sql
-- Enable Realtime publication for the trackio_store table
alter publication supabase_realtime add table trackio_store;
```

That's it. Once done, all open tabs and devices will instantly
receive updates whenever anyone saves data to the system.

You only need to run this once per Supabase project.
