-- Seed initial brands for the directory
-- Mix of big names, mid-tier, and niche brands as recommended

INSERT INTO public.brands (name, industry, description, verified, budget_min, budget_max, avg_payment_time_days, source, status)
VALUES
    -- Big name brands (prestige)
    ('Nike', 'Sports & Fitness', 'Global sports brand looking for fitness creators', true, 50000, 500000, 28, 'manual', 'active'),
    ('Adidas', 'Sports & Fitness', 'Seeking creators for product launch campaigns', true, 100000, 1000000, 35, 'manual', 'active'),
    
    -- Mid-tier / E-commerce / D2C brands
    ('Mamaearth', 'Beauty & Skincare', 'Natural beauty brand for skincare reviews', true, 10000, 50000, 25, 'manual', 'active'),
    ('boAt', 'Electronics', 'Audio and lifestyle products for tech creators', true, 20000, 150000, 30, 'manual', 'active'),
    ('Zepto', 'E-commerce', 'Quick commerce platform seeking content creators', true, 5000, 50000, 20, 'manual', 'active'),
    
    -- Niche / Small brands
    ('SkillShare', 'Education', 'Online learning platform for creators', false, 15000, 75000, 40, 'manual', 'active'),
    ('Fashion Nova', 'Fashion', 'Fast fashion brand seeking style influencers', false, 25000, 100000, 45, 'manual', 'active'),
    ('TechGear', 'Electronics', 'Tech accessories and gadgets', false, 10000, 50000, 30, 'manual', 'active')
ON CONFLICT (name) DO NOTHING;

-- Note: This will fail if brands already exist with these names
-- Adjust names or use ON CONFLICT DO UPDATE if you want to update existing brands

