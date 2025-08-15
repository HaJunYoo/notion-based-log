import { getSupabaseClient } from './index'

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown'
  latency?: number
  error?: string
  timestamp: Date
  details?: {
    canConnect: boolean
    canQuery: boolean
    version?: string
  }
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    const supabase = getSupabaseClient()
    
    // Test basic connection with a simple query
    const { data, error, status } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      // If error is due to missing table, connection is still healthy
      if (error.code === '42P01') { // Table doesn't exist
        return {
          status: 'healthy',
          latency,
          timestamp: new Date(),
          details: {
            canConnect: true,
            canQuery: false, // Tables not created yet
          }
        }
      }
      
      return {
        status: 'unhealthy',
        latency,
        error: error.message,
        timestamp: new Date(),
        details: {
          canConnect: true,
          canQuery: false,
        }
      }
    }
    
    return {
      status: 'healthy',
      latency,
      timestamp: new Date(),
      details: {
        canConnect: true,
        canQuery: true,
      }
    }
  } catch (err) {
    const latency = Date.now() - startTime
    
    return {
      status: 'unhealthy',
      latency,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date(),
      details: {
        canConnect: false,
        canQuery: false,
      }
    }
  }
}

export async function performExtendedHealthCheck(): Promise<HealthCheckResult & { 
  tableStatus: { [tableName: string]: boolean }
}> {
  const basicHealth = await checkDatabaseHealth()
  const tables = ['posts', 'tasks', 'page_views']
  const tableStatus: { [tableName: string]: boolean } = {}
  
  if (basicHealth.status === 'healthy') {
    const supabase = getSupabaseClient()
    
    // Check each table individually
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
          .limit(1)
        
        tableStatus[table] = !error
      } catch {
        tableStatus[table] = false
      }
    }
  } else {
    tables.forEach(table => {
      tableStatus[table] = false
    })
  }
  
  return {
    ...basicHealth,
    tableStatus
  }
}

export function createHealthCheckMiddleware() {
  let lastHealthCheck: HealthCheckResult | null = null
  let lastCheckTime = 0
  const CACHE_DURATION = 30000 // 30 seconds
  
  return async function healthCheck(): Promise<HealthCheckResult> {
    const now = Date.now()
    
    // Return cached result if recent
    if (lastHealthCheck && (now - lastCheckTime) < CACHE_DURATION) {
      return lastHealthCheck
    }
    
    // Perform new health check
    const result = await checkDatabaseHealth()
    lastHealthCheck = result
    lastCheckTime = now
    
    return result
  }
}