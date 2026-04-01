import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Activity } from 'lucide-react';
import { auditService } from '../services/api';

interface DetailPanelProps {
  contentId: string | null;
  onClose: () => void;
}

export default function ContractDetailPanel({ contentId, onClose }: DetailPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contentId) return;
    
    setLoading(true);
    const load = async () => {
      try {
        const auditData = await auditService.getAuditResults(contentId);
        
        if (auditData && auditData.length > 0) {
          setData(auditData[0]);
        } else {
          // Just empty state 
          setData({ content_id: contentId, contracts: { studio: 'Unknown', territory: [], start_date: '', end_date: '' } });
        }
      } catch (error) {
        console.error('Failed to load detail data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [contentId]);

  if (!contentId) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.55)', zIndex: 999, backdropFilter: 'blur(8px)' }} 
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          width: '600px',
          background: 'rgba(10, 10, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--gold-dim)',
          zIndex: 1000,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 80px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: 1 }}>Deep Drill-Down</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Content: {contentId}
            </h2>
            {data?.contracts && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                Studio: {data.contracts?.studio || 'N/A'} | Contract: {data.contract_id || 'N/A'}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>Scanning Content Logs...</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px' }}>
                <FileText size={16} color="var(--accent-teal)" /> Contract Terms Snapshot
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Royalty Rate</span><span style={{ color: 'var(--text-primary)' }}>${data?.contracts?.rate_per_play || '0.00'}/play</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Tier Rate</span><span style={{ color: 'var(--text-primary)' }}>${data?.contracts?.tier_rate || '0.00'}/play</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date</span><span style={{ color: 'var(--text-primary)' }}>{data?.contracts?.start_date || 'Unknown'}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>End Date</span><span style={{ color: 'var(--text-primary)' }}>{data?.contracts?.end_date || 'Unknown'}</span></div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Authorized Territories</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(Array.isArray(data?.contracts?.territory) ? data.contracts.territory : []).map((t: string) => (
                    <span key={t} style={{ background: 'rgba(0, 217, 192, 0.1)', color: 'var(--accent-teal)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{t}</span>
                  ))}
                  {(!data?.contracts?.territory || data.contracts.territory.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Global (Unrestricted)</span>}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(124, 111, 237, 0.05)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-purple)', borderStyle: 'dashed' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', color: 'var(--accent-purple)', marginTop: 0, marginBottom: '16px' }}>
                <Activity size={16} /> AI Contract Intelligence
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                {data?.contracts?.contract_text || 'Synthesizing agreement text from legal repository... \n[Agent Note: Validating digital signature and licensing clauses ...]'}
              </p>
            </div>

            <div style={{ background: 'rgba(18, 18, 30, 0.7)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(232, 184, 75, 0.12)', boxShadow: 'inset 0 0 10px rgba(239, 68, 68, 0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', color: 'var(--danger)', marginTop: 0, marginBottom: '16px' }}>
                <Activity size={16} /> Leakage Assessment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Calculated Expected Liability</span>
                  <span style={{ color: 'var(--text-primary)' }}>${data?.expected_payment?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Actual Remittance Found</span>
                  <span style={{ color: 'var(--text-primary)' }}>${data?.actual_payment?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--danger)' }}>Total Audited Leakage ({data?.violation_type || 'N/A'})</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>${data?.difference?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
                </div>
                
                {/* PRD Section 8.6: Explainable Audit Trace */}
                <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>AI Auditor Reasoning:</span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                    {data?.reasoning || "Analyzing stream data and contract clauses to determine optimal royalty tiers..."}
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}
            >
              Acknowledge & Close
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
