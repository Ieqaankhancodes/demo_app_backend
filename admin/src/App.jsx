import React, { useState, useEffect } from 'react';
import {
    Vote,
    ShieldCheck,
    Lock,
    User,
    KeyRound,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    RotateCcw,
    Server,
    LogOut,
    Eye,
    EyeOff,
    UserPlus,
    LogIn,
    Calendar,
    Users,
    Activity,
    ChevronRight,
    PieChart,
    Sparkles,
    Shield,
    Heart,
    Zap
} from 'lucide-react';

const LOCAL_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const DEFAULT_ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin';
const DEFAULT_ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'admin123';
const AUTH_STORAGE_KEY = 'VOTING_ADMIN_AUTHENTICATED';

// Official Party Definitions with Badges & Emblems
const PARTIES = [
    {
        id: 'partyA',
        name: 'Party A',
        fullName: 'National Progressive Party',
        symbol: '🦁',
        iconBg: 'from-amber-500 to-yellow-600',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        borderHover: 'hover:border-amber-500/50',
        colorText: 'text-amber-400',
        gradient: 'from-amber-600 to-yellow-500'
    },
    {
        id: 'partyB',
        name: 'Party B',
        fullName: 'United Democratic Front',
        symbol: '🦅',
        iconBg: 'from-blue-500 to-cyan-600',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        borderHover: 'hover:border-blue-500/50',
        colorText: 'text-blue-400',
        gradient: 'from-blue-600 to-cyan-500'
    },
    {
        id: 'partyC',
        name: 'Party C',
        fullName: "People's Alliance",
        symbol: '🌟',
        iconBg: 'from-purple-500 to-pink-600',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        borderHover: 'hover:border-purple-500/50',
        colorText: 'text-purple-400',
        gradient: 'from-purple-600 to-pink-500'
    },
    {
        id: 'partyD',
        name: 'Party D',
        fullName: 'Civic Reform Movement',
        symbol: '🛡️',
        iconBg: 'from-emerald-500 to-teal-600',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        borderHover: 'hover:border-emerald-500/50',
        colorText: 'text-emerald-400',
        gradient: 'from-emerald-600 to-teal-500'
    }
];

export default function App() {
    // Mode Selection: 'voter' | 'admin'
    const [activeTab, setActiveTab] = useState('voter');

    // --------------------------------------------------
    // VOTER PORTAL STATE
    // --------------------------------------------------
    const [voterStep, setVoterStep] = useState('login'); // 'login' | 'register' | 'voting' | 'alreadyVoted' | 'confirmation'
    const [voterName, setVoterName] = useState('');
    const [voterId, setVoterId] = useState('');
    const [voterDob, setVoterDob] = useState('');
    const [voterPassword, setVoterPassword] = useState('');
    const [currentVoter, setCurrentVoter] = useState(null);
    const [selectedParty, setSelectedParty] = useState('');
    const [voterError, setVoterError] = useState('');
    const [voterSuccess, setVoterSuccess] = useState('');
    const [isVoterSubmitting, setIsVoterSubmitting] = useState(false);

    // --------------------------------------------------
    // AUTHORIZED OFFICER / ADMIN DASHBOARD STATE
    // --------------------------------------------------
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
        return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    });
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [adminAuthError, setAdminAuthError] = useState('');
    const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

    // Live Tally & Demographics State
    const [votes, setVotes] = useState({
        partyA: 0,
        partyB: 0,
        partyC: 0,
        partyD: 0
    });
    const [demographics, setDemographics] = useState({
        youth: 0,
        millennials: 0,
        genX: 0,
        seniorCitizens: 0
    });
    const [votersList, setVotersList] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // SSE Real-Time Sync
    useEffect(() => {
        let eventSource;
        const connectSSE = () => {
            try {
                eventSource = new EventSource(`${LOCAL_BACKEND_URL}/api/stream`);
                eventSource.onopen = () => setIsConnected(true);
                eventSource.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        if (data.votes) {
                            setVotes({
                                partyA: data.votes.partyA || 0,
                                partyB: data.votes.partyB || 0,
                                partyC: data.votes.partyC || 0,
                                partyD: data.votes.partyD || 0
                            });
                        }
                        if (data.demographics) {
                            setDemographics(data.demographics);
                        }
                        setIsConnected(true);
                    } catch (err) {
                        console.error("Parse SSE error:", err);
                    }
                };
                eventSource.onerror = () => setIsConnected(false);
            } catch (err) {
                setIsConnected(false);
            }
        };

        connectSSE();
        return () => {
            if (eventSource) eventSource.close();
        };
    }, []);

    // Fetch Voters List for Admin
    const fetchVotersList = async () => {
        try {
            const res = await fetch(`${LOCAL_BACKEND_URL}/api/voters`);
            const data = await res.json();
            if (data.success && data.voters) {
                setVotersList(data.voters);
            }
        } catch (err) {
            console.error("Failed to fetch voters list:", err);
        }
    };

    useEffect(() => {
        if (isAdminAuthenticated && activeTab === 'admin') {
            fetchVotersList();
        }
    }, [isAdminAuthenticated, activeTab, votes]);

    // Quick Fill Demo Credentials
    const fillDemoCredentials = () => {
        setVoterName('Rahul Sharma');
        setVoterId('ABC01');
        setVoterDob('01012005');
        setVoterPassword('01012005');
    };

    // --------------------------------------------------
    // VOTER HANDLERS
    // --------------------------------------------------
    const handleRegisterVoter = async (e) => {
        e.preventDefault();
        setVoterError('');
        setVoterSuccess('');
        setIsVoterSubmitting(true);

        try {
            const res = await fetch(`${LOCAL_BACKEND_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: voterName,
                    voterId,
                    dob: voterDob,
                    password: voterPassword || voterDob
                })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Registration failed.');
            }

            setVoterSuccess(data.message || 'Account created successfully! Please login now.');
            setVoterStep('login');
        } catch (err) {
            setVoterError(err.message);
        } finally {
            setIsVoterSubmitting(false);
        }
    };

    const handleLoginVoter = async (e) => {
        e.preventDefault();
        setVoterError('');
        setVoterSuccess('');
        setIsVoterSubmitting(true);

        try {
            const res = await fetch(`${LOCAL_BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: voterName,
                    voterId,
                    dob: voterDob,
                    password: voterPassword || voterDob
                })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Identity verification failed.');
            }

            setCurrentVoter(data.voter);

            if (data.alreadyVoted || data.voter.hasVoted) {
                setVoterStep('alreadyVoted');
            } else {
                setVoterStep('voting');
            }
        } catch (err) {
            setVoterError(err.message);
        } finally {
            setIsVoterSubmitting(false);
        }
    };

    const handleCastVote = async () => {
        if (!selectedParty) {
            setVoterError('Please select a party before clicking CAST VOTE.');
            return;
        }

        setVoterError('');
        setIsVoterSubmitting(true);

        try {
            const res = await fetch(`${LOCAL_BACKEND_URL}/api/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voterId: currentVoter ? currentVoter.voterId : voterId,
                    party: selectedParty
                })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                if (data.alreadyVoted) {
                    setVoterStep('alreadyVoted');
                    return;
                }
                throw new Error(data.error || 'Failed to record vote.');
            }

            setVoterStep('confirmation');
        } catch (err) {
            setVoterError(err.message);
        } finally {
            setIsVoterSubmitting(false);
        }
    };

    const handleVoterLogout = () => {
        setCurrentVoter(null);
        setSelectedParty('');
        setVoterStep('login');
        setVoterError('');
        setVoterSuccess('');
    };

    // --------------------------------------------------
    // ADMIN HANDLERS
    // --------------------------------------------------
    const handleAdminLogin = (e) => {
        e.preventDefault();
        setAdminAuthError('');
        setIsAdminLoggingIn(true);

        setTimeout(() => {
            if (
                adminUsername.trim().toLowerCase() === DEFAULT_ADMIN_USER.toLowerCase() &&
                adminPassword === DEFAULT_ADMIN_PASS
            ) {
                sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
                setIsAdminAuthenticated(true);
                setAdminAuthError('');
            } else {
                setAdminAuthError('Invalid officer username or password.');
            }
            setIsAdminLoggingIn(false);
        }, 400);
    };

    const handleAdminLogout = () => {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        setIsAdminAuthenticated(false);
        setAdminUsername('');
        setAdminPassword('');
    };

    const handleResetVotes = async () => {
        setIsResetting(true);
        try {
            await fetch(`${LOCAL_BACKEND_URL}/api/reset`, { method: 'POST' });
            setIsResetting(false);
            setIsResetModalOpen(false);
            setResetSuccess(true);
            setTimeout(() => setResetSuccess(false), 4000);
            if (voterStep === 'alreadyVoted' || voterStep === 'confirmation') {
                setVoterStep('login');
            }
        } catch (err) {
            console.error("Reset error:", err);
            setIsResetting(false);
        }
    };

    // Calculations
    const totalVotes = votes.partyA + votes.partyB + votes.partyC + votes.partyD;

    const getPercent = (count) => {
        if (totalVotes === 0) return '0.0';
        return ((count / totalVotes) * 100).toFixed(1);
    };

    const totalDemoVotes = demographics.youth + demographics.millennials + demographics.genX + demographics.seniorCitizens;
    const getDemoPercent = (count) => {
        if (totalDemoVotes === 0) return '0.0';
        return ((count / totalDemoVotes) * 100).toFixed(1);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">

            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 shadow-lg shadow-blue-500/10">
                            <Vote className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                                E-VOTING SYSTEM
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold uppercase tracking-wider">
                                    Official Portal
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">National Secure Citizen Election Website</p>
                        </div>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('voter')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wider transition-all duration-200 flex items-center gap-2 ${activeTab === 'voter'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Vote className="w-3.5 h-3.5" />
                                <span>VOTER PORTAL</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wider transition-all duration-200 flex items-center gap-2 ${activeTab === 'admin'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>OFFICER DASHBOARD</span>
                            </button>
                        </div>

                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${isConnected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            <Server className="w-3.5 h-3.5" />
                            {isConnected ? 'Backend Sync Active' : 'Connecting...'}
                        </div>
                    </div>

                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ==================================================================== */}
                {/* 1. VOTER PORTAL SECTION                                              */}
                {/* ==================================================================== */}
                {activeTab === 'voter' && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">

                        {/* Step 1: Login / Registration Form */}
                        {(voterStep === 'login' || voterStep === 'register') && (
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-8">

                                <div className="text-center space-y-3">
                                    <div className="inline-flex p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 shadow-xl shadow-blue-600/10">
                                        {voterStep === 'login' ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        {voterStep === 'login' ? 'Voter Login Page' : 'Create Voter Account'}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                                        {voterStep === 'login'
                                            ? 'Enter your Voter ID and Date of Birth to verify eligibility and cast your vote.'
                                            : 'Register your details to create an account for voting.'}
                                    </p>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-extrabold tracking-wider">
                                    <button
                                        type="button"
                                        onClick={() => { setVoterStep('login'); setVoterError(''); }}
                                        className={`flex-1 py-2.5 rounded-xl transition-all ${voterStep === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        LOGIN
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setVoterStep('register'); setVoterError(''); }}
                                        className={`flex-1 py-2.5 rounded-xl transition-all ${voterStep === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        CREATE ACCOUNT
                                    </button>
                                </div>

                                {/* Quick Fill Demo Shortcut */}
                                <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-200">
                                    <div>
                                        <p className="font-extrabold text-blue-300 uppercase tracking-wider text-[10px]">💡 Quick Demo Voter Credentials:</p>
                                        <p className="mt-0.5"><span className="text-slate-300 font-semibold">Voter ID:</span> ABC01 &nbsp;|&nbsp; <span className="text-slate-300 font-semibold">DOB:</span> 01012005</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fillDemoCredentials}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                                    >
                                        Auto-Fill
                                    </button>
                                </div>

                                {voterError && (
                                    <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-shake">
                                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                                        <span>{voterError}</span>
                                    </div>
                                )}

                                {voterSuccess && (
                                    <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                                        <span>{voterSuccess}</span>
                                    </div>
                                )}

                                <form onSubmit={voterStep === 'login' ? handleLoginVoter : handleRegisterVoter} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-blue-400" />
                                            Name : ___
                                        </label>
                                        <input
                                            type="text"
                                            required={voterStep === 'register'}
                                            value={voterName}
                                            onChange={(e) => setVoterName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Vote className="w-3.5 h-3.5 text-blue-400" />
                                                Unique Voter ID
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">Format: ABC01</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={voterId}
                                            onChange={(e) => setVoterId(e.target.value)}
                                            placeholder="e.g. ABC01"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none font-mono uppercase tracking-wider transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                                Date of Birth (Password)
                                            </span>
                                            <span className="text-[10px] text-blue-400 font-mono font-bold">Format: DDMMYYYY</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={8}
                                            value={voterDob}
                                            onChange={(e) => setVoterDob(e.target.value)}
                                            placeholder="01012005"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none font-mono tracking-widest transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                                            Password (Optional / Same as DOB)
                                        </label>
                                        <input
                                            type="password"
                                            value={voterPassword}
                                            onChange={(e) => setVoterPassword(e.target.value)}
                                            placeholder="Enter password or leave blank for DOB"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isVoterSubmitting}
                                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-sm rounded-2xl tracking-wider shadow-lg shadow-blue-600/30 transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                                    >
                                        {isVoterSubmitting ? (
                                            <span>Verifying Identity...</span>
                                        ) : (
                                            <>
                                                <span>{voterStep === 'login' ? 'LOGIN & VERIFY CITIZEN' : 'CREATE ACCOUNT'}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-xs text-center text-slate-500 font-medium">
                                    The system will verify that the person is an eligible citizen/voter.
                                </p>
                            </div>
                        )}

                        {/* Step 2 & 5: Prevent Duplicate Voting */}
                        {voterStep === 'alreadyVoted' && (
                            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6 text-center animate-fade-in">
                                <div className="inline-flex p-4 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 shadow-xl shadow-amber-500/10">
                                    <AlertTriangle className="w-12 h-12" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-amber-400 tracking-tight">⚠️ Already Voted</h2>
                                    <p className="text-lg font-bold text-white">Your vote has already been recorded. You cannot vote again.</p>
                                    <p className="text-sm text-slate-400">
                                        “Vote already cast. You cannot vote again.”
                                    </p>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-2 font-mono">
                                    <p><span className="text-slate-500 uppercase">Voter ID:</span> {currentVoter ? currentVoter.voterId : voterId}</p>
                                    <p><span className="text-slate-500 uppercase">Voter Name:</span> {currentVoter ? currentVoter.name : voterName || 'Verified Citizen'}</p>
                                    <p><span className="text-slate-500 uppercase">Status:</span> <span className="text-amber-400 font-bold">VOTED (BALLOT RECORDED)</span></p>
                                </div>

                                <button
                                    onClick={handleVoterLogout}
                                    className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-2xl tracking-wider transition-all"
                                >
                                    RETURN TO VOTER LOGIN
                                </button>
                            </div>
                        )}

                        {/* Step 3: Voting Page (Party Logos & Emblems: Party A, B, C, D) */}
                        {voterStep === 'voting' && (
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 animate-fade-in">

                                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Select Your Party</h2>
                                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                            Welcome, <span className="text-blue-400 font-bold">{currentVoter ? currentVoter.name : 'Voter'}</span> ({currentVoter ? currentVoter.voterId : voterId})
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleVoterLogout}
                                        className="text-xs text-slate-400 hover:text-white underline font-semibold"
                                    >
                                        Logout
                                    </button>
                                </div>

                                {voterError && (
                                    <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                                        <span>{voterError}</span>
                                    </div>
                                )}

                                {/* Party Cards with Party Logos & Emblems */}
                                <div className="space-y-4">
                                    {PARTIES.map((party) => (
                                        <label
                                            key={party.id}
                                            onClick={() => setSelectedParty(party.id)}
                                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${selectedParty === party.id
                                                ? 'bg-blue-600/10 border-blue-500 shadow-xl'
                                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Party Emblem / Logo */}
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${party.iconBg} flex items-center justify-center text-2xl shadow-lg shrink-0 border border-white/20`}>
                                                    {party.symbol}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-black text-white">{party.name}</h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${party.badgeBg}`}>
                                                            ⭕ {party.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5">{party.fullName}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedParty === party.id ? 'border-blue-400 bg-blue-500' : 'border-slate-600'}`}>
                                                    {selectedParty === party.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleCastVote}
                                        disabled={!selectedParty || isVoterSubmitting}
                                        className={`w-full py-4 px-6 text-white font-black text-base rounded-2xl tracking-wider shadow-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${!selectedParty || isVoterSubmitting
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/40'
                                            }`}
                                    >
                                        {isVoterSubmitting ? 'RECORDING BALLOT...' : 'CAST VOTE'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Confirmation */}
                        {voterStep === 'confirmation' && (
                            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 text-center animate-fade-in">
                                <div className="inline-flex p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 shadow-2xl shadow-emerald-500/20">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                                        ✅ Vote successfully cast!
                                    </h2>
                                    <p className="text-xl font-bold text-white">Thank you for voting.</p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Your vote has been cryptographically recorded in the official election database.
                                    </p>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-2 font-mono">
                                    <p><span className="text-slate-500 uppercase">Voter ID:</span> {currentVoter ? currentVoter.voterId : voterId}</p>
                                    <p><span className="text-slate-500 uppercase">Ballot Status:</span> <span className="text-emerald-400 font-bold">MARKED AS VOTED</span></p>
                                    <p><span className="text-slate-500 uppercase">Security Note:</span> Single vote per voter ID enforced.</p>
                                </div>

                                <button
                                    onClick={handleVoterLogout}
                                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl tracking-wider transition-all shadow-lg shadow-blue-600/30"
                                >
                                    LOG OUT & DONE
                                </button>
                            </div>
                        )}

                    </div>
                )}

                {/* ==================================================================== */}
                {/* 2. AUTHORIZED OFFICER / ADMIN DASHBOARD SECTION                     */}
                {/* ==================================================================== */}
                {activeTab === 'admin' && (
                    <div className="space-y-8 animate-fade-in">

                        {!isAdminAuthenticated ? (
                            <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 relative overflow-hidden">
                                <div className="text-center space-y-3">
                                    <div className="inline-flex p-3.5 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400 shadow-xl shadow-purple-600/10">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Authorized Officer Login</h2>
                                    <p className="text-xs text-slate-400">Only authorized government officers can access the vote-counting dashboard.</p>
                                </div>

                                <form onSubmit={handleAdminLogin} className="space-y-5">
                                    {adminAuthError && (
                                        <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                                            <span>{adminAuthError}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Officer Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={adminUsername}
                                            onChange={(e) => setAdminUsername(e.target.value)}
                                            placeholder="admin"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showAdminPassword ? 'text' : 'password'}
                                                required
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                placeholder="admin123"
                                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                            >
                                                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isAdminLoggingIn}
                                        className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl tracking-wider shadow-lg shadow-purple-600/30 transition-all"
                                    >
                                        {isAdminLoggingIn ? 'Verifying Credentials...' : 'LOGIN TO OFFICER DASHBOARD'}
                                    </button>
                                </form>

                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                                    <p className="text-purple-400 font-extrabold uppercase tracking-wider text-[10px] mb-1">🔑 Government Demo Credentials:</p>
                                    <p><span className="text-slate-300 font-semibold">Username:</span> admin</p>
                                    <p><span className="text-slate-300 font-semibold">Password:</span> admin123</p>
                                </div>
                            </div>
                        ) : (
                            /* Live Dashboard */
                            <div className="space-y-8">

                                {/* Header Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                            Authorized Vote-Counting Dashboard
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 font-bold uppercase tracking-wider">
                                                Restricted Access
                                            </span>
                                        </h2>
                                        <p className="text-slate-400 text-sm mt-1">Real-time election tally and voter demographic analytics.</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsResetModalOpen(true)}
                                            className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black tracking-wider transition-all"
                                        >
                                            RESET ALL VOTES
                                        </button>
                                        <button
                                            onClick={handleAdminLogout}
                                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black tracking-wider transition-all flex items-center gap-2"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            LOG OUT
                                        </button>
                                    </div>
                                </div>

                                {resetSuccess && (
                                    <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <p className="text-sm font-semibold">All party vote tallies and voter records have been successfully reset.</p>
                                    </div>
                                )}

                                {/* Party Tally Cards with Party Emblems / Logos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {PARTIES.map((party) => {
                                        const count = votes[party.id] || 0;
                                        const percent = getPercent(count);
                                        return (
                                            <div key={party.id} className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group ${party.borderHover} transition-all shadow-xl`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${party.iconBg} flex items-center justify-center text-xl shadow-lg border border-white/20`}>
                                                            {party.symbol}
                                                        </div>
                                                        <div>
                                                            <h3 className={`text-lg font-black ${party.colorText}`}>{party.name}</h3>
                                                            <p className="text-[10px] text-slate-500 font-semibold">{party.fullName}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${party.badgeBg}`}>
                                                        {percent}%
                                                    </span>
                                                </div>

                                                <div className="mt-5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Votes Tally</p>
                                                    <p className="text-5xl font-black text-white mt-1 tracking-tight">{count.toLocaleString()}</p>
                                                </div>

                                                {/* Mini progress bar */}
                                                <div className="mt-4 h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${party.gradient} rounded-full transition-all duration-500`}
                                                        style={{ width: `${Math.max(parseFloat(percent), totalVotes === 0 ? 0 : 4)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* AGE DEMOGRAPHICS ANALYTICS SECTION */}
                                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                                <PieChart className="w-5 h-5 text-indigo-400" />
                                                Voter Age Demographic Analytics
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of voters cast by age category</p>
                                        </div>
                                        <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                            Demographic Engine Active
                                        </span>
                                    </div>

                                    {/* Age Demographic Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                                        {/* Youth / Gen Z */}
                                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    🎓 Youth / Gen Z
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-400">18 - 25 Yrs</span>
                                            </div>
                                            <p className="text-3xl font-black text-white">{demographics.youth}</p>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                                <span>Demographic Share:</span>
                                                <span className="font-bold text-blue-400">{getDemoPercent(demographics.youth)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getDemoPercent(demographics.youth)}%` }} />
                                            </div>
                                        </div>

                                        {/* Millennials */}
                                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    💼 Millennials
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-400">26 - 40 Yrs</span>
                                            </div>
                                            <p className="text-3xl font-black text-white">{demographics.millennials}</p>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                                <span>Demographic Share:</span>
                                                <span className="font-bold text-purple-400">{getDemoPercent(demographics.millennials)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${getDemoPercent(demographics.millennials)}%` }} />
                                            </div>
                                        </div>

                                        {/* Gen X / Adults */}
                                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    🏢 Gen X / Adults
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-400">41 - 59 Yrs</span>
                                            </div>
                                            <p className="text-3xl font-black text-white">{demographics.genX}</p>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                                <span>Demographic Share:</span>
                                                <span className="font-bold text-emerald-400">{getDemoPercent(demographics.genX)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getDemoPercent(demographics.genX)}%` }} />
                                            </div>
                                        </div>

                                        {/* Senior Citizens */}
                                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    👴 Senior Citizens
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-400">60+ Yrs</span>
                                            </div>
                                            <p className="text-3xl font-black text-white">{demographics.seniorCitizens}</p>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                                <span>Demographic Share:</span>
                                                <span className="font-bold text-amber-400">{getDemoPercent(demographics.seniorCitizens)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${getDemoPercent(demographics.seniorCitizens)}%` }} />
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Official Party Vote Summary Table */}
                                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-purple-400" />
                                        Official Vote Summary Table
                                    </h3>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-xs font-extrabold uppercase text-slate-400">
                                                    <th className="py-3 px-4">Party Logo</th>
                                                    <th className="py-3 px-4">Party Name</th>
                                                    <th className="py-3 px-4">Votes</th>
                                                    <th className="py-3 px-4">Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60 text-sm font-semibold text-slate-200">
                                                {PARTIES.map((party) => {
                                                    const count = votes[party.id] || 0;
                                                    return (
                                                        <tr key={party.id}>
                                                            <td className="py-3.5 px-4 text-2xl">{party.symbol}</td>
                                                            <td className={`py-3.5 px-4 font-bold ${party.colorText}`}>
                                                                {party.name} <span className="text-xs text-slate-400 font-normal">({party.fullName})</span>
                                                            </td>
                                                            <td className="py-3.5 px-4 font-mono text-base">{count}</td>
                                                            <td className="py-3.5 px-4 text-xs font-mono">{getPercent(count)}%</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-slate-950 font-black text-white">
                                                    <td className="py-4 px-4">📊</td>
                                                    <td className="py-4 px-4">TOTAL VOTES</td>
                                                    <td className="py-4 px-4 font-mono text-lg">{totalVotes}</td>
                                                    <td className="py-4 px-4 text-xs font-mono">100.0%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Registered Voters Monitor */}
                                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-400" />
                                            Registered Voters & Age Demographics Monitor
                                        </h3>
                                        <span className="text-xs text-slate-400 font-mono">Total Voters: {votersList.length}</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-xs font-extrabold uppercase text-slate-400">
                                                    <th className="py-3 px-4">Voter ID</th>
                                                    <th className="py-3 px-4">Name</th>
                                                    <th className="py-3 px-4">DOB</th>
                                                    <th className="py-3 px-4">Age Demographic Group</th>
                                                    <th className="py-3 px-4">Voting Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
                                                {votersList.length > 0 ? (
                                                    votersList.map((v, i) => (
                                                        <tr key={i}>
                                                            <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{v.voterId}</td>
                                                            <td className="py-3.5 px-4 font-semibold text-white">{v.name}</td>
                                                            <td className="py-3.5 px-4 font-mono">{v.dob}</td>
                                                            <td className="py-3.5 px-4 font-semibold text-indigo-300">
                                                                {v.ageCategory || 'Youth (18-25)'}
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                {v.hasVoted ? (
                                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                                                                        VOTED
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-extrabold">
                                                                        NOT VOTED
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-4 text-center text-slate-500">No voters registered yet</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                )}

            </main>

            {/* Reset Modal */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-white">Reset Election Votes</h3>
                                <p className="text-xs text-red-400 font-semibold">Confirmation Required</p>
                            </div>
                        </div>

                        <p className="text-slate-300 text-sm">
                            Are you sure you want to reset all party vote counts to 0 and clear voter status?
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                disabled={isResetting}
                                onClick={() => setIsResetModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isResetting}
                                onClick={handleResetVotes}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30"
                            >
                                {isResetting ? 'Resetting...' : 'Confirm Reset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
