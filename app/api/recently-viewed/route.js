import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient, getServerUser } from '@/app/lib/config/supabaseServer'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError } = await getServerUser(cookieStore)

    if (userError) {
      return NextResponse.json(
        { error: 'Authentication failed', details: userError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient(cookieStore)
    const { user_id, type, item_id } = await request.json()

    if (!user_id || !type || !item_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['artist', 'club', 'event', 'festival']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    // Verify user can only track their own views
    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if this item was already viewed by this user
    const { data: existingView } = await supabase
      .from('recently_viewed')
      .select('id')
      .eq('user_id', user_id)
      .eq('type', type)
      .eq('item_id', item_id)
      .maybeSingle()

    if (existingView) {
      // Update the viewed_at timestamp
      const { error: updateError } = await supabase
        .from('recently_viewed')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existingView.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update view' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, action: 'updated' })
    }

    // Check how many items of this type the user has viewed
    const { count, error: countError } = await supabase
      .from('recently_viewed')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('type', type)

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json(
        { error: 'Failed to count views' },
        { status: 500 }
      )
    }

    // If user has 5 or more views, delete the oldest one to maintain a maximum of 6
    if (count >= 5) {
      const { data: oldestView } = await supabase
        .from('recently_viewed')
        .select('id')
        .eq('user_id', user_id)
        .eq('type', type)
        .order('viewed_at', { ascending: true })
        .limit(1)
        .single()

      if (oldestView) {
        await supabase
          .from('recently_viewed')
          .delete()
          .eq('id', oldestView.id)
      }
    }

    // Insert new view
    const { error: insertError } = await supabase
      .from('recently_viewed')
      .insert({
        user_id: user_id,
        type: type,
        item_id: item_id,
        viewed_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert view' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, action: 'inserted' })

  } catch (error) {
    console.error('Recently viewed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch recently viewed items with full data
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError } = await getServerUser(cookieStore)

    if (userError) {
      return NextResponse.json(
        { error: 'Authentication failed', details: userError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient(cookieStore)
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const type = searchParams.get('type')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user can only fetch their own views
    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recently viewed records
    let query = supabase
      .from('recently_viewed')
      .select('*')
      .eq('user_id', user_id)
      .order('viewed_at', { ascending: false })
      .limit(6)

    if (type) {
      query = query.eq('type', type)
    }

    const { data: recentViews, error } = await query

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch views' },
        { status: 500 }
      )
    }

    if (!recentViews || recentViews.length === 0) {
      return NextResponse.json({ 
        data: [],
        message: 'No recently viewed items'
      })
    }

    // Group by type
    const groupedByType = recentViews.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item.item_id)
      return acc
    }, {})

    // Fetch actual data for each type
    const fetchPromises = []
    const typeMap = new Map()

    // Fetch artists
    if (groupedByType.artist?.length) {
      const promise = supabase
        .from('artists')
        .select('id, name, stage_name, artist_image')
        .in('id', groupedByType.artist)
        .then(({ data }) => {
          if (data) {
            data.forEach(item => {
              typeMap.set(item.id, {
                id: item.id,
                name: item.stage_name || item.name,
                image: item.artist_image,
                href: `/artists/${item.id}`
              })
            })
          }
        })
      fetchPromises.push(promise)
    }

    // Fetch clubs
    if (groupedByType.club?.length) {
      const promise = supabase
        .from('clubs')
        .select('id, name, club_image')
        .in('id', groupedByType.club)
        .then(({ data }) => {
          if (data) {
            data.forEach(item => {
              typeMap.set(item.id, {
                id: item.id,
                name: item.name,
                image: item.club_image,
                href: `/club/${item.id}`
              })
            })
          }
        })
      fetchPromises.push(promise)
    }

    // Fetch events
    if (groupedByType.event?.length) {
      const promise = supabase
        .from('events')
        .select('id, event_name, event_image')
        .in('id', groupedByType.event)
        .then(({ data }) => {
          if (data) {
            data.forEach(item => {
              typeMap.set(item.id, {
                id: item.id,
                name: item.event_name,
                image: item.event_image,
                href: `/events/${item.id}`
              })
            })
          }
        })
      fetchPromises.push(promise)
    }

    // Fetch festivals
    if (groupedByType.festival?.length) {
      const promise = supabase
        .from('festivals')
        .select('id, name, poster')
        .in('id', groupedByType.festival)
        .then(({ data }) => {
          if (data) {
            data.forEach(item => {
              typeMap.set(item.id, {
                id: item.id,
                name: item.name,
                image: item.poster,
                href: `/festivals/${item.id}`
              })
            })
          }
        })
      fetchPromises.push(promise)
    }

    // Wait for all fetches to complete
    await Promise.all(fetchPromises)

    // Map the recently viewed items to include full data, maintaining order
    const fullData = recentViews
      .map(rv => typeMap.get(rv.item_id))
      .filter(Boolean) // Remove any items that weren't found

    return NextResponse.json({ 
      data: fullData,
      message: 'Recently viewed items fetched successfully'
    })

  } catch (error) {
    console.error('Recently viewed fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}