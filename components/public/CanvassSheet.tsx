'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ShoppingBasket,
  Trash2,
  ArrowRight,
  Search,
  Plus,
  Check,
  X,
  PlusCircle,
  Package,
  Store,
  Loader2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { addToCanvass, removeFromCanvass, clearCanvass, updateCanvassQuantity } from '@/lib/actions/canvass'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProductSearchResult {
  id: string
  name: string
  category: {
    name: string
  } | null
}

function getCategoryColor(name: string | undefined): string {
  if (!name) return 'bg-gray-100 text-gray-600'
  const lowerName = name.toLowerCase()
  if (lowerName === 'fruits') return 'bg-orange-100 text-orange-700'
  if (lowerName === 'vegetables') return 'bg-green-100 text-green-700'
  if (lowerName === 'meat' || lowerName === 'meats') return 'bg-red-100 text-red-700'
  if (lowerName === 'seafood') return 'bg-blue-100 text-blue-700'
  if (lowerName === 'rice' || lowerName === 'rice and grains' || lowerName === 'rice & grains') return 'bg-yellow-100 text-yellow-700'
  if (lowerName === 'dry goods') return 'bg-gray-100 text-gray-600'
  if (lowerName === 'condiments') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

export default function CanvassSheet({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [listId, setListId] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  // Local quantity state: itemId -> qty string so user can type decimals freely
  const [editingQty, setEditingQty] = useState<Record<string, string>>({})
  const qtyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Stable supabase client ref — prevents stale closures in Realtime subscriptions
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const router = useRouter()

  // Track resolved userId & listId in refs for use inside Realtime callbacks
  const userIdRef = useRef<string | null>(null)
  const listIdRef = useRef<string | null>(null)

  const fetchCanvassData = useCallback(async (userId: string) => {
    try {
      // 1. Get the profile for this user
      console.log('[CANVASS] Fetching data for userId:', userId)
      const { data: profile, error: profileError } = await supabase
        .from('buyer_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('[CANVASS] Profile fetch error:', profileError)
        return
      }

      if (!profile) {
        console.warn('[CANVASS] No buyer profile found for user:', userId)
        return
      }

      // 2. Get or create the canvass list using the profile ID
      let { data: list, error: listFetchError } = await supabase
        .from('canvass_lists')
        .select('id')
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (listFetchError) {
        console.error('[CANVASS] List fetch error:', listFetchError)
        return
      }

      if (!list) {
        console.log('[CANVASS] Creating list for profile:', profile.id)
        const { data: newList, error: createError } = await supabase
          .from('canvass_lists')
          .insert({ buyer_id: profile.id, name: 'My Canvass List' })
          .select('id')
          .maybeSingle()
          
        if (createError) {
           console.error('[CANVASS] Error creating canvass list:', createError)
           return
        }
        if (!newList) {
          console.error('[CANVASS] List creation returned no data')
          return
        }
        list = newList
      }

      if (list) {
        console.log('[CANVASS] Using list:', list.id)
        setListId(list.id)
        listIdRef.current = list.id

        const { data: canvassItems, error: itemsError } = await supabase
          .from('canvass_items')
          .select(`
            id,
            product_id,
            quantity,
            products:product_id (
              name,
              unit,
              category_id,
              categories:category_id (
                name
              )
            )
          `)
          .eq('canvass_list_id', list.id)

        if (itemsError) {
          console.error('[CANVASS] Items fetch error:', itemsError)
        }

        if (canvassItems) {
          const itemsWithPrice = await Promise.all(canvassItems.map(async (item: any) => {
            const { data: listings } = await supabase
              .from('price_listings')
              .select(`
                price,
                market_id,
                markets:market_id (
                  name
                )
              `)
              .eq('product_id', item.product_id)
              .eq('is_available', true)
              .order('price', { ascending: true })
              .limit(1)

            const cheapest = listings && listings.length > 0 ? {
              price: listings[0].price,
              market_name: Array.isArray((listings[0] as any).markets) ? (listings[0] as any).markets[0]?.name : (listings[0] as any).markets?.name
            } : null

            return { ...item, cheapest }
          }))
          setItems(itemsWithPrice)
          // Seed local qty state from DB values
          setEditingQty(prev => {
            const next = { ...prev }
            itemsWithPrice.forEach((item: any) => {
              if (!(item.id in next)) next[item.id] = String(item.quantity ?? 1)
            })
            return next
          })
        }
      }
    } catch (error) {
      console.error('Error fetching canvass data:', error)
    }
  }, [supabase])

  // ── Initial load + Realtime subscription ──────────────────────────────────
  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (!session?.user?.id) return

      const userId = session.user.id
      userIdRef.current = userId
      
      // Get profile ID for realtime filter
      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!profile) {
        // Still try fetching data (it will log warning)
        await fetchCanvassData(userId)
        return
      }

      await fetchCanvassData(userId)

      // Subscribe to canvass_items changes for this user's list.
      // Only react to INSERT and DELETE — qty UPDATE events are handled
      // locally in state to avoid collapsing the basket on every keystroke.
      realtimeChannel = supabase
        .channel('canvass-items-realtime')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'canvass_items',
            filter: `buyer_id=eq.${profile.id}`
          },
          () => {
            if (userIdRef.current) fetchCanvassData(userIdRef.current)
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'canvass_items',
            filter: `buyer_id=eq.${profile.id}`
          },
          () => {
            if (userIdRef.current) fetchCanvassData(userIdRef.current)
          }
        )
        .subscribe()
    }

    init()

    // Also listen to the custom cross-component event dispatched when adding from
    // ProductCard, Navbar, SearchResultsGrid, etc. — zero-refresh UX.
    const handleExternalAdd = () => {
      if (userIdRef.current) fetchCanvassData(userIdRef.current)
    }
    window.addEventListener('canvass:updated', handleExternalAdd)

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel)
      window.removeEventListener('canvass:updated', handleExternalAdd)
    }
  }, [supabase, fetchCanvassData])

  // Debounced quantity save
  const handleQtyChange = (itemId: string, raw: string) => {
    setEditingQty(prev => ({ ...prev, [itemId]: raw }))
    if (qtyTimers.current[itemId]) clearTimeout(qtyTimers.current[itemId])
    qtyTimers.current[itemId] = setTimeout(async () => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed <= 0) return
      await updateCanvassQuantity(itemId, parsed)
      // Update local items so total recalculates immediately
      setItems(prev => prev.map(it => it.id === itemId ? { ...it, quantity: parsed } : it))
    }, 600)
  }

  const bestMarket = useMemo(() => {
    if (items.length === 0) return null
    const marketStats: Record<string, { count: number, total: number }> = {}
    items.forEach(item => {
      if (item.cheapest) {
        const qty = parseFloat(editingQty[item.id] ?? String(item.quantity ?? 1)) || 1
        const market = item.cheapest.market_name
        if (!marketStats[market]) {
          marketStats[market] = { count: 0, total: 0 }
        }
        marketStats[market].count += 1
        marketStats[market].total += item.cheapest.price * qty
      }
    })
    const markets = Object.entries(marketStats)
    if (markets.length === 0) return null
    markets.sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count
      return a[1].total - b[1].total
    })
    return {
      name: markets[0][0],
      count: markets[0][1].count,
      total: markets[0][1].total
    }
  }, [items, editingQty])

  const handleRemove = async (itemId: string) => {
    const res = await removeFromCanvass(itemId)
    if (res.status === 'success' && session?.user) {
      fetchCanvassData(session.user.id)
      window.dispatchEvent(new CustomEvent('canvass:updated'))
    }
  }

  const handleClearAll = async () => {
    if (listId && session?.user) {
      if (confirm('Are you sure you want to clear your entire canvass list?')) {
        await clearCanvass(listId)
        fetchCanvassData(session.user.id)
        window.dispatchEvent(new CustomEvent('canvass:updated'))
      }
    }
  }

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      const { data } = await supabase
        .from('products')
        .select('id, name, categories(name)')
        .ilike('name', `%${searchQuery}%`)
        .limit(10)

      setSearchResults((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: Array.isArray(p.categories) ? p.categories[0] : p.categories
      })))
      setIsSearching(false)
    }
    const timer = setTimeout(searchProducts, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  const handleAddProduct = async (productId: string) => {
    if (!session?.user) return
    setAddingId(productId)
    const res = await addToCanvass(productId)
    setAddingId(null)
    if (res.status === 'success' || res.status === 'already_exists') {
      fetchCanvassData(session.user.id)
      if (res.status === 'success') {
        setSearchQuery('')
        setIsProductSearchOpen(false)
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px] p-0 flex flex-col bg-white dark:bg-[#0d0d0d] border-none shadow-2xl transition-colors duration-500">
        <SheetHeader className="sr-only">
          <SheetTitle>Canvass Basket</SheetTitle>
          <SheetDescription>Your product canvass list for price comparison across market hubs.</SheetDescription>
        </SheetHeader>

        {/* Header */}
        <div className="p-8 border-b dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-black/20 backdrop-blur-3xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-green-700/10 dark:bg-green-500/10 p-3 rounded-2xl">
              <ShoppingBasket className="w-6 h-6 text-green-700 dark:text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Basket List</h2>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{items.length} Product Estimates</p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-all"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-12 text-center gap-6 opacity-80">
              <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[3rem] shadow-inner">
                <ShoppingBasket className="w-16 h-16 text-gray-200 dark:text-green-950" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Your basket is empty</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight leading-relaxed">Add items to compare market prices across Butuan City.</p>
              </div>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  router.push('/markets')
                }}
                className="mt-4 bg-green-700 hover:bg-green-800 text-white rounded-full px-10 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/10 active:scale-95 transition-all"
              >
                Start Browsing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const qty = parseFloat(editingQty[item.id] ?? String(item.quantity ?? 1)) || 1
                const unitPrice = item.cheapest?.price ?? 0
                const totalPrice = unitPrice * qty
                const unit = item.products?.unit || 'unit'
                const catName = Array.isArray(item.products?.categories)
                  ? item.products?.categories[0]?.name
                  : item.products?.categories?.name

                return (
                  <div key={item.id} className="p-5 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                            {item.products?.name}
                          </h4>
                        </div>
                        <Badge variant="secondary" className={cn(
                          "text-[8px] h-5 px-2 font-black uppercase tracking-[0.1em] border-none rounded-lg shadow-sm",
                          getCategoryColor(catName)
                        )}>
                          {catName}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity editor */}
                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Quantity ({unit})</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newQty = Math.max(0.25, parseFloat(editingQty[item.id] ?? '1') - 0.25)
                              handleQtyChange(item.id, String(Math.round(newQty * 100) / 100))
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center font-black text-gray-700 dark:text-white transition-all active:scale-90 text-sm"
                          >−</button>
                          <input
                            type="number"
                            min="0.01"
                            step="0.25"
                            value={editingQty[item.id] ?? '1'}
                            onChange={e => handleQtyChange(item.id, e.target.value)}
                            className="w-16 text-center font-black text-gray-900 dark:text-white bg-transparent border-none outline-none text-sm"
                          />
                          <button
                            onClick={() => {
                              const newQty = parseFloat(editingQty[item.id] ?? '1') + 0.25
                              handleQtyChange(item.id, String(Math.round(newQty * 100) / 100))
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center font-black text-gray-700 dark:text-white transition-all active:scale-90 text-sm"
                          >+</button>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.cheapest ? (
                          <>
                            <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Est. Total</div>
                            <div className="text-lg font-black text-green-700 dark:text-green-500 tracking-tighter italic">
                              ₱{totalPrice % 1 === 0 ? totalPrice.toLocaleString() : totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[8px] text-gray-400 font-bold">
                              ₱{unitPrice}/{unit} @ {item.cheapest.market_name}
                            </div>
                          </>
                        ) : (
                          <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest">No price yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {bestMarket && (
                <div className="pt-6">
                  <div className="bg-green-700 dark:bg-green-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-green-950/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                       <Store className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[11px] font-black text-green-200/60 uppercase tracking-[0.2em] mb-2">Smart recommendation</p>
                      <h4 className="text-2xl font-black uppercase tracking-tight leading-none mb-6">Explore {bestMarket.name}</h4>

                      <div className="space-y-3 mb-8">
                        <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-md">
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-100">Market Coverage</span>
                          <span className="text-sm font-black tracking-tight">{bestMarket.count} / {items.length} items</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-md">
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-100">Estimated Total</span>
                          <span className="text-lg font-black tracking-tight">₱{bestMarket.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="w-full bg-white text-green-700 hover:bg-green-50 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl group/btn"
                        onClick={() => onOpenChange(false)}
                      >
                        <Link href="/compare">
                          Full Market Comparison
                          <ArrowRight className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Add Floating Button */}
        <div className="p-8 bg-white dark:bg-[#0d0d0d] border-t dark:border-white/5 sticky bottom-0 z-10 flex flex-col gap-4">
          <Dialog open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
            <DialogTrigger asChild>
              <Button disabled={!session} className="w-full bg-gray-900 dark:bg-green-600 hover:bg-black dark:hover:bg-green-700 text-white rounded-2xl h-16 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-green-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                <PlusCircle className="w-5 h-5 shadow-lg" />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-[480px] overflow-hidden border-none shadow-3xl dark:bg-[#121212] rounded-[3rem]" aria-describedby={undefined}>
              <div className="p-8 bg-green-800 dark:bg-green-900 text-white flex flex-col gap-2">
                <DialogTitle className="text-3xl font-black uppercase tracking-tight">Search Supply</DialogTitle>
                <DialogDescription className="text-[11px] font-black text-green-300 uppercase tracking-widest border-none"> Instant lookup across all markets</DialogDescription>
              </div>
              <div className="flex flex-col gap-6 p-8">
                <div className="relative">
                  <label htmlFor="canvass-search" className="sr-only">Search for products</label>
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="canvass-search"
                    name="search-query"
                    placeholder="E.g. Chicken, Rice, Mango..."
                    className="h-16 pl-14 pr-8 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:bg-white dark:focus:bg-[#222] dark:text-white font-bold transition-all text-sm placeholder:text-gray-300 dark:placeholder:text-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {isSearching ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                      <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">Looking up supplies</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((p) => {
                      const isAdded = items.some(item => item.product_id === p.id)
                      const isWorking = addingId === p.id
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border border-transparent transition-all group",
                            isAdded ? "bg-gray-50 dark:bg-white/5 opacity-50" : "bg-gray-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-green-100 hover:shadow-xl cursor-pointer"
                          )}
                          onClick={() => !isAdded && !isWorking && handleAddProduct(p.id)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                             <div className="w-10 h-10 bg-white dark:bg-black/20 rounded-xl flex items-center justify-center shadow-sm">
                                <Package className="w-5 h-5 text-gray-200 dark:text-gray-800 group-hover:text-green-700 transition-colors" />
                             </div>
                             <div className="min-w-0">
                               <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{p.name}</div>
                               <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{p.category?.name}</div>
                             </div>
                          </div>
                          {isAdded ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">
                              In Basket
                            </Badge>
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-green-600 flex items-center justify-center text-green-700 dark:text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                              {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : searchQuery.length > 0 ? (
                    <div className="py-20 text-center opacity-30">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">No supplies found</span>
                    </div>
                  ) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                       <Search className="w-12 h-12" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enter product name</span>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
