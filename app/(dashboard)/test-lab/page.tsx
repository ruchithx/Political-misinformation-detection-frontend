'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  Play, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  ScanEye,
  Type,
  Share2
} from 'lucide-react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useHistory } from '@/hooks/useHistory';
import { useAnalysisCounter } from '@/hooks/useAnalysisCounter';
import { ResultPanel } from '@/components/analysis/ResultPanel';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/types';

interface TestSample {
  id: number;
  text: string;
  actualLabel: 'FAKE' | 'REAL';
  socialData?: Record<string, any>;
  displayMeta?: {
    domainScore?: string | number;
    mediaRichness?: string | number;
    completeness?: string | number;
  };
}

type TestMode = 'text' | 'media';

export default function TestLabPage() {
  const [mode, setMode] = useState<TestMode>('text');
  const [samples, setSamples] = useState<TestSample[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [resultsMap, setResultsMap] = useState<Record<string, AnalysisResult>>({});
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const { mutateAsync: runAnalysis } = useAnalysis();
  const { addResult } = useHistory();
  const { increment } = useAnalysisCounter();

  const handleRunUrl = async () => {
    if (!urlInput) return;
    setIsScraping(true);
    
    // 1. SHIM: Mock scraping from URL until real scraper is ready
    // Extract domain to mock scores
    let domain = 'web';
    try { domain = new URL(urlInput).hostname.replace('www.', ''); } catch(e) {}
    
    // Simulate latency
    await new Promise(r => setTimeout(r, 1200));

    const mockSocialData = {
      domain_credibility_score: domain.includes('reuters') || domain.includes('apnews') ? 0.95 : 0.42,
      media_richness_score: 0.8,
      metadata_completeness: 0.85,
      platform: domain.includes('twitter') || domain.includes('x.com') ? 'twitter' : 'web',
      author_follow_count: 12500,
      verified: domain.includes('twitter') ? 1 : 0
    };

    const mockSample: TestSample = {
      id: Date.now(),
      text: `Manual evaluation for content from ${domain}`,
      actualLabel: 'REAL', // Unknown but UI handles it
      socialData: mockSocialData
    };

    try {
      const result = await runAnalysis({
        text: mockSample.text,
        platform: mockSocialData.platform as any,
      });
      
      const rKey = `manual-${mockSample.id}`;
      setResultsMap(prev => ({ ...prev, [rKey]: result }));
      setSelectedResult(result);
      addResult(result);
      increment();
      setUrlInput(''); // Reset
    } catch (error) {
      console.error('URL Analysis failed:', error);
    } finally {
      setIsScraping(false);
    }
  };

  const loadSamples = async (currentMode: TestMode) => {
    setIsLoadingSamples(true);
    try {
      const endpoint = currentMode === 'text' ? '/api/test-samples' : '/api/media-samples';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSamples(data);
        // Clear results when switching or refreshing
        setSelectedResult(null);
      }
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  useEffect(() => {
    loadSamples(mode);
  }, [mode]);

  const handleRunTest = async (sample: TestSample) => {
    const resultKey = `${mode}-${sample.id}`;
    setRunningId(sample.id);
    try {
      const result = await runAnalysis({
        text: sample.text,
        platform: 'twitter',
      });
      setResultsMap(prev => ({ ...prev, [resultKey]: result }));
      setSelectedResult(result);
      addResult(result);
      increment();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setRunningId(null);
    }
  };

  const currentResultKey = (id: number) => `${mode}-${id}`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0b10]">
      {/* Left Column: Sample List */}
      <div className="w-1/2 flex flex-col border-r border-white/5 bg-[#0f1117]/50 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FlaskConical className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Test Lab</h1>
                <p className="text-xs text-white/40 font-medium">Evaluate model performance across modalities</p>
              </div>
            </div>
            <button
              onClick={() => loadSamples(mode)}
              disabled={isLoadingSamples}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-all border border-white/10 disabled:opacity-50"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", isLoadingSamples && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/5">
            <button
              onClick={() => setMode('text')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all rounded-lg",
                mode === 'text' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/10" : "text-white/40 hover:text-white/60"
              )}
            >
              <Type className="h-3.5 w-3.5" />
              TEXT ANALYSIS
            </button>
            <button
              onClick={() => setMode('media')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all rounded-lg",
                mode === 'media' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" : "text-white/40 hover:text-white/60"
              )}
            >
              <Share2 className="h-3.5 w-3.5" />
              MEDIA CONTEXT
            </button>
          </div>

          <div className="relative">
            {mode === 'text' ? (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search text samples..." 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono-num"
                />
              </>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input 
                    type="url" 
                    placeholder="Paste post URL (X/Twitter, Facebook, etc.)" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono-num"
                  />
                </div>
                <button
                  onClick={handleRunUrl}
                  disabled={!urlInput || isScraping}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-bold px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 whitespace-nowrap"
                >
                  {isScraping ? <Loader2 className="h-3 w-3 animate-spin"/> : <ScanEye className="h-3.5 w-3.5"/>}
                  SCRAPE
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoadingSamples ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {samples.map((sample) => {
                const rKey = currentResultKey(sample.id);
                const hasResult = !!resultsMap[rKey];
                const isSelected = selectedResult?.id === resultsMap[rKey]?.id && hasResult;

                return (
                  <motion.div
                    key={sample.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => hasResult && setSelectedResult(resultsMap[rKey])}
                    className={cn(
                      "group relative p-5 rounded-2xl border transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20"
                        : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10"
                    )}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                             sample.actualLabel === 'FAKE' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                           )}>
                             TRUTH: {sample.actualLabel}
                           </span>
                           {hasResult && (
                             <motion.span 
                               initial={{ opacity: 0, scale: 0.8 }}
                               animate={{ opacity: 1, scale: 1 }}
                               className={cn(
                                 "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                                 resultsMap[rKey].verdict === (sample.actualLabel === 'FAKE' ? 'MISINFORMATION' : 'CREDIBLE')
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                               )}
                             >
                               {resultsMap[rKey].verdict === (sample.actualLabel === 'FAKE' ? 'MISINFORMATION' : 'CREDIBLE') ? 'MATCH' : 'MISMATCH'}
                             </motion.span>
                           )}
                        </div>
                        
                        {runningId === sample.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        ) : hasResult ? (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500">READY</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunTest(sample);
                            }}
                            className="p-2.5 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-white/70 leading-relaxed font-medium line-clamp-2 italic">
                        "{sample.text}"
                      </p>

                      {mode === 'media' && sample.displayMeta && (
                        <div className="grid grid-cols-3 gap-2">
                           {Object.entries(sample.displayMeta).map(([k, v]) => (
                             <div key={k} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                                <p className="text-[8px] uppercase tracking-wider text-white/30 truncate">{k.replace(/([A-Z])/g, ' $1')}</p>
                                <p className="text-[10px] font-bold text-white/70 font-mono-num">{v || '0.0'}</p>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3 text-white/20" />
                            <span className="text-[10px] text-white/20 font-mono-num">ID: {sample.id}</span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-all",
                          isSelected ? "text-blue-400 translate-x-1" : "text-white/10"
                        )} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right Column: Detailed View */}
      <div className="flex-1 overflow-y-auto bg-[#0a0b10] p-8 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {selectedResult ? (
            <motion.div
              key={selectedResult.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Analysis Details</h2>
                  <p className="text-sm text-white/40">In-depth model reasoning and confidence scores</p>
                </div>
              </div>
              <ResultPanel result={selectedResult} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-12"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                <div className="relative h-20 w-20 flex items-center justify-center rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl">
                  <ScanEye className="h-10 w-10 text-white/20" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Result Selected</h3>
              <p className="text-sm text-white/40 max-w-[300px] leading-relaxed">
                Run a {mode} test on the left or select an already completed analysis to see details.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
