-- =============================================================================
-- Vedette — schema v1.2: make roi_models reproducible
-- =============================================================================
-- Purely additive: three nullable columns, no drops, no type changes, no data
-- movement. Safe to run against a populated database.
--
-- Why this is needed
-- ------------------
-- The ROI calculator (`src/lib/roi/model.ts`) computes savings from eight
-- inputs. `roi_models` as designed in v1.1 stores five of them — hours, people,
-- loaded rate, adoption, ramp — and the three computed outputs.
--
-- The missing three are automation potential and the two cost inputs. Without
-- them a stored `annual_savings_usd` cannot be recomputed from the row that
-- claims to explain it: you can read the number but not check it. That quietly
-- breaks the product's central promise at the persistence layer, where it is
-- least visible — the UI would still show an inspectable model while the
-- database held an unfalsifiable figure.
--
-- v1.1 sized this table against an earlier, simpler ROI shape (hours x rate x
-- adoption). The calculator grew an automation-potential term and separate
-- build/run costs once real opportunities were scored, because an intervention
-- almost never removes 100% of the hours it touches and the costs decide
-- payback. This migration catches the table up.
-- =============================================================================

alter table public.roi_models
  -- Fraction of the touched hours the intervention actually removes, 0-1.
  -- Distinct from adoption_pct: adoption is how many people use it, automation
  -- potential is how much of the work it removes for those who do.
  add column if not exists automation_potential numeric,

  -- One-time build and rollout cost. An input the engagement supplies, not a
  -- benefit the model claims — see the note in src/lib/roi/types.ts.
  add column if not exists implementation_cost_usd numeric,

  -- Recurring annual cost to operate: licences, infrastructure, maintenance.
  add column if not exists annual_run_cost_usd numeric;

comment on column public.roi_models.automation_potential is
  'Fraction (0-1) of touched hours removed by the intervention. With adoption_pct, hours, people and rate, this makes annual_savings_usd reproducible.';
comment on column public.roi_models.implementation_cost_usd is
  'One-time build/rollout cost. An input, never a claimed benefit.';
comment on column public.roi_models.annual_run_cost_usd is
  'Recurring annual operating cost. Subtracted from gross savings.';
