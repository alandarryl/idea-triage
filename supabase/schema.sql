create table ideas (
  id                text primary key,            -- ex. IDEA-001
  submitted_at      date not null,
  first_name        text not null,
  last_name         text not null,
  direction         text not null,
  site              text,                        -- vide possible (IDEA-040)
  theme             text,                        -- vide possible (IDEA-015, 029)
  title             text not null,
  description       text not null,
  expected_benefits text,                        -- vide possible (IDEA-019)
  budget_raw        text,                        -- texte d'origine, ex. '15k€'
  budget_eur        integer,                     -- null = inconnu, 0 = budget nul
  import_warnings   text[] not null default '{}',
  shortlisted       boolean not null default false,
  created_at        timestamptz not null default now()
);

create table scores (
  idea_id       text primary key references ideas(id) on delete cascade,
  impact        smallint check (impact between 1 and 5),
  feasibility   smallint check (feasibility between 1 and 5),
  strategic_fit smallint check (strategic_fit between 1 and 5),
  innovation    smallint check (innovation between 1 and 5),
  justification text,
  source        text not null check (source in ('ai', 'manual')),
  updated_at    timestamptz not null default now()
);

create table duplicate_pairs (
  id         bigint generated always as identity primary key,
  idea_a     text not null references ideas(id) on delete cascade,
  idea_b     text not null references ideas(id) on delete cascade,
  similarity numeric(4,3) not null check (similarity between 0 and 1),
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'dismissed')),
  check (idea_a < idea_b),                       -- évite (A,B) et (B,A)
  unique (idea_a, idea_b)
);

-- Sécurité : RLS activée sans règle = aucun accès avec la clé publique.
alter table ideas           enable row level security;
alter table scores          enable row level security;
alter table duplicate_pairs enable row level security;