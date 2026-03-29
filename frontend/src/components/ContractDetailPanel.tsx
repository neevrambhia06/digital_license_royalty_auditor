import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
      // Fetch audit results for this content_id
      const { data: auditData } = await supabase.from('audit_results').select('*, contracts(*)').eq('content_id', contentId).order('difference', { ascending: false }).limit(1);
      
      if (auditData && auditData.length > 0) {
        setData(auditData[0]);
      } else {
        // Just empty state 
        setData({ content_id: contentId, contracts: { studio: 'Unknown', territory: [], start_date: '', end_date: '' } });
      }
      setLoading(false);
    };
    
    load();
  }, [contentId]);

  if (!contentId) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8, 11, 15, 0.8)', zIndex: 999, backdropFilter: 'blur(4px)' }} 
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
          background: 'var(--bg-raised)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 1000,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 40px rgba(0,0,0,0.5)'
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Royalty Rate</span><span style={{ color: 'var(--text-primary)' }}>${data?.contracts?.rate_per_play || '0.00'}/play</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Tier Rate</span><span style={{ color: 'var(--text-primary)' }}>${data?.contracts?.tier_rate || '0.00'}/play</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date</span><span style={{ color: 'var(--text-primary)' }}>{data?.contracts?.start_date || 'Unknown'}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>End Date</span><span style={{ color: 'var(--text-primary)' }}>{data?.contracts?.end_date || 'Unknown'}</span></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', boxShadow: 'inset 0 0 10px rgba(239, 68, 68, 0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', color: 'var(--danger)', marginTop: 0, marginBottom: '16px' }}>
                <Activity size={16} /> Leakage Assessment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Calculated Expected Liability</span>
                  <span style={{ color: 'var(--text-primary)' }}>${data?.expected_payment?.toFixed(2) || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Actual Remittance Found</span>
                  <span style={{ color: 'var(--text-primary)' }}>${data?.actual_payment?.toFixed(2) || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--danger)' }}>Total Audited Leakage ({data?.violation_type || 'N/A'})</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>${data?.difference?.toFixed(2) || (data?.actual_payment === 0 ? data?.expected_payment : '0.00')}</span>
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
