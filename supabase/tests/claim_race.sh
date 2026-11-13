#!/usr/bin/env bash
# claim_race.sh — deterministic double-claim test for claim_order.
#
# Session A claims T-RACE and holds the row lock while "thinking" (pg_sleep).
# Session B fires mid-hold: its UPDATE blocks on the lock until A commits,
# then READ COMMITTED re-evaluation gives 0 rows → 'already_taken'.
# Exactly one winner, every run.
#
# Usage: SUPABASE_DB_URL="postgresql://postgres:PASS@db.REF.supabase.co:5432/postgres" \
#          bash supabase/tests/claim_race.sh
set -euo pipefail
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL first}"

DRV1='d0000000-0000-4000-8000-000000000001'
DRV2='d0000000-0000-4000-8000-000000000002'
STORE='e0000000-0000-4000-8000-000000000001'
CUST='c0000000-0000-4000-8000-000000000001'

as_driver() { # $1 = driver uuid, $2 = sql
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -Atc \
    "set role authenticated;
     select set_config('request.jwt.claims',
       jsonb_build_object('sub','$1','role','authenticated')::text, true);
     $2"
}

echo '== fixture: ready unassigned order T-RACE'
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -Atc \
  "insert into public.orders (id, customer_id, store_id, status, placed_at, timeline)
   values ('T-RACE','$CUST','$STORE','ready',extract(epoch from now())::bigint*1000,'[]')
   on conflict (id) do update set status='ready', driver_id=null, driver_name=null;"

echo '== A claims and holds the row lock for 4s'
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -Atc \
  "begin;
   set local role authenticated;
   select set_config('request.jwt.claims',
     jsonb_build_object('sub','$DRV1','role','authenticated')::text, true);
   select public.claim_order('T-RACE') ->> 'ok' as a_claim;
   select pg_sleep(4);
   commit;" &
A=$!
sleep 1   # guarantee A holds the lock before B fires

echo '== B claims while A holds the lock'
B_RESULT=$(as_driver "$DRV2" "select public.claim_order('T-RACE');")
wait $A

echo "B result: $B_RESULT"
if echo "$B_RESULT" | grep -q 'already_taken'; then
  echo 'PASS: loser got already_taken — exactly one winner'
else
  echo 'FAIL: expected already_taken'
  exit 1
fi

echo '== cleanup'
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -Atc "delete from public.orders where id='T-RACE';"
