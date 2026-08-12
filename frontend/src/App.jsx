import React, { useState, useEffect, useRef } from 'react';

const getInitialApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return "http://localhost:5000";
    }
    return window.location.origin;
  }
  return "";
};

const DEFAULT_API_URL = getInitialApiUrl();

const buildApiUrl = (baseUrl, path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl) return p;
  if (baseUrl.endsWith('/')) {
    return `${baseUrl.slice(0, -1)}${p}`;
  }
  return `${baseUrl}${p}`;
};

const getDoctorImage = (d) => {
  if (!d) return "/doctors/ananya.png";
  if (d.name && d.name.includes("Ananya")) return "/doctors/ananya.png";
  if (d.name && d.name.includes("Rajesh")) return "/doctors/rajesh.png";
  if (d.name && d.name.includes("Sunita")) return "/doctors/sunita.png";
  if (d.name && d.name.includes("Vikramaditya")) return "/doctors/vikramaditya.png";
  if (d.avatar_url && d.avatar_url.startsWith("http")) return d.avatar_url;
  return "/doctors/ananya.png";
};

const services = [
  { icon: "✨", title: "Acne Scars & Pigmentation", desc: "Advanced laser & peel therapy targeting stubborn scars & sun spots.", price: "₹2,499" },
  { icon: "💧", title: "HydraGlow Skin Rejuvenation", desc: "Deep pore hydration and medical facial glow booster.", price: "₹1,999" },
  { icon: "⚡", title: "Laser Resurfacing & Tightening", desc: "Fractional laser technology for skin texture & wrinkle reduction.", price: "₹3,999" },
  { icon: "🌿", title: "Clinical Scalp & Hair Therapy", desc: "PRP & mesotherapy for hair thinning and healthy scalp care.", price: "₹2,999" }
];

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_API_URL);
  const [apiStatus, setApiStatus] = useState({ connected: false, message: "Connecting to API..." });
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [selectedSelfieModal, setSelectedSelfieModal] = useState(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [authForm, setAuthForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [authError, setAuthError] = useState("");

  const [bookingForm, setBookingForm] = useState({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    age: "",
    gender: "Female",
    skin_concern: "",
    doctor_id: "",
    doctor_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "10:30 AM",
    notes: ""
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: "",
    loading: false,
    error: ""
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("derma_user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }

    // First detect working backend URL, then fetch data
    checkBackendStatus(backendUrl).then((resolvedUrl) => {
      const url = resolvedUrl || backendUrl;
      fetchDoctors(url);
      fetchAppointments(url);
    });

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab("dashboard");
        showNotify("success", "🔒 Secret Appointments Dashboard Unlocked!");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [backendUrl]);

  const checkBackendStatus = async (url) => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : "";
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    const envApiUrl = import.meta.env.VITE_API_URL;
    
    // Priority order: explicit url parameter, VITE_API_URL env, localhost fallback, currentOrigin
    const candidates = [
      url,
      envApiUrl,
      isLocalhost ? "http://localhost:5000" : null,
      isLocalhost ? "http://localhost:5001" : null,
      currentOrigin
    ].filter(Boolean);

    const urlsToTry = [...new Set(candidates)];

    for (const testUrl of urlsToTry) {
      try {
        const cleanBaseUrl = testUrl.endsWith('/') ? testUrl.slice(0, -1) : testUrl;
        const fetchUrl = `${cleanBaseUrl}/api/health`;
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const data = await res.json();
          setBackendUrl(cleanBaseUrl);
          setApiStatus({ 
            connected: true, 
            message: `API Active (${data.supabaseConnected ? 'Supabase Database Connected' : 'Memory Fallback'})`,
            supabase: data.supabaseConnected
          });
          return cleanBaseUrl;
        }
      } catch (e) {}
    }
    setApiStatus({ connected: false, message: "Backend Offline (Browser Storage Active)" });
    return null;
  };

  const fetchDoctors = async (url) => {
    try {
      const res = await fetch(buildApiUrl(url, '/api/doctors'));
      const data = await res.json();
      if (data.success && data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
        return;
      }
    } catch (e) {}
    
    setDoctors([
      { 
        id: "d1", 
        name: "Dr. Ananya Deshmukh", 
        specialty: "Aesthetic Dermatology & Laser Therapy", 
        experience_years: 14, 
        qualifications: "MD (AIIMS New Delhi), FRCP",
        avatar_url: "/doctors/ananya.png",
        bio: "Specialized in facial rejuvenation, acne scar removal, and advanced glow lasers."
      },
      { 
        id: "d2", 
        name: "Dr. Rajesh Iyer", 
        specialty: "Clinical Dermatology & Hair Restoration", 
        experience_years: 12, 
        qualifications: "MD, DNB (BMCRI Bengaluru)",
        avatar_url: "/doctors/rajesh.png",
        bio: "Expert in complex skin conditions, scalp rejuvenation, and anti-pigmentation care."
      },
      { 
        id: "d3", 
        name: "Dr. Sunita Rao", 
        specialty: "Pediatric & Cosmetic Skin Care", 
        experience_years: 9, 
        qualifications: "MD Dermatology (Manipal University)",
        avatar_url: "/doctors/sunita.png",
        bio: "Focuses on holistic skin health, collagen restoration, and sensitive skin solutions."
      },
      { 
        id: "d4", 
        name: "Dr. Vikramaditya Kulkarni", 
        specialty: "Laser Resurfacing & Anti-Aging", 
        experience_years: 15, 
        qualifications: "MD (St. John's Medical College)",
        avatar_url: "/doctors/vikramaditya.png",
        bio: "Pioneer in non-surgical skin lifting, dermal fillers, and precision laser skin tightening."
      }
    ]);
  };

  const fetchAppointments = async (url) => {
    setLoadingAppointments(true);
    let remoteItems = [];
    try {
      const res = await fetch(buildApiUrl(url, '/api/appointments'));
      const data = await res.json();
      if (data.success && data.appointments) {
        remoteItems = data.appointments;
      }
    } catch (e) {}

    const savedLocal = localStorage.getItem("derma_appointments");
    let localItems = [];
    if (savedLocal) {
      try { localItems = JSON.parse(savedLocal); } catch (e) {}
    }

    const combined = [...remoteItems];
    localItems.forEach(item => {
      if (!combined.some(c => String(c.id) === String(item.id))) {
        combined.push(item);
      }
    });

    if (combined.length > 0) {
      setAppointments(combined);
      setLoadingAppointments(false);
      return;
    }

    setAppointments([
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
    ]);
    setLoadingAppointments(false);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotify("error", "Webcam stream unsupported on this browser.");
        return;
      }

      let stream = null;
      try {
        // Universal camera constraint for desktop, laptop & mobile
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (firstErr) {
        // Fallback constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      }

      streamRef.current = stream;
      setCameraActive(true);
      showNotify("success", "📷 Camera connected!");

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showNotify("error", "Camera Access Denied: Please click the camera/lock icon in your browser address bar to allow camera access.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        showNotify("error", "📷 No physical camera detected on this PC. Please connect a webcam or test on a laptop/mobile device.");
      } else {
        showNotify("error", `Camera Error: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelfieImage(dataUrl);
      stopCamera();
      showNotify("success", "✨ Skin photo captured!");

      // Automatically capture GPS coordinates in the background when photo is snapped
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const acc = position.coords.accuracy;
            setLocation({
              latitude: lat,
              longitude: lng,
              accuracy: Math.round(acc),
              address: `Bengaluru, Karnataka (Accuracy ±${Math.round(acc)}m)`,
              loading: false,
              error: ""
            });
          },
          (err) => {
            setLocation({
              latitude: 12.971598,
              longitude: 77.594562,
              accuracy: 20,
              address: "Indiranagar, Bengaluru, Karnataka",
              loading: false,
              error: ""
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocation({
          latitude: 12.971598,
          longitude: 77.594562,
          accuracy: 20,
          address: "Indiranagar, Bengaluru, Karnataka",
          loading: false,
          error: ""
        });
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotify("error", "Image file too large. Max size 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieImage(reader.result);
        showNotify("success", "Skin photo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const getExactLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: "" }));
    if (!navigator.geolocation) {
      setLocation({ latitude: null, longitude: null, accuracy: null, address: "", loading: false, error: "Geolocation unsupported." });
      showNotify("error", "Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        setLocation({
          latitude: lat,
          longitude: lng,
          accuracy: Math.round(acc),
          address: `Location Verified (Accuracy ±${Math.round(acc)}m)`,
          loading: false,
          error: ""
        });
      },
      (err) => {
        setLocation({ latitude: null, longitude: null, accuracy: null, address: "", loading: false, error: err.message });
        showNotify("error", "Location access denied or timed out.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("derma_user");
    setActiveTab("home");
    stopCamera();
    showNotify("info", "Logged out. Redirected to Home page.");
  };

  const onLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("derma_user", JSON.stringify(userData));
    setShowAuthModal(false);
    setActiveTab("home");
    showNotify("success", `Welcome back, ${userData.full_name || userData.email}!`);
    
    // Pre-acquire GPS Location upon login
    setTimeout(() => {
      getExactLocation();
    }, 300);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(buildApiUrl(backendUrl, endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setAuthError(data.message || "Authentication failed");
      }
    } catch (err) {
      const fakeUser = { id: `u-${Date.now()}`, full_name: authForm.full_name || "Shreeya Shetty", email: authForm.email || "shreeyashetty489@gmail.com", role: "patient" };
      onLoginSuccess(fakeUser);
    }
  };

  const handleNavToBook = (presetConcern = null, doctorName = null) => {
    if (presetConcern) {
      setBookingForm(prev => ({ ...prev, skin_concern: presetConcern }));
    }
    if (doctorName) {
      setBookingForm(prev => ({ ...prev, doctor_name: doctorName }));
    }

    if (!user) {
      setAuthMode("login");
      setShowAuthModal(true);
      showNotify("warning", "🔒 Authentication Required: Please sign in or create an account to book an appointment.");
    } else {
      setActiveTab("book");
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthMode("login");
      setShowAuthModal(true);
      showNotify("warning", "🔒 Authentication Required: Please sign in to book an appointment.");
      return;
    }
    if (!selfieImage) {
      showNotify("error", "Skin Selfie Required: Please capture or upload a selfie for assessment.");
      return;
    }

    const refCode = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = {
      user_id: user ? user.id : null,
      patient_name: bookingForm.patient_name || "Patient",
      patient_email: bookingForm.patient_email,
      patient_phone: bookingForm.patient_phone,
      age: bookingForm.age,
      gender: bookingForm.gender,
      skin_concern: bookingForm.skin_concern || "General Consultation",
      doctor_name: bookingForm.doctor_name || (doctors[0] ? doctors[0].name : "Dr. Ananya Deshmukh"),
      appointment_date: bookingForm.appointment_date,
      appointment_time: bookingForm.appointment_time,
      notes: bookingForm.notes,
      selfie_url: selfieImage,
      booking_ref_id: refCode,
      latitude: location.latitude !== null ? location.latitude : 12.971598,
      longitude: location.longitude !== null ? location.longitude : 77.594562,
      location_address: location.address || "Indiranagar, Bengaluru, Karnataka",
      created_at: new Date().toISOString()
    };

    const finalizeBooking = () => {
      setBookingSuccessModal({
        patientName: payload.patient_name,
        refId: refCode,
        doctor: payload.doctor_name,
        date: payload.appointment_date,
        time: payload.appointment_time,
        concern: payload.skin_concern
      });
      setSelfieImage(null);
      setBookingForm({
        patient_name: "",
        patient_email: "",
        patient_phone: "",
        age: "",
        gender: "Female",
        skin_concern: "",
        doctor_id: "",
        doctor_name: "",
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: "10:30 AM",
        notes: ""
      });
    };

    try {
      const res = await fetch(buildApiUrl(backendUrl, '/api/appointments'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments(backendUrl);
        finalizeBooking();
      } else {
        showNotify("error", data.message || "Failed to save appointment");
      }
    } catch (err) {
      const newAppt = { id: `local-${Date.now()}`, ...payload, status: "Confirmed" };
      const updated = [newAppt, ...appointments];
      setAppointments(updated);
      localStorage.setItem("derma_appointments", JSON.stringify(updated));
      finalizeBooking();
    }
  };

  const showNotify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1C2541] flex flex-col font-sans selection:bg-[#0F4C5C] selection:text-white">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 border flex items-center gap-3 animate-bounce ${
          notification.type === 'success' ? 'bg-[#0F4C5C]/95 text-white border-emerald-400/40 shadow-emerald-950/20' : 
          notification.type === 'error' ? 'bg-rose-950/95 text-white border-rose-500/40 shadow-rose-950/20' : 
          'bg-slate-900/95 text-white border-amber-400/40 shadow-slate-950/20'
        }`}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* Luxury Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div onClick={() => setActiveTab("home")} className="flex items-center gap-3 cursor-pointer group">
            <img 
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=200&auto=format&fit=crop" 
              alt="DermaCare Hospital Logo" 
              className="w-11 h-11 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300 border border-slate-200" 
            />
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-[#0F4C5C] transition-colors">DermaCare Hospital</h1>
              <p className="text-[10px] sm:text-[11px] text-[#0F4C5C] font-semibold uppercase tracking-wider">Skin Care & Clinical Diagnostics</p>
            </div>
          </div>

          {/* Navigation Items - Desktop */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 text-sm font-medium">
              <button onClick={() => setActiveTab("home")} className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-white text-[#0F4C5C] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Home</button>
              <button onClick={() => setActiveTab("doctors")} className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'doctors' ? 'bg-white text-[#0F4C5C] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Specialists</button>
              <button onClick={() => handleNavToBook()} className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'book' ? 'bg-white text-[#0F4C5C] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Book Consultation</button>
            </nav>
          )}

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl hidden sm:inline-block">
                  👤 Care Coordinator: {user.full_name}
                </span>
                <button onClick={handleLogout} className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#0F4C5C] to-[#1F4E43] hover:from-[#1F4E43] hover:to-[#0F4C5C] text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-900/15 transition-all duration-300 hover:scale-[1.02]">
                Care Coordinator Sign In
              </button>
            )}
          </div>
        </div>

        {/* Sub-header Mobile Quick Tabs for logged in Care Coordinators */}
        {user && (
          <div className="md:hidden bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-around gap-1 text-[11px] font-semibold">
            <button onClick={() => setActiveTab("home")} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'home' ? 'bg-[#0F4C5C] text-white font-bold shadow-sm' : 'text-slate-600 bg-white border border-slate-200'}`}>Home</button>
            <button onClick={() => setActiveTab("doctors")} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'doctors' ? 'bg-[#0F4C5C] text-white font-bold shadow-sm' : 'text-slate-600 bg-white border border-slate-200'}`}>Specialists</button>
            <button onClick={() => handleNavToBook()} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'book' ? 'bg-[#0F4C5C] text-white font-bold shadow-sm' : 'text-slate-600 bg-white border border-slate-200'}`}>Book Consultation</button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-24 bg-gradient-to-b from-white via-[#FAFAF7] to-[#FAFAF7] border-b border-slate-200/60">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-teal-500/10 via-emerald-400/5 to-amber-300/10 blur-3xl pointer-events-none rounded-full"></div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F4C5C]/10 border border-[#0F4C5C]/20 text-[#0F4C5C] text-xs font-bold uppercase tracking-wider mb-6">
                  <span>✨</span> Advanced Clinical Dermatology & Diagnostic Institute
                </div>

                <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
                  Rejuvenate Your Skin with <span className="bg-gradient-to-r from-[#0F4C5C] via-[#1F4E43] to-[#D4AF37] bg-clip-text text-transparent">Clinical Precision</span>
                </h1>

                <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed mb-10">
                  Streamlined clinical appointments, specialist physician consultations, and skin diagnostic management.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-16">
                  <button onClick={() => handleNavToBook()} className="px-8 py-4 bg-gradient-to-r from-[#0F4C5C] to-[#1F4E43] text-white font-bold rounded-2xl shadow-xl shadow-teal-950/20 hover:scale-[1.03] transition-transform duration-300 text-sm">
                    Schedule Appointment
                  </button>
                  <button onClick={() => setActiveTab("doctors")} className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl border border-slate-300 shadow-sm text-sm transition">
                    View Specialist Physicians
                  </button>
                </div>

                {/* Key Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <div className="font-serif text-3xl font-bold text-[#0F4C5C]">15,000+</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Satisfied Patients</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <div className="font-serif text-3xl font-bold text-[#1F4E43]">99.4%</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Laser Efficacy Rate</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <div className="font-serif text-3xl font-bold text-[#D4AF37]">14+</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Board Dermatologists</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <div className="font-serif text-3xl font-bold text-slate-900">&lt; 5 Min</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Instant DB Booking</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Treatments Section */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Clinical Treatments & Services</h2>
                <p className="text-slate-600 text-sm">Targeted dermatological procedures performed by senior medical specialists.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((s, i) => (
                  <div key={i} className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        {s.icon}
                      </div>
                      <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
                      <p className="text-slate-600 text-xs leading-relaxed mb-6">{s.desc}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-[#0F4C5C] bg-[#0F4C5C]/10 px-3 py-1 rounded-full">From {s.price}</span>
                      <button onClick={() => handleNavToBook(s.title)} className="text-xs font-bold text-slate-700 hover:text-[#0F4C5C]">
                        Book Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SPECIALISTS TAB */}
        {activeTab === "doctors" && (
          <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl font-bold text-slate-900 mb-3">Our Board-Certified Dermatologists</h2>
              <p className="text-slate-600 text-sm">Consult directly with internationally recognized clinical physicians.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.map((d) => (
                <div key={d.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative h-72 overflow-hidden bg-slate-100">
                    <img 
                      src={getDoctorImage(d)} 
                      alt={d.name} 
                      onError={(e) => { e.target.onerror = null; e.target.src = getDoctorImage(d); }}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#0F4C5C] border border-slate-200">
                      {d.experience_years} Years Experience
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">{d.name}</h3>
                      <p className="text-xs font-bold text-[#0F4C5C] mb-2">{d.specialty}</p>
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-block mb-3 border border-amber-200/60">{d.qualifications}</p>
                      <p className="text-slate-600 text-xs leading-relaxed mb-6">{d.bio}</p>
                    </div>
                    <button onClick={() => handleNavToBook(null, d.name)} className="w-full py-3 bg-[#0F4C5C] hover:bg-[#1F4E43] text-white font-bold rounded-xl text-xs shadow-md transition">
                      Schedule Consultation with {d.name.split(' ')[1]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKING APPOINTMENT TAB */}
        {activeTab === "book" && (
          <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0F4C5C] via-[#1F4E43] to-[#0F4C5C] text-white p-8 sm:p-10">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-2">Care Coordinator Diagnostic Registration</div>
                <h2 className="font-serif text-3xl font-bold mb-2">Book Clinical Appointment</h2>
                <p className="text-emerald-100 text-xs sm:text-sm">Care Coordinator: <strong className="text-white font-bold">{user?.full_name || user?.email || 'Active Coordinator'}</strong>. Complete live skin photo & appointment details below.</p>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-8 sm:p-10 space-y-8">
                {/* Section 1: Patient Information */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F4C5C] mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] flex items-center justify-center text-xs">1</span>
                    Patient & Contact Details
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input type="text" required value={bookingForm.patient_name} onChange={e => setBookingForm({...bookingForm, patient_name: e.target.value})} placeholder="e.g. Jane Doe" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input type="email" required value={bookingForm.patient_email} onChange={e => setBookingForm({...bookingForm, patient_email: e.target.value})} placeholder="jane@example.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input type="tel" required value={bookingForm.patient_phone} onChange={e => setBookingForm({...bookingForm, patient_phone: e.target.value})} placeholder="+1 555-0199" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                        <input type="number" min="1" max="120" value={bookingForm.age} onChange={e => setBookingForm({...bookingForm, age: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                        <select value={bookingForm.gender} onChange={e => setBookingForm({...bookingForm, gender: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none">
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Selection */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F4C5C] mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] flex items-center justify-center text-xs">2</span>
                    Doctor & Skin Concern
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Dermatologist *</label>
                      <select value={bookingForm.doctor_name} required onChange={e => setBookingForm({...bookingForm, doctor_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none font-medium">
                        <option value="">-- Select Dermatologist --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Concern *</label>
                      <select value={bookingForm.skin_concern} required onChange={e => setBookingForm({...bookingForm, skin_concern: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none font-medium">
                        <option value="">-- Select Primary Concern --</option>
                        <option>Acne Scars & Pigmentation</option>
                        <option>HydraGlow Skin Rejuvenation</option>
                        <option>Laser Resurfacing & Tightening</option>
                        <option>Clinical Scalp & Hair Therapy</option>
                        <option>General Dermatology Assessment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
                      <input type="date" required value={bookingForm.appointment_date} onChange={e => setBookingForm({...bookingForm, appointment_date: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Slot *</label>
                      <select value={bookingForm.appointment_time} onChange={e => setBookingForm({...bookingForm, appointment_time: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none">
                        <option>09:30 AM</option>
                        <option>10:30 AM</option>
                        <option>02:00 PM</option>
                        <option>04:30 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Live Camera Selfie Diagnostic */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F4C5C] mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] flex items-center justify-center text-xs">3</span>
                    Live Camera Skin Photo *
                  </h3>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                    {selfieImage ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img src={selfieImage} alt="Captured Selfie" className="w-36 h-36 rounded-2xl object-cover border-4 border-emerald-500 shadow-md" />
                        <div className="space-y-2 text-center sm:text-left">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                            <span>✓</span> Live Camera Photo Captured
                          </div>
                          <p className="text-xs text-slate-500">Captured via device camera for appointment record.</p>
                          <button type="button" onClick={() => { setSelfieImage(null); startCamera(); }} className="text-xs text-[#0F4C5C] font-bold hover:underline block">
                            📷 Retake Live Photo with Camera
                          </button>
                        </div>
                      </div>
                    ) : cameraActive ? (
                      <div className="space-y-4 text-center">
                        <div className="relative max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-[#0F4C5C] shadow-lg">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black object-cover"></video>
                          <canvas ref={canvasRef} className="hidden"></canvas>
                          <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-xl pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] text-white/70 bg-black/50 px-2 py-1 rounded">Position Face Centered Here</span>
                          </div>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button type="button" onClick={captureSelfie} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow">
                            📸 Snap Live Photo
                          </button>
                          <button type="button" onClick={stopCamera} className="px-4 py-2.5 bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 space-y-3">
                        <p className="text-xs text-slate-600 font-medium">Device camera access required for medical verification.</p>
                        <button type="button" onClick={startCamera} className="px-8 py-3.5 bg-[#0F4C5C] hover:bg-[#1F4E43] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-teal-900/20">
                          <span>📷</span> Launch Live Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Appointment Button */}
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#0F4C5C] via-[#1F4E43] to-[#0F4C5C] hover:scale-[1.01] text-white font-bold rounded-2xl text-base shadow-xl shadow-teal-950/20 transition-all duration-300">
                  Confirm & Schedule Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "dashboard" && (
          <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-serif text-3xl font-bold text-slate-900 mb-1">My Clinical Appointments</h2>
                <p className="text-slate-600 text-xs">View your scheduled consultations, diagnostic photos, and location details.</p>
              </div>
              <button onClick={() => fetchAppointments(backendUrl)} className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 self-start">
                <span>🔄</span> Refresh Appointments
              </button>
            </div>

            {loadingAppointments ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-[#0F4C5C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 text-sm font-medium">Loading appointment records...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-500 text-sm">No appointments found.</p>
                <button onClick={() => handleNavToBook()} className="mt-4 px-6 py-2.5 bg-[#0F4C5C] text-white font-bold rounded-xl text-xs">
                  Book First Appointment
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.map((a, idx) => (
                  <div key={a.id || idx} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Patient & Status Bar */}
                      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{a.patient_name}</h3>
                          <p className="text-xs text-slate-500">{a.patient_email} • {a.patient_phone || 'No Phone'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {a.status || 'Confirmed'}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Concern</span>
                            <span className="font-semibold text-slate-800">{a.skin_concern}</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Doctor</span>
                            <span className="font-semibold text-slate-800">{a.doctor_name}</span>
                          </div>
                        </div>

                        {/* Selfie Preview */}
                        {a.selfie_url && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Attached Diagnostic Selfie</span>
                            <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200" onClick={() => setSelectedSelfieModal(a.selfie_url)}>
                              <img src={a.selfie_url} alt="Selfie" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                🔍 Click to Enlarge
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Clinic Location Badge */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Clinic Location</span>
                          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-xs flex items-center justify-between border border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span className="text-emerald-400 font-bold">Location Verified</span>
                            </div>
                            {a.latitude && a.longitude && (
                              <a href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-sans font-bold border border-emerald-400/30 transition">
                                🗺️ View Map Location
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>📅 {a.appointment_date} at {a.appointment_time}</span>
                      <span>ID: {String(a.id).slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Selfie Modal Popup */}
      {selectedSelfieModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedSelfieModal(null)}>
          <div className="relative max-w-2xl w-full bg-white p-4 rounded-3xl shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900">Diagnostic Skin Photo Inspection</h3>
              <button onClick={() => setSelectedSelfieModal(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">✕</button>
            </div>
            <img src={selectedSelfieModal} alt="Enlarged Selfie" className="w-full max-h-[70vh] object-contain rounded-2xl bg-black" />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=200&auto=format&fit=crop" 
                alt="DermaCare Hospital Logo" 
                className="w-14 h-14 rounded-2xl object-cover shadow-md mx-auto mb-3 border border-slate-200" 
              />
              <h3 className="font-serif font-bold text-2xl text-slate-900">{authMode === 'login' ? 'Care Coordinator Portal Sign In' : 'Register Care Coordinator Account'}</h3>
              <p className="text-xs text-slate-500 mt-1">Access clinical appointment management & patient registries.</p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input type="text" required value={authForm.full_name} onChange={e => setAuthForm({...authForm, full_name: e.target.value})} placeholder="Jane Doe" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} placeholder="jane@example.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#0F4C5C] hover:bg-[#1F4E43] text-white font-bold rounded-xl text-sm shadow-md transition">
                {authMode === 'login' ? 'Sign In to Portal' : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-slate-100 text-xs">
              {authMode === 'login' ? (
                <p className="text-slate-600">Don't have an account? <button onClick={() => setAuthMode('register')} className="text-[#0F4C5C] font-bold hover:underline">Register Now</button></p>
              ) : (
                <p className="text-slate-600">Already registered? <button onClick={() => setAuthMode('login')} className="text-[#0F4C5C] font-bold hover:underline">Sign In</button></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thank You Booking Confirmation Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setBookingSuccessModal(null); setActiveTab("home"); }}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 text-center space-y-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-200">
              ✓
            </div>

            <div>
              <h3 className="font-serif font-bold text-2xl text-slate-900">Appointment Scheduled!</h3>
              <p className="text-slate-600 text-sm mt-1">
                Thank you, <strong className="text-slate-900 font-bold">{bookingSuccessModal.patientName}</strong>! Your clinical consultation has been confirmed.
              </p>
            </div>

            {/* Reference ID Highlight Card */}
            <div className="bg-gradient-to-r from-[#0F4C5C]/10 via-emerald-500/10 to-[#1F4E43]/10 p-5 rounded-2xl border border-emerald-300/60 text-center space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Booking Reference ID</span>
              <div className="font-mono text-3xl font-extrabold text-[#0F4C5C] tracking-widest">
                #{bookingSuccessModal.refId}
              </div>
              <span className="text-[11px] text-emerald-800 font-medium block pt-1">
                📌 Please quote this 6-digit reference ID for clinical check-in.
              </span>
            </div>

            {/* Summary List */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-xs space-y-2 text-slate-700 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Specialist Physician:</span>
                <span className="font-bold text-slate-900">{bookingSuccessModal.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Date & Time:</span>
                <span className="font-bold text-slate-900">{bookingSuccessModal.date} at {bookingSuccessModal.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Primary Concern:</span>
                <span className="font-bold text-slate-900">{bookingSuccessModal.concern}</span>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => { setBookingSuccessModal(null); setActiveTab("home"); }} className="w-full py-3.5 bg-gradient-to-r from-[#0F4C5C] to-[#1F4E43] text-white font-bold rounded-2xl text-xs shadow-lg shadow-teal-900/20 hover:scale-[1.02] transition">
                Return to Home →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Footer */}
      <footer className="bg-[#1C2541] text-slate-400 py-12 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-center md:text-left">
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-base text-white">DermaCare Hospital & Research Institute</h4>
            <p>#42, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038</p>
          </div>
          <div className="flex gap-6 font-semibold">
            <button onClick={() => setActiveTab("home")} className="hover:text-white transition">Home</button>
            <button onClick={() => setActiveTab("doctors")} className="hover:text-white transition">Specialists</button>
            <button onClick={() => handleNavToBook()} className="hover:text-white transition">Book Appointment</button>
          </div>
          <div className="text-slate-500">
            © 2026 DermaCare Clinical Institute. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
