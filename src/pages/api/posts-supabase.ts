import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseClient } from 'src/libs/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Supabase fetch failed',
    })
  }
}
