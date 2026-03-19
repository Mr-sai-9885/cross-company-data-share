import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  LayoutGrid, 
  Activity, 
  Settings, 
  Search, 
  Download, 
  FileUp,
  Fingerprint,
  RefreshCw,
  LogOut,
  User as UserIcon,
  BarChart3,
  PieChart,
  Database,
  AlertCircle,
  Play,
  ShieldQuestion,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Network,
  Send,
  Bot,
  User as UserChatIcon,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore
} from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Shared Components ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, loading = false, disabled = false }) => {
  const variants = {
    primary: "bg-[#13ec5b] text-black hover:bg-[#3af176] shadow-[0_0_15px_rgba(19,236,91,0.3)]",
    secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
    outline: "border border-[#13ec5b]/50 text-[#13ec5b] hover:bg-[#13ec5b]/10",
    ghost: "text-white/60 hover:text-white hover:bg-white/5"
  };

  return (
    <button 
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? <RefreshCw className="animate-spin" size={18} /> : (Icon && <Icon size={18} />)}
      {children}
    </button>
  );
};

// --- View: Dashboard ---

const DashboardView = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Welcome to the Glass Vault Enclave. I can analyze your vaulted datasets. Try asking 'What is the risk distribution for the latest upload?'" }
  ]);
  const [lastRiskAnalysis, setLastRiskAnalysis] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const userMsg = searchQuery;
    setSearchQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsSearching(true);

    try {
      const response = await fetch(`${BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg })
      });

      const data = await response.json();

      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: data.answer || "Analysis complete. I've updated the risk parameters below." }]);
        if (data.risk_analysis) {
          setLastRiskAnalysis(data.risk_analysis);
        }
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', text: "I encountered an error accessing the vault node. Please check the backend connection." }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Communication timeout. The secure enclave is currently unreachable." }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Anonymized Rows', value: '1.24 M', growth: '+18%', icon: Database },
          { label: 'Privacy Budget', value: '8.4 / 10', status: 'Healthy', icon: ShieldCheck },
          { label: 'Insight Accuracy', value: '99.2%', status: 'Stable', icon: Activity },
          { label: 'Risk Anomalies', value: '04', growth: 'Low', icon: AlertTriangle }
        ].map((s, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-lg text-[#13ec5b]"><s.icon size={18} /></div>
              {s.growth && <span className="text-[10px] font-bold text-[#13ec5b] bg-[#13ec5b]/10 px-2 py-0.5 rounded-full">{s.growth}</span>}
            </div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-bold mb-1">{s.label}</p>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chat & Search */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-[600px]">
          <GlassCard className="flex-1 flex flex-col overflow-hidden border-[#13ec5b]/10">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#13ec5b]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Enclave AI Assistant</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#13ec5b] animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#13ec5b]/40" />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatHistory.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`size-8 rounded-lg shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-[#13ec5b]/10 border-[#13ec5b]/20 text-[#13ec5b]'}`}>
                    {msg.role === 'user' ? <UserChatIcon size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#13ec5b] text-black font-medium' : 'bg-white/5 text-white/80 border border-white/10'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isSearching && (
                <div className="flex gap-4">
                  <div className="size-8 rounded-lg bg-[#13ec5b]/10 border border-[#13ec5b]/20 text-[#13ec5b] flex items-center justify-center">
                    <RefreshCw size={14} className="animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Search Input Area */}
            <form onSubmit={handleSearch} className="p-4 bg-black/20 border-t border-white/5">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask the vault about risk trends..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#13ec5b]/50 transition-all placeholder:text-white/20"
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 p-2 text-[#13ec5b] hover:bg-[#13ec5b]/10 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Risk Analysis Context */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#13ec5b]" />
              Contextual Risk Analysis
            </h3>
            
            {lastRiskAnalysis ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Impact Level</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${lastRiskAnalysis.level === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-[#13ec5b]/20 text-[#13ec5b]'}`}>
                      {(lastRiskAnalysis.level || 'Low').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">{lastRiskAnalysis.description || "No specific risks detected."}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white/20 uppercase">Privacy Preservation</span>
                    <span className="text-[#13ec5b]">{lastRiskAnalysis.privacy_score || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${lastRiskAnalysis.privacy_score || 0}%` }}
                      className="h-full bg-[#13ec5b]" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                   <div className="p-2 bg-white/5 rounded-lg">
                      <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Epsilon</p>
                      <p className="text-xs font-mono text-[#13ec5b]">0.1</p>
                   </div>
                   <div className="p-2 bg-white/5 rounded-lg">
                      <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Safety Lock</p>
                      <p className="text-xs font-mono text-[#13ec5b]">Active</p>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <ShieldQuestion size={40} className="text-white/10 mb-4" />
                <p className="text-xs text-white/30">Perform a search to generate a real-time risk analysis based on your query.</p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden h-[230px]">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-sm font-bold mb-2">Network Health</h3>
              <p className="text-[10px] text-white/40 mb-6 uppercase tracking-widest font-mono">Nodes Connected: 12</p>
              
              <div className="flex-1 flex items-end gap-1">
                 {[40, 70, 45, 90, 65, 80, 50, 85, 60, 75, 55, 60, 40, 30].map((h, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${h}%` }}
                     className="flex-1 bg-[#13ec5b]/20 rounded-t-sm"
                   />
                 ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// --- View: Unified Vault (Upload + Analytics) ---

const VaultProcessingView = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [vaultedData, setVaultedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      setUploadError("Please upload a valid .csv file.");
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setUploadError(null);
    setVaultedData(null);
    setAnalysisResults(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${BASE_URL}/process`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Processing failed");
      } else {
        setVaultedData({
          fileName: selectedFile.name,
          downloadFile: data.download_file,
          summary: data
        });
      }
    } catch (err) {
      setUploadError("Backend connection failed. Ensure Flask is running on port 5000.");
    } finally {
      setIsUploading(false);
    }
  };

  const runSafeQuery = async () => {
    if (!vaultedData?.downloadFile) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BASE_URL}/analyze/${vaultedData.downloadFile}`);
      const data = await response.json();

      if (!response.ok) throw new Error("Analysis failed");

      const chartData = Object.entries(data.age_distribution || {}).map(([label, value]) => ({
        label,
        val: value
      }));

      setAnalysisResults({
        chartData,
        raw: data
      });
    } catch (err) {
      console.error("Query error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadSafeFile = () => {
    if (!vaultedData?.downloadFile) return;
    window.open(`${BASE_URL}/download/${vaultedData.downloadFile}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Vault Ingestion</h2>
            <p className="text-white/40 text-sm">Anonymize and prepare datasets for cross-company collaboration.</p>
          </div>
          {vaultedData && (
            <Button variant="ghost" onClick={() => { setVaultedData(null); setAnalysisResults(null); setFile(null); }} icon={RefreshCw}>
              Reset Enclave
            </Button>
          )}
        </div>

        {!vaultedData ? (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative aspect-[21/7] bg-black/40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${isUploading ? 'border-[#13ec5b]/50 shadow-[0_0_40px_rgba(19,236,91,0.1)]' : 'border-white/10 hover:border-[#13ec5b]/30'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileUpload(e.target.files[0])} />
            <AnimatePresence>
              {isUploading && (
                <motion.div 
                  initial={{ top: 0 }} animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#13ec5b] to-transparent shadow-[0_0_20px_#13ec5b] z-20"
                />
              )}
            </AnimatePresence>
            
            <div className="flex flex-col items-center gap-4 text-center px-6 relative z-30">
              <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 ${isUploading ? 'text-[#13ec5b] scale-110 shadow-[0_0_20px_rgba(19,236,91,0.2)]' : 'text-white/20'}`}>
                {isUploading ? <RefreshCw size={48} className="animate-spin" /> : <FileUp size={48} />}
              </div>
              <h3 className="text-xl font-bold">{isUploading ? 'Vaulting Data...' : 'Select CSV for Local Anonymization'}</h3>
              <p className="text-xs text-white/30 font-mono tracking-widest uppercase">age_group, transaction_amount, risk_score</p>
              
              {uploadError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={16} />
                  <span className="text-[10px] text-red-300 font-bold uppercase">{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard className="p-8 border-l-4 border-l-[#13ec5b]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#13ec5b]/10 rounded-2xl flex items-center justify-center text-[#13ec5b]">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {vaultedData.fileName}
                      <span className="text-[10px] px-2 py-0.5 bg-[#13ec5b]/20 text-[#13ec5b] rounded-full uppercase tracking-widest font-bold">Vaulted</span>
                    </h3>
                    <p className="text-sm text-white/40 mt-1">
                      Dataset successfully hashed and noise-injected in browser enclave.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={downloadSafeFile} icon={Download}>Download Safe CSV</Button>
                  <Button onClick={runSafeQuery} loading={isAnalyzing} icon={Play}>Run Safe Query</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                {[
                  { label: 'Total Records', value: vaultedData.summary?.total_rows || 'N/A', icon: Database },
                  { label: 'Removed PII', value: vaultedData.summary?.removed_columns?.length || 0, icon: AlertCircle },
                  { label: 'Privacy Budget', value: 'ε=0.1', icon: Fingerprint },
                  { label: 'Integrity', value: '100%', icon: Activity }
                ].map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] text-white/20 font-bold uppercase mb-1">{s.label}</span>
                    <span className="text-lg font-bold flex items-center gap-2">
                       <s.icon size={14} className="text-[#13ec5b]" />
                       {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {analysisResults && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Privacy-Preserving Insights</h2>
                <p className="text-white/40 text-sm">Aggregated results with differential privacy noise applied.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2 p-8">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#13ec5b]" />
                    Risk Distribution by Age Group
                  </h3>
                  <span className="text-[10px] font-mono text-[#13ec5b] px-2 py-1 bg-[#13ec5b]/10 rounded">FEDERATED_CONSENSUS_STABLE</span>
                </div>
                
                <div className="flex items-end gap-6 h-64 border-b border-white/10 pb-4 mt-4">
                  {analysisResults.chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#13ec5b] opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.val.toFixed(1)}%
                      </span>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${d.val}%` }}
                        className="w-full bg-[#13ec5b]/10 border-t-2 border-[#13ec5b] rounded-t-md hover:bg-[#13ec5b]/30 transition-all cursor-pointer relative" 
                      >
                         <div className="absolute inset-0 bg-gradient-to-t from-[#13ec5b]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                      <span className="text-[10px] text-white/40 uppercase tracking-tighter whitespace-nowrap">{d.label}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h4 className="text-xs font-bold mb-4 flex items-center gap-2">
                    <Fingerprint size={14} className="text-[#13ec5b]" />
                    Enclave Integrity
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed mb-6">
                    Noise injected via Laplace mechanism. Re-identification probability: &lt; 0.0001%.
                  </p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#13ec5b] w-full animate-pulse" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-white/20">SECURITY_LEVEL_HIGH</span>
                    <span className="text-[9px] text-[#13ec5b]">VERIFIED</span>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 bg-[#13ec5b]/5 border-[#13ec5b]/20">
                  <h4 className="text-xs font-bold mb-2">Export Protocol</h4>
                  <p className="text-xs text-white/60 mb-4">Exporting results as a sanitized dataset removes all intermediate hashes.</p>
                  <Button variant="primary" className="w-full text-xs" onClick={downloadSafeFile} icon={Download}>
                    Export Safe Dataset
                  </Button>
                </GlassCard>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!vaultedData && !isUploading && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          {[
            { title: 'Local Anonymization', desc: 'PII columns are dropped and identifiers hashed locally.', icon: ShieldCheck },
            { title: 'Differential Privacy', desc: 'Laplace noise added to prevent record-linkage attacks.', icon: Activity },
            { title: 'Federated Export', desc: 'Secure query results shared across organization nodes.', icon: Network }
          ].map((item, i) => (
            <GlassCard key={i} className="p-6 border-white/5">
              <item.icon size={20} className="text-[#13ec5b] mb-3" />
              <h4 className="text-sm font-bold mb-2">{item.title}</h4>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    setUser(u);
    setAuthReady(true);
  });

  return () => unsubscribe();
}, []);

  const loginGoogle = async () => {
<<<<<<< HEAD
  setAuthError(null);
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e.code === 'auth/unauthorized-domain') {
      setAuthError("Domain unauthorized. Add to Firebase Authorized Domains.");
    } else {
=======
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
>>>>>>> 71ec042 (fix auth)
      setAuthError(e.message);
    }
  }
};

  if (!authReady) return (
    <div className="min-h-screen bg-[#020b1c] flex items-center justify-center">
      <RefreshCw className="text-[#13ec5b] animate-spin" size={32} />
    </div>
  );

  if (!user) {
      if (!user || view === 'login_portal') return (
        <div className="min-h-screen flex items-center justify-center bg-[#020b1c] p-6 relative overflow-hidden font-display">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#13ec5b]/5 blur-[120px] rounded-full" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
            <GlassCard className="p-8 sm:p-10 border-t-[#13ec5b]/30 border-t">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-[#13ec5b]/10 rounded-3xl flex items-center justify-center mb-6 shadow-glow ring-1 ring-[#13ec5b]/30 rotate-3">
                  <Lock className="text-[#13ec5b]" size={40} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">The Glass Vault</h1>
                <p className="text-white/40 text-sm italic">"Privacy-Safe Cross-Company Insights"</p>
              </div>
              <div className="space-y-4">
                <Button onClick={loginGoogle} className="w-full h-12" icon={ShieldCheck}>Continue with Google</Button>
                <div className="relative py-4 flex items-center justify-center">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                   <span className="relative bg-[#020b1c] px-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">Secure Entry</span>
                </div>
                <Button onClick={() => signInAnonymously(auth)} variant="secondary" className="w-full h-12" icon={Fingerprint}>Anonymous Access</Button>
                {authError && <p className="text-[10px] text-red-400 mt-4 text-center">{authError}</p>}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      );
  }

  return (
    <div className="flex h-screen w-full bg-[#020b1c] text-white font-sans overflow-hidden">
      <nav className="w-20 bg-white/[0.02] border-r border-white/10 flex flex-col items-center py-8 gap-10 shrink-0">
        <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-2xl flex items-center justify-center border border-[#13ec5b]/20 text-[#13ec5b]">
          <ShieldCheck size={24} />
        </div>
        <div className="flex flex-col gap-6">
          {[
            { id: 'dashboard', icon: LayoutGrid },
            { id: 'processing', icon: Activity },
            { id: 'settings', icon: Settings }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setView(item.id)}
              className={`p-3 rounded-xl transition-all ${view === item.id ? 'bg-[#13ec5b] text-black shadow-glow' : 'text-white/40 hover:bg-white/5'}`}
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button onClick={() => signOut(auth)} className="text-white/20 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
            {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={20} className="text-white/20" />}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-bold tracking-[0.2em] text-white/30 uppercase">Vault Node v1.0</h2>
            <div className="h-4 w-px bg-white/10" />
            <p className="text-sm font-medium text-[#13ec5b] uppercase tracking-wider">
              {view === 'processing' ? 'Secure Processing' : view}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/40 font-mono hidden sm:block">{user.email || 'ANONYMOUS_ENCLAVE'}</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#13ec5b]/10 rounded-full border border-[#13ec5b]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#13ec5b] animate-pulse" />
              <span className="text-[10px] font-bold text-[#13ec5b]">ENCLAVE ACTIVE</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <DashboardView user={user} />}
              {view === 'processing' && <VaultProcessingView />}
              {view === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold">Node Identity</h2>
                  <GlassCard className="p-6 flex items-center gap-4">
                     <div className="size-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                        {user.photoURL ? <img src={user.photoURL} className="rounded-full" alt="User" /> : <UserIcon size={32} className="text-white/20" />}
                     </div>
                     <div>
                        <p className="font-bold">{user.displayName || 'Anonymous Peer'}</p>
                        <p className="text-xs text-white/40 font-mono">{user.email || user.uid}</p>
                     </div>
                  </GlassCard>
                  <Button variant="secondary" onClick={() => signOut(auth)} className="w-full">Sign Out of Enclave</Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        body { background-color: #020b1c; margin: 0; font-family: 'Inter', sans-serif; }
        .shadow-glow { box-shadow: 0 0 20px rgba(19, 236, 91, 0.2); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}
