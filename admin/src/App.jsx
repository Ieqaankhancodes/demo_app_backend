import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db, isFirebaseConfigured } from './firebase/config';
import {
    BarChart3,
    RotateCcw,
    Users,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Activity,
    ShieldAlert,
    Server
} from 'lucide-react';

const LOCAL_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
    const [votes, setVotes] = useState({
        seniorCitizen: 0,
        governmentServant: 0
    });
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [backendType, setBackendType] = useState('Local Server');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState('');

    // Dual-mode Sync Listener: Firebase OR Local SSE Backend
    useEffect(() => {
        if (isFirebaseConfigured) {
            setBackendType('Firebase Realtime Database');
            const votesRef = ref(db, 'votes');
            const unsubscribe = onValue(
                votesRef,
                (snapshot) => {
                    setLoading(false);
                    setIsConnected(true);
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        setVotes({
                            seniorCitizen: typeof data.seniorCitizen === 'number' ? data.seniorCitizen : 0,
                            governmentServant: typeof data.governmentServant === 'number' ? data.governmentServant : 0
                        });
                    } else {
                        setVotes({ seniorCitizen: 0, governmentServant: 0 });
                    }
                },
                (error) => {
                    console.error("Firebase connection error:", error);
                    setLoading(false);
                    setIsConnected(false);
                }
            );
            return () => unsubscribe();
        } else {
            // Local Server SSE Stream
            setBackendType('Local Node Backend (Port 5000)');
            let eventSource;
            try {
                eventSource = new EventSource(`${LOCAL_BACKEND_URL}/api/stream`);
                eventSource.onopen = () => {
                    setIsConnected(true);
                    setLoading(false);
                };
                eventSource.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        setVotes({
                            seniorCitizen: typeof data.seniorCitizen === 'number' ? data.seniorCitizen : 0,
                            governmentServant: typeof data.governmentServant === 'number' ? data.governmentServant : 0
                        });
                        setIsConnected(true);
                        setLoading(false);
                    } catch (err) {
                        console.error("Error parsing local stream message:", err);
                    }
                };
                eventSource.onerror = (err) => {
                    console.warn("Local SSE server offline or connecting...", err);
                    setIsConnected(false);
                    setLoading(false);
                };
            } catch (err) {
                setIsConnected(false);
                setLoading(false);
            }
            return () => {
                if (eventSource) eventSource.close();
            };
        }
    }, []);

    const totalVotes = votes.seniorCitizen + votes.governmentServant;

    const seniorPercent = totalVotes > 0
        ? ((votes.seniorCitizen / totalVotes) * 100).toFixed(1)
        : "0.0";

    const govPercent = totalVotes > 0
        ? ((votes.governmentServant / totalVotes) * 100).toFixed(1)
        : "0.0";

    const handleResetVotes = async () => {
        setIsResetting(true);
        setResetError('');
        try {
            if (isFirebaseConfigured) {
                const votesRef = ref(db, 'votes');
                await set(votesRef, { seniorCitizen: 0, governmentServant: 0 });
            } else {
                const res = await fetch(`${LOCAL_BACKEND_URL}/api/reset`, { method: 'POST' });
                if (!res.ok) throw new Error("Local reset failed");
            }
            setIsResetting(false);
            setIsResetModalOpen(false);
            setResetSuccess(true);
            setTimeout(() => setResetSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to reset votes:", err);
            setIsResetting(false);
            setResetError("Failed to reset votes. Ensure backend server or Firebase is active.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
            {/* Top Header Bar */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-lg shadow-blue-500/10">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                                ADMIN DASHBOARD
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-semibold tracking-normal">
                                    Demo
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Real-time Online Voting Counter</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Realtime Connection Status */}
                        <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${isConnected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            <Server className="w-3.5 h-3.5" />
                            {isConnected ? backendType : 'Connecting to Backend...'}
                        </div>

                        {/* Reset Button Header Trigger */}
                        <button
                            onClick={() => setIsResetModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md shadow-red-900/20"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>RESET ALL VOTES</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Success Alert Toast */}
                {resetSuccess && (
                    <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-950/40 animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-sm font-semibold">Votes have been successfully reset to zero.</p>
                    </div>
                )}

                {/* Section Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Voting Results</h2>
                        <p className="text-slate-400 text-sm mt-1">Live data streamed instantly from {backendType}</p>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Loading latest tally...</span>
                        </div>
                    )}
                </div>

                {/* Top Metric Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Senior Citizen Card */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300 shadow-xl shadow-slate-950/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                        <div className="flex items-center justify-between">
                            <span className="text-4xl">👴</span>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {seniorPercent}%
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Senior Citizen</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">
                                {votes.seniorCitizen.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">Total votes received for senior citizen category</p>
                    </div>

                    {/* Government Servant Card */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-xl shadow-slate-950/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                        <div className="flex items-center justify-between">
                            <span className="text-4xl">🧑‍💼</span>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {govPercent}%
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Government Servant</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">
                                {votes.governmentServant.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">Total votes received for government servant category</p>
                    </div>

                    {/* Total Votes Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 shadow-xl shadow-slate-950/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-purple-300">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Overall Tally
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-purple-300/80 uppercase tracking-wider">Total Votes</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">
                                {totalVotes.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">Combined sum of all casted votes</p>
                    </div>

                </div>

                {/* Visual Comparison Section (Horizontal Progress Bars) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl shadow-slate-950/50">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                Live Visual Comparison
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Horizontal distribution breakdown</p>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">Realtime Percentage</span>
                    </div>

                    <div className="space-y-6">

                        {/* Senior Citizen Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2 text-slate-200">
                                    <span className="text-xl">👴</span> Senior Citizen
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-400 font-mono text-base">{votes.seniorCitizen}</span>
                                    <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-400 border border-slate-700/50">
                                        {seniorPercent}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden p-1 border border-slate-800/80">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg transition-all duration-700 ease-out shadow-lg shadow-blue-500/20"
                                    style={{ width: `${Math.max(parseFloat(seniorPercent), totalVotes === 0 ? 0 : 2)}%` }}
                                />
                            </div>
                        </div>

                        {/* Government Servant Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2 text-slate-200">
                                    <span className="text-xl">🧑‍💼</span> Government Servant
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 font-mono text-base">{votes.governmentServant}</span>
                                    <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-400 border border-slate-700/50">
                                        {govPercent}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden p-1 border border-slate-800/80">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-lg transition-all duration-700 ease-out shadow-lg shadow-emerald-500/20"
                                    style={{ width: `${Math.max(parseFloat(govPercent), totalVotes === 0 ? 0 : 2)}%` }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* ASCII / Text Visual Comparison Representation as specified in prompt */}
                    <div className="mt-6 pt-6 border-t border-slate-800/60 bg-slate-950/60 rounded-2xl p-4 font-mono text-xs text-slate-400 space-y-3">
                        <p className="text-slate-500 text-[11px] font-sans font-semibold uppercase tracking-wider">Console Format Preview</p>
                        <div>
                            <p className="text-slate-300 font-sans font-medium mb-1">Senior Citizen</p>
                            <p className="text-blue-400 overflow-x-auto whitespace-pre">
                                {'█'.repeat(Math.round(parseFloat(seniorPercent) / 5))} <span className="text-white font-bold">{votes.seniorCitizen}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-300 font-sans font-medium mb-1">Government Servant</p>
                            <p className="text-emerald-400 overflow-x-auto whitespace-pre">
                                {'█'.repeat(Math.round(parseFloat(govPercent) / 5))} <span className="text-white font-bold">{votes.governmentServant}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-slate-200">Demo Application Control</p>
                            <p className="text-xs text-slate-400">Clear all vote counters to restart the demonstration flow.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-extrabold tracking-wider transition-all duration-200 shadow-lg shadow-red-600/30 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        RESET ALL VOTES
                    </button>
                </div>

            </main>

            {/* Confirmation Modal Dialog for Reset */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-slate-950/80">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-white">Reset All Votes</h3>
                                <p className="text-xs text-red-400 font-semibold mt-0.5">Confirmation Required</p>
                            </div>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed">
                            Are you sure you want to reset all votes?
                        </p>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                            <p><span className="text-slate-200 font-semibold">• Senior Citizen:</span> {votes.seniorCitizen} → 0</p>
                            <p><span className="text-slate-200 font-semibold">• Government Servant:</span> {votes.governmentServant} → 0</p>
                        </div>

                        {resetError && (
                            <p className="text-xs text-red-400 font-medium">{resetError}</p>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                disabled={isResetting}
                                onClick={() => setIsResetModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isResetting}
                                onClick={handleResetVotes}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                            >
                                {isResetting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <span>Reset</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
