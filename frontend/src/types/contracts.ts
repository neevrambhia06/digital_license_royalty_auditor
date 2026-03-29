export interface Contract {
  contract_id: string
  content_id: string
  studio: string
  royalty_rate: number
  rate_per_play: number
  territory: string[]
  start_date: string
  end_date: string
  tier_threshold: number
  tier_rate: number
  created_at?: string
}

export interface ContractSummary {
  contract_id: string
  content_id: string
  studio: string
  rate_per_play: number
  territory: string[]
  end_date: string
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED'
  summary_text: string
}

export type ContractStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED'

export interface ContractFilters {
  search: string
  studio: string | null
  territories: string[]
  status: ContractStatus | null
}

export interface AgentTrace {
  trace_id: string
  run_id: string
  agent_name: string
  action: string
  input_summary: string | null
  output_summary: string | null
  duration_ms: number | null
  status: 'running' | 'completed' | 'error'
  timestamp?: string
}
