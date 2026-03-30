'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Package,
  Sparkles,
  Eye,
  Camera,
} from 'lucide-react'
import {
  addListing,
  updateListingPrice,
  toggleAvailability,
  deleteListing,
  seedInitialCatalog,
  updateProductImage,
} from '@/lib/actions/vendor'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  unit: string
  category_id: string | null
  image_url?: string | null
  categories: { name: string } | null
}

interface Listing {
  id: string
  price: number
  is_available: boolean
  stock_quantity: number
  last_updated: string
  product_id: string
  products: Product | null
}

interface Props {
  listings: Listing[]
  allProducts: Product[]
  categories: { id: string; name: string; icon: string | null }[]
  vendorId: string
  marketId: string
}

// ── Toast helper ─────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm font-bold shadow-lg text-white transition-all",
        type === 'success' ? "bg-green-700" : "bg-red-500"
      )}
    >
      {message}
    </div>
  )
}

// ── Inline price editor ───────────────────────────────────────────────

function InlinePriceEditor({
  listingId,
  initialPrice,
  onSuccess,
  onError,
}: {
  listingId: string
  initialPrice: number
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialPrice.toFixed(2))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      onError('Invalid price')
      return
    }
    setSaving(true)
    const result = await updateListingPrice(listingId, num)
    setSaving(false)
    if (result.error) {
      onError(result.error)
    } else {
      setEditing(false)
      onSuccess()
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800 transition-all font-serif italic"
      >
        ₱{Number(initialPrice).toFixed(2)}
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 text-sm">₱</span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="h-8 w-24 text-sm font-bold rounded-lg"
        autoFocus
      />
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-700 text-white hover:bg-green-800 transition-all disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Availability toggle ───────────────────────────────────────────────

function AvailabilityToggle({
  listingId,
  initial,
  onError,
}: {
  listingId: string
  initial: boolean
  onError: (msg: string) => void
}) {
  const [checked, setChecked] = useState(initial)
  const [pending, setPending] = useState(false)

  async function handleChange() {
    const next = !checked
    setChecked(next) // optimistic
    setPending(true)
    const result = await toggleAvailability(listingId, next)
    setPending(false)
    if (result.error) {
      setChecked(!next) // revert
      onError(result.error)
    }
  }

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={handleChange}
      disabled={pending}
      className={cn(
        "relative flex-shrink-0 w-10 h-5.5 rounded-full border-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
        checked ? 'bg-green-700 border-green-700' : 'bg-gray-200 border-gray-200',
        "disabled:opacity-60"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-150",
          checked ? 'translate-x-4.5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────

function DeleteDialog({
  listingId,
  productName,
  onDeleted,
}: {
  listingId: string
  productName: string
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteListing(listingId)
    setLoading(false)
    if (!result.error) {
      setOpen(false)
      onDeleted()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <DialogContent className="max-w-sm rounded-[2rem] p-8" aria-describedby="delete-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic text-gray-900 font-serif mb-2">Remove Listing?</DialogTitle>
          <DialogDescription id="delete-dialog-desc" className="text-gray-500 text-sm leading-relaxed">
            This will permanently remove <span className="font-bold text-gray-700">{productName}</span> from your public stall.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Delete Listing'}
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-full text-gray-500 h-12 font-medium"
            onClick={() => setOpen(false)}
          >
            Go Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Add listing dialog ────────────────────────────────────────────────

function AddListingDialog({
  vendorId,
  marketId,
  allProducts,
  categories,
  onAdded,
}: {
  vendorId: string
  marketId: string
  allProducts: Product[]
  categories: { id: string; name: string; icon: string | null }[]
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [productName, setProductName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stockQuantity, setStockQuantity] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    setIsSubmitting(true)

    const existingProduct = allProducts.find(
      (p) => p.name.toLowerCase() === productName.trim().toLowerCase()
    )

    let uploadedImageUrl: string | undefined = undefined
    if (file) {
      try {
        const supabase = createBrowserSupabase()
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(ext) ? ext : 'jpg'
        const path = `products/${vendorId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: false, contentType: file.type || `image/${safeExt}` })

        if (uploadError) throw uploadError
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
        uploadedImageUrl = pub.publicUrl
      } catch (err: any) {
        setServerError(`Upload issue: ${err.message}`)
        uploadedImageUrl = undefined
      }
    }

    const result = await addListing({
      vendor_id: vendorId,
      market_id: marketId,
      product_id: existingProduct?.id || productName,
      price: parseFloat(price),
      is_available: isAvailable,
      custom_product_name: existingProduct ? undefined : productName.trim(),
      custom_category_id: existingProduct ? undefined : categoryId,
      unit: unit,
      stock_quantity: parseInt(stockQuantity) || 0,
      image_url: existingProduct ? undefined : uploadedImageUrl,
    } as any)

    setIsSubmitting(false)

    if (result?.error) {
      setServerError(result.error)
    } else {
      setOpen(false)
      setProductName('')
      setCategoryId('')
      setPrice('')
      setStockQuantity('')
      setFile(null)
      onAdded()
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-full bg-green-700 hover:bg-green-800 text-white px-6 h-11 text-sm font-bold transition-all shadow-lg shadow-green-700/20 gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Listing
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden" aria-describedby="add-listing-desc">
          <div className="px-10 pt-10 pb-6 border-b border-gray-50 bg-white">
            <h2 className="text-3xl font-black italic text-green-700 font-serif leading-none">Add Product</h2>
            <p id="add-listing-desc" className="text-sm text-gray-500 mt-2 font-medium">
              Update your market stall catalog with new offerings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8 bg-white overflow-y-auto max-h-[70vh] no-scrollbar pt-6">
            {serverError && (
              <div className="p-4 bg-red-50 text-red-600 font-bold text-xs rounded-2xl border border-red-100">
                {serverError}
              </div>
            )}

            {/* Product Image Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Product Visual</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50/40 transition-all group relative overflow-hidden"
              >
                  {previewUrl && (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  )}
                  <div className={cn("relative z-10 flex flex-col items-center justify-center p-4", previewUrl && "bg-black/30 inset-0 absolute backdrop-blur-[2px]")}>
                    <Camera className={cn("w-8 h-8 mb-3 transition-all", previewUrl ? "text-white" : "text-gray-400 group-hover:scale-110 group-hover:text-green-700")} />
                    <p className={cn("text-xs font-black uppercase tracking-wider", previewUrl ? "text-white" : "text-gray-900")}>
                      {file ? 'Change Photo' : 'Upload Product Photo'}
                    </p>
                    {!file && <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or WebP (Max 5MB)</p>}
                  </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Name</label>
                <Input
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g., Organic Tuna"
                  className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-5 font-bold text-sm"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Category</label>
                <div className="relative">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-gray-50/50 border border-gray-100 focus:border-green-700 focus:bg-white text-sm font-bold px-5 pr-12 outline-none appearance-none transition-all"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Price per unit</label>
                <div className="flex bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:border-green-700 focus-within:bg-white h-12 transition-all">
                   <div className="pl-5 pr-1 flex items-center text-gray-400 font-black text-sm">₱</div>
                   <Input
                     required
                     type="number"
                     step="0.01"
                     value={price}
                     onChange={e => setPrice(e.target.value)}
                     className="bg-transparent border-0 focus-visible:ring-0 px-1 font-black text-sm h-full w-full"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Pricing Unit</label>
                <div className="flex gap-1 p-1 bg-gray-50/50 rounded-2xl border border-gray-100 h-12">
                  <button
                    type="button"
                    onClick={() => setUnit('kg')}
                    className={cn(
                      "flex-1 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all",
                      unit === 'kg' ? "bg-white text-green-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('unit')}
                    className={cn(
                      "flex-1 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all",
                      unit === 'unit' ? "bg-white text-green-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    PCS
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#f0f7f0] rounded-[2rem] border border-green-100/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Eye className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-black text-green-900 leading-tight">Live on Market</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-tight mt-0.5">Visible to public</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={cn(
                  "relative w-12 h-6.5 rounded-full transition-colors",
                  isAvailable ? 'bg-green-700' : 'bg-gray-300'
                )}
              >
                <div className={cn("absolute top-1 left-1 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-sm", isAvailable && "translate-x-5.5")} />
              </button>
            </div>

            <div className="pt-4 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-14 font-black uppercase text-xs tracking-widest text-gray-400 rounded-full hover:bg-gray-50">
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-full bg-green-700 hover:bg-green-800 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-green-700/20">
                {isSubmitting ? 'Processing...' : 'Add Listing'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function ProductsManager({ listings: initialListings, allProducts, categories, vendorId, marketId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const listingCategories = Array.from(
    new Set(initialListings.map((l) => l.products?.categories?.name ?? 'Other'))
  ).sort()

  const filtered = initialListings.filter((l) => {
    const matchSearch = search === '' || (l.products?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || (l.products?.categories?.name ?? 'Other') === activeCategory
    return matchSearch && matchCat
  })

  function relTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stall catalog..."
            className="h-12 pl-12 rounded-full bg-white border-gray-100 shadow-sm border focus-visible:ring-green-700 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-4">
          <AddListingDialog
            vendorId={vendorId}
            marketId={marketId}
            allProducts={allProducts}
            categories={categories}
            onAdded={() => router.refresh()}
          />
        </div>
      </div>

      {/* Enhanced Category Pills */}
      {listingCategories.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {['all', ...listingCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border",
                activeCategory === cat
                  ? "bg-green-700 text-white border-green-700 shadow-lg shadow-green-700/10"
                  : "bg-white text-gray-500 border-gray-100 hover:border-green-200 hover:text-green-700"
              )}
            >
              {cat === 'all' ? 'Everything' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {initialListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-10">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black italic text-gray-900 font-serif mb-2">Inventory is Empty</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-10 leading-relaxed font-medium">Add your first product listing to start selling to the Butuan community.</p>
            
            <div className="flex flex-col gap-4">
                <AddListingDialog
                    vendorId={vendorId}
                    marketId={marketId}
                    allProducts={allProducts}
                    categories={categories}
                    onAdded={() => router.refresh()}
                />
                
                {allProducts.length === 0 && (
                <Button 
                    variant="ghost"
                    className="text-amber-600 hover:bg-amber-50 h-11 px-6 rounded-full font-bold text-xs uppercase tracking-widest gap-2"
                    onClick={async () => {
                    const res = await seedInitialCatalog()
                    if (res.success) router.refresh()
                    else alert(res.error)
                    }}
                >
                    <Sparkles className="w-4 h-4" />
                    Seed Catalog
                </Button>
                )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/40 hover:bg-gray-50/40 border-b border-gray-100">
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest pl-10 py-6">Product Item</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Price</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Live</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Updated</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest text-right pr-10 py-6">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-sm text-gray-400 font-medium">
                      No matching products in this category.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((listing) => (
                    <TableRow key={listing.id} className="group hover:bg-[#f0f7f0]/40 transition-colors border-b border-gray-50 last:border-0">
                      <TableCell className="pl-10 py-5">
                        <div className="flex items-center gap-5">
                          <div className="relative w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 shadow-sm">
                             {listing.products?.image_url ? (
                               <Image src={listing.products.image_url} alt={listing.products.name} fill className="object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <Package className="w-6 h-6 text-gray-300" />
                               </div>
                             )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-sm">{listing.products?.name ?? '—'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-[#f0f7f0] text-green-700 border-0 text-[10px] font-black uppercase tracking-tighter px-2 h-5">
                                    {listing.products?.categories?.name ?? 'Other'}
                                </Badge>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    {listing.products?.unit ?? 'UNIT'}
                                </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlinePriceEditor
                          listingId={listing.id}
                          initialPrice={listing.price}
                          onSuccess={() => { showToast('Price synchronized!', 'success'); router.refresh() }}
                          onError={(msg) => showToast(msg, 'error')}
                        />
                      </TableCell>
                      <TableCell>
                        <AvailabilityToggle
                          listingId={listing.id}
                          initial={listing.is_available}
                          onError={(msg) => showToast(msg, 'error')}
                        />
                      </TableCell>
                      <TableCell className="text-[11px] text-gray-400 font-bold uppercase tracking-tight whitespace-nowrap">
                        {relTime(listing.last_updated)}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-1">
                            <DeleteDialog
                                listingId={listing.id}
                                productName={listing.products?.name || 'item'}
                                onDeleted={() => { showToast('Listing removed', 'success'); router.refresh() }}
                            />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
