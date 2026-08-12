const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend hosting (Vercel, Localhost, custom domain)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '25mb' })); // Support base64 selfie images up to 25MB
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "https://egyjmcvnydxjidnneqax.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_AIYtG43UURSWlHbHY6eAZA_SjP4AVEi";

let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected successfully.');
} else {
  console.log('⚠️ Running in Local/Demo fallback mode. Set SUPABASE_URL and SUPABASE_KEY in environment variables.');
}

// In-Memory storage fallback for testing before DB connection
const memoryUsers = [
  {
    id: 'u-1',
    full_name: 'Shreeya Shetty',
    email: 'shreeyashetty489@gmail.com',
    password_hash: 'Leo@0489',
    phone: '+91 98860 12345',
    role: 'patient'
  }
];
const memoryAppointments = [
  {
    id: "demo-appt-1",
    patient_name: "Ananya Rao",
    patient_email: "ananya.rao@example.com",
    patient_phone: "+91 98860 12345",
    age: 28,
    gender: "Female",
    skin_concern: "Acne Scarring & Glow Therapy",
    doctor_name: "Dr. Elena Rostova",
    appointment_date: "2026-08-20",
    appointment_time: "10:30 AM",
    notes: "Requesting gentle hydration laser treatment",
    selfie_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    latitude: 12.971598,
    longitude: 77.594562,
    location_address: "Indiranagar, Bengaluru, Karnataka, India",
    status: "Confirmed",
    created_at: new Date().toISOString()
  }
];

// Health Check Endpoint (Render monitor)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Skin Care Hospital Backend API',
    supabaseConnected: !!supabase,
    timestamp: new Date().toISOString()
  });
});

// GET /api/doctors - Fetch doctor profiles
app.get('/api/doctors', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) throw error;
      return res.json({ success: true, doctors: data });
    }
    
    // Fallback static list
    return res.json({
      success: true,
      doctors: [
        { id: "d1", name: "Dr. Ananya Deshmukh", specialty: "Aesthetic Dermatology & Laser Therapy", experience_years: 14, qualifications: "MD (AIIMS New Delhi), FRCP", avatar_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=400&auto=format&fit=crop", bio: "Specialized in facial rejuvenation, acne scar removal, and advanced glow lasers." },
        { id: "d2", name: "Dr. Rajesh Iyer", specialty: "Clinical Dermatology & Hair Restoration", experience_years: 12, qualifications: "MD, DNB (BMCRI Bengaluru)", avatar_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop", bio: "Expert in complex skin conditions, scalp rejuvenation, and anti-pigmentation care." },
        { id: "d3", name: "Dr. Sunita Rao", specialty: "Pediatric & Cosmetic Skin Care", experience_years: 9, qualifications: "MD Dermatology (Manipal University)", avatar_url: "https://images.unsplash.com/photo-1594824813572-c2c62c2f6d2f?q=80&w=400&auto=format&fit=crop", bio: "Focuses on holistic skin health, collagen restoration, and sensitive skin solutions." },
        { id: "d4", name: "Dr. Vikramaditya Kulkarni", specialty: "Laser Resurfacing & Anti-Aging", experience_years: 15, qualifications: "MD (St. John's Medical College)", avatar_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&auto=format&fit=crop", bio: "Pioneer in non-surgical skin lifting, dermal fillers, and precision laser skin tightening." }
      ]
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register - Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    if (supabase) {
      // Register in Supabase users table
      const { data, error } = await supabase
        .from('users')
        .insert([{ full_name, email, password_hash: password, phone }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        throw error;
      }
      return res.json({ success: true, user: { id: data.id, full_name: data.full_name, email: data.email, role: data.role } });
    }

    // Fallback Memory Auth
    const existing = memoryUsers.find(u => u.email === email);
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const newUser = { id: `user-${Date.now()}`, full_name, email, password_hash: password, phone, role: 'patient' };
    memoryUsers.push(newUser);
    return res.json({ success: true, user: { id: newUser.id, full_name: newUser.full_name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login - User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data || data.password_hash !== password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      return res.json({
        success: true,
        user: { id: data.id, full_name: data.full_name, email: data.email, role: data.role, phone: data.phone }
      });
    }

    // Fallback Memory Auth
    const user = memoryUsers.find(u => u.email === email && u.password_hash === password);
    if (!user) {
      // Demo convenience fallback
      if (email === "demo@skincare.com" && password === "demo123") {
        return res.json({
          success: true,
          user: { id: "user-demo-99", full_name: "Demo Patient", email: "demo@skincare.com", role: "patient", phone: "+1 555-0199" }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.json({ success: true, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/appointments - Book Appointment with Selfie + Lat/Long Location
app.post('/api/appointments', async (req, res) => {
  try {
    const {
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
      notes,
      selfie_url,
      latitude,
      longitude,
      location_address
    } = req.body;

    // Validation
    if (!patient_name || !patient_email || !skin_concern || !appointment_date || !appointment_time) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }
    if (!selfie_url) {
      return res.status(400).json({ success: false, message: 'Selfie picture is required for dermatology consultation.' });
    }
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: 'Exact GPS location (Latitude & Longitude) is required.' });
    }

    const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const newAppointment = {
      user_id: isValidUUID(user_id) ? user_id : null,
      patient_name,
      patient_email,
      patient_phone: patient_phone || 'N/A',
      age: parseInt(age) || 25,
      gender: gender || 'Not Specified',
      skin_concern,
      doctor_id: isValidUUID(doctor_id) ? doctor_id : null,
      doctor_name: doctor_name || 'Assigned Dermatologist',
      appointment_date,
      appointment_time,
      notes: notes || '',
      selfie_url,
      booking_ref_id: req.body.booking_ref_id || Math.floor(100000 + Math.random() * 900000).toString(),
      latitude: parseFloat(latitude) || 12.971598,
      longitude: parseFloat(longitude) || 77.594562,
      location_address: location_address || `Indiranagar, Bengaluru, Karnataka`,
      status: 'Confirmed',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert([newAppointment])
        .select()
        .single();

      if (error) {
        console.error('Supabase appointment insert error:', error);
        throw error;
      }
      return res.status(201).json({ success: true, message: 'Appointment booked successfully in Supabase!', appointment: data });
    }

    // Fallback Memory push
    newAppointment.id = `appt-${Date.now()}`;
    memoryAppointments.unshift(newAppointment);
    return res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment: newAppointment });

  } catch (err) {
    console.error('Appointment booking error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments - Fetch all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, appointments: data });
    }

    return res.json({ success: true, appointments: memoryAppointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start express server
const server = app.listen(PORT, () => {
  console.log(`🚀 Skin Care Hospital API running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n⚠️ Port ${PORT} is currently in use by another process.`);
    console.log(`💡 Freeing up port ${PORT} or switching to http://localhost:${Number(PORT) + 1}...\n`);
    const ALT_PORT = Number(PORT) + 1;
    app.listen(ALT_PORT, () => {
      console.log(`🚀 Skin Care Hospital API running on http://localhost:${ALT_PORT}`);
      console.log(`📡 Health Check: http://localhost:${ALT_PORT}/api/health`);
    });
  } else {
    console.error('Server startup error:', err);
  }
});

module.exports = app;

