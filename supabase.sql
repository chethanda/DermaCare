-- ========================================================
-- DERMACARE CLINICAL HOSPITAL - COMPLETE SUPABASE RESET SCRIPT
-- ========================================================

-- 1. DROP EXISTING TABLES (CLEAN RESET)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE USERS TABLE
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'Care Coordinator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE DOCTORS TABLE
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255),
    experience_years INT DEFAULT 5,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE APPOINTMENTS TABLE
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(20),
    skin_concern VARCHAR(255) NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    notes TEXT,
    selfie_url TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
    booking_ref_id VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ENABLE ROW LEVEL SECURITY & PUBLIC POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public all doctors" ON public.doctors FOR ALL USING (true);
CREATE POLICY "Allow public all appointments" ON public.appointments FOR ALL USING (true);

-- 7. INSERT INITIAL CARE COORDINATOR USER ACCOUNT
INSERT INTO public.users (id, full_name, email, password_hash, phone, role)
VALUES 
('88ceab09-a4cd-4447-8f7b-f4f28714eb58', 'Shreeya Shetty', 'shreeyashetty489@gmail.com', 'Leo@0489', '+91 98860 12345', 'Care Coordinator')
ON CONFLICT (id) DO NOTHING;

-- 8. INSERT INDIAN DERMATOLOGY DOCTORS
INSERT INTO public.doctors (id, name, specialty, qualifications, experience_years, avatar_url, bio)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Dr. Ananya Deshmukh', 'Aesthetic Dermatology & Laser Therapy', 'MD (AIIMS New Delhi), FRCP', 14, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop', 'Specialized in facial rejuvenation, acne scar removal, and advanced glow lasers.'),
('22222222-2222-2222-2222-222222222222', 'Dr. Rajesh Iyer', 'Clinical Dermatology & Hair Restoration', 'MD, DNB (BMCRI Bengaluru)', 12, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop', 'Expert in complex skin conditions, scalp rejuvenation, and anti-pigmentation care.'),
('33333333-3333-3333-3333-333333333333', 'Dr. Sunita Rao', 'Pediatric & Cosmetic Skin Care', 'MD Dermatology (Manipal University)', 9, 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=400&auto=format&fit=crop', 'Focuses on holistic skin health, collagen restoration, and sensitive skin solutions.'),
('44444444-4444-4444-4444-444444444444', 'Dr. Vikramaditya Kulkarni', 'Laser Resurfacing & Anti-Aging', 'MD (St. John''s Medical College)', 15, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop', 'Pioneer in non-surgical skin lifting, dermal fillers, and precision laser skin tightening.')
ON CONFLICT (id) DO NOTHING;

-- 9. INSERT INITIAL TEST APPOINTMENT
INSERT INTO public.appointments (
  user_id,
  patient_name,
  patient_email,
  patient_phone,
  age,
  gender,
  skin_concern,
  doctor_id,
  doctor_name,
  appointment_date,
  appointment_time,
  selfie_url,
  latitude,
  longitude,
  location_address,
  booking_ref_id,
  status
) VALUES (
  '88ceab09-a4cd-4447-8f7b-f4f28714eb58',
  'Shreeya Shetty',
  'shreeyashetty489@gmail.com',
  '+91 98860 12345',
  28,
  'Female',
  'Acne Scars & Pigmentation',
  '11111111-1111-1111-1111-111111111111',
  'Dr. Ananya Deshmukh',
  '2026-08-15',
  '10:30 AM',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
  12.971598,
  77.594562,
  'Indiranagar, Bengaluru, Karnataka',
  '849204',
  'Confirmed'
);
