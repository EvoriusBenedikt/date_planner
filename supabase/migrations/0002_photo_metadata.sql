-- Add optional EXIF/location metadata columns to date_photos for location & time achievements
alter table public.date_photos
  add column if not exists taken_at timestamptz,
  add column if not exists taken_hour smallint check (taken_hour between 0 and 23),
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists city text,
  add column if not exists area text;
