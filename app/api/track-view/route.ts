import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Track view API called')
    
    const body = await request.json()
    console.log('📊 Request body:', body)
    
    const { type, id } = body

    if (!type || !id) {
      console.log('📊 Missing type or id')
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    if (type !== 'ad' && type !== 'blog') {
      console.log('📊 Invalid type:', type)
      return NextResponse.json({ error: 'Invalid type. Must be "ad" or "blog"' }, { status: 400 })
    }

    // Get client IP for basic tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    console.log(`📊 Tracking view for ${type} ${id} from IP ${clientIP}`)

    // Increment view count using a simple approach
    const tableName = type === 'ad' ? 'ad_listings' : 'blog_posts'
    
    // First get current view counts
    const selectFields = type === 'ad' ? 'total_views, today_views' : 'view_count'
    const { data: currentData, error: fetchError } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching current view count:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch current view count' }, { status: 500 })
    }

    // Update with incremented values
    const updateFields = type === 'ad' 
      ? { 
          total_views: (currentData.total_views || 0) + 1,
          today_views: (currentData.today_views || 0) + 1
        }
      : { 
          view_count: (currentData.view_count || 0) + 1
        }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateFields)
      .eq('id', id)
      .select(selectFields)
      .single()

    if (error) {
      console.error('Error updating view count:', error)
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 })
    }

    console.log(`📊 View tracked successfully: ${type} ${id}`)

    const response = type === 'ad' 
      ? { 
          success: true, 
          totalViews: data.total_views,
          todayViews: data.today_views 
        }
      : { 
          success: true, 
          viewCount: data.view_count
        }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in track-view API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
