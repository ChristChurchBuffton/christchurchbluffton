-- Photos categorization — lets the Photos admin page filter by category
-- (All / CCB Brand / Youth Newsletter / CCB Newsletter) per Kevin's request.

alter table public.photos
  add column category text not null default 'CCB Newsletter'
  check (category in ('CCB Brand', 'Youth Newsletter', 'CCB Newsletter'));
