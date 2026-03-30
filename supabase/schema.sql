create extension if not exists "uuid-ossp";

-- Markets
create table markets (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  barangay text,
  address text,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Product categories
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text
);

-- Vendor profiles
create table vendors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  market_id uuid references markets(id),
  business_name text not null,
  owner_name text,
  stall_number text,
  contact_number text,
  is_approved boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Shared product catalog
create table products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories(id),
  name text not null,
  unit text not null,
  image_url text,
  description text
);

-- Active price listings per vendor
create table price_listings (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  product_id uuid references products(id),
  market_id uuid references markets(id),
  price decimal(10,2) not null,
  is_available boolean default true,
  stock_quantity integer default 0,
  last_updated timestamptz default now()
);

-- Price change history for trend charts
create table price_history (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references price_listings(id) on delete cascade,
  price decimal(10,2),
  recorded_at timestamptz default now()
);

-- Buyer inquiries to vendors
create table inquiries (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id),
  listing_id uuid references price_listings(id),
  buyer_name text not null,
  buyer_contact text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Auto-log price history on update
create or replace function log_price_change()
returns trigger as $$
begin
  if OLD.price <> NEW.price then
    insert into price_history (listing_id, price)
    values (NEW.id, NEW.price);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_price_update
  after update on price_listings
  for each row execute procedure log_price_change();

-- RLS POLICIES --

-- Enable RLS
alter table markets enable row level security;
alter table vendors enable row level security;
alter table products enable row level security;
alter table price_listings enable row level security;
alter table inquiries enable row level security;
alter table categories enable row level security;

-- Public can read everything active
create policy "Public read markets"
  on markets for select using (is_active = true);

create policy "Public read products"
  on products for select using (true);

-- Allow authenticated vendors to extend catalog (needed for "Add New Product")
create policy "Authenticated insert products"
  on products for insert with check (auth.uid() is not null);

create policy "Authenticated update products"
  on products for update using (auth.uid() is not null);

create policy "Public read categories"
  on categories for select using (true);

-- Vendors manage only their own profile
create policy "Vendors can see own profile"
  on vendors for select using (auth.uid() = user_id);

create policy "Vendors can update own profile"
  on vendors for update using (auth.uid() = user_id);

create policy "Public read approved vendors"
  on vendors for select using (is_approved = true);

-- Vendors manage only their own listings
create policy "Vendor can insert own listings"
  on price_listings for insert with check (
    vendor_id = (
      select id from vendors where user_id = auth.uid()
    )
  );

create policy "Vendor manages own listings"
  on price_listings for select using (
    vendor_id = (
      select id from vendors where user_id = auth.uid()
    )
  );

create policy "Vendor updates own listings"
  on price_listings for update using (
    vendor_id = (
      select id from vendors where user_id = auth.uid()
    )
  );

create policy "Vendor deletes own listings"
  on price_listings for delete using (
    vendor_id = (
      select id from vendors where user_id = auth.uid()
    )
  );

create policy "Public read available listings"
  on price_listings for select using (is_available = true);

-- Inquiries
create policy "Vendor reads own inquiries"
  on inquiries for select using (
    vendor_id = (
      select id from vendors where user_id = auth.uid()
    )
  );

-- All users can insert inquiries
create policy "Public insert inquiries"
  on inquiries for insert with check (true);
