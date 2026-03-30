import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options))
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Redirect bare /dashboard → /vendor/dashboard
    if (request.nextUrl.pathname === '/dashboard' ||
        request.nextUrl.pathname.startsWith('/dashboard/')) {
        const url = request.nextUrl.clone()
        url.pathname = request.nextUrl.pathname.replace('/dashboard', '/vendor/dashboard')
        return NextResponse.redirect(url)
    }

    // Protect only specific private routes
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/vendor') ||
                             request.nextUrl.pathname.startsWith('/admin');

    if (!user && isDashboardRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('message', 'Please sign in to access this area')
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}