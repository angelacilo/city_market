'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import NextImage from 'next/image'
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
  Coins,
} from 'lucide-react'
import {
  addListing,
  updateListing,
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
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(27,107,62,0.3)] text-white transition-all backdrop-blur-xl border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500",
        type === 'success' ? "bg-[#1b6b3e]/90 dark:bg-green-600/90" : "bg-red-600/90"
      )}
    >
      <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
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
        className="group flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white hover:text-[#1b6b3e] dark:hover:text-green-500 transition-all font-serif italic"
      >
        <span className="text-gray-300 dark:text-gray-800 text-sm normal-case not-italic mr-0.5">₱</span>
        {Number(initialPrice).toFixed(2)}
        <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-y-0.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-xs font-black text-gray-400 dark:text-gray-700">₱</span>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="h-12 w-32 pl-10 pr-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border-none font-black text-sm text-gray-900 dark:text-white shadow-inner"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#1b6b3e] dark:bg-green-600 text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20 active:scale-90"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.03] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
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
        "relative flex-shrink-0 w-14 h-7.5 rounded-full transition-all duration-500 focus:outline-none shadow-inner",
        checked ? 'bg-[#1b6b3e] dark:bg-green-600' : 'bg-gray-200 dark:bg-white/10',
        "disabled:opacity-60"
      )}
    >
      <div
        className={cn(
          "absolute top-1 left-1 w-5.5 h-5.5 rounded-full bg-white shadow-xl transition-all duration-500",
          checked ? 'translate-x-[1.625rem]' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ── Edit listing dialog ───────────────────────────────────────────────

function EditListingDialog({
  listing,
  categories,
  onUpdated,
}: {
  listing: Listing
  categories: { id: string; name: string; icon: string | null }[]
  onUpdated: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)

  // Product info
  const [productName, setProductName] = useState(listing.products?.name || '')
  const [categoryId, setCategoryId] = useState(listing.products?.category_id || '')
  const [unit, setUnit] = useState(listing.products?.unit || 'kg')

  // Listing info
  const [price, setPrice] = useState(listing.price.toString())
  const [stockQuantity, setStockQuantity] = useState(listing.stock_quantity.toString())
  const [isAvailable, setIsAvailable] = useState(listing.is_available)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(listing.products?.image_url || '')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(listing.products?.image_url || '')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, listing.products?.image_url])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    let updatedImageUrl = listing.products?.image_url
    if (file) {
      try {
        const supabase = createBrowserSupabase()
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `products/updates/${listing.product_id}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file)

        if (!uploadError) {
          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
          updatedImageUrl = pub.publicUrl
          // Update master product image
          await updateProductImage(listing.product_id, updatedImageUrl)
        }
      } catch (err) {
        console.error('Image update failed', err)
      }
    }

    const result = await updateListing(listing.id, {
      price: parseFloat(price),
      is_available: isAvailable,
      stock_quantity: parseInt(stockQuantity) || 0,
      product_id: listing.product_id,
      name: productName.trim(),
      category_id: categoryId,
      unit: unit,
      image_url: updatedImageUrl || undefined,
    })
    setIsSubmitting(false)
    if (result.success) {
      setOpen(false)
      onUpdated('Listing updated!')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 flex items-center justify-center rounded-2xl text-gray-400 dark:text-gray-700 hover:text-[#1d631d] dark:hover:text-green-500 hover:bg-[#f0f7f0] dark:hover:bg-white/[0.03] border-2 border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all active:scale-95"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <DialogContent 
        className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.4)] dark:shadow-none bg-white dark:bg-[#050a05]"
      >
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight font-serif italic uppercase leading-none mb-1">Edit <span className="text-[#1b6b3e] dark:text-green-500">Product</span></h2>
                <p className="text-[8px] text-gray-400 dark:text-gray-700 font-black uppercase tracking-[0.2em]">Update your item details and availability</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Product Name</label>
                <Input
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-12 px-6 font-black text-xs text-gray-900 dark:text-white shadow-inner transition-all placeholder:text-gray-300 dark:placeholder:text-gray-800"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Category</label>
                <div className="relative">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-12 rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] px-6 font-black text-xs text-gray-900 dark:text-white outline-none appearance-none cursor-pointer transition-all shadow-inner"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#050a05]">{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-3.5 h-3.5 text-[#1b6b3e] dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[7.5px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Product Image</label>
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
                className="w-full h-40 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-white/[0.03] bg-gray-50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-all group relative overflow-hidden"
              >
                {previewUrl ? (
                  <>
                    <NextImage src={previewUrl} alt="Preview" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                      <div className="flex flex-col items-center scale-90 group-hover:scale-100 transition-transform">
                        <Camera className="w-6 h-6 text-white mb-2" />
                        <span className="text-white text-[8px] font-black uppercase tracking-[0.2em]">Change Image</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-6 h-6 text-gray-300 dark:text-gray-800 mb-2" />
                    <span className="text-[8px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em]">No image uploaded<br/>Click to upload product image</span>
                  </div>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Price</label>
                <div className="flex items-center h-12 rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus-within:bg-white dark:focus-within:bg-white/[0.05] pl-6 pr-2 transition-all shadow-inner">
                  <span className="text-sm font-black text-gray-300 dark:text-gray-800 mr-2.5 font-serif">₱</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-black text-xs text-gray-900 dark:text-white min-w-[30px] placeholder:text-gray-300 dark:placeholder:text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                  />
                  <div className="flex items-center ml-2 bg-gray-100 dark:bg-white/[0.05] p-0.5 rounded-lg gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => setUnit('kg')} className={cn("text-[6.5px] font-black uppercase tracking-widest transition-all h-6 px-2 rounded-md border border-transparent", unit === 'kg' ? "bg-white dark:bg-green-500 shadow-sm text-[#1b6b3e] dark:text-white" : "text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400")}>KG</button>
                    <button type="button" onClick={() => setUnit('unit')} className={cn("text-[6.5px] font-black uppercase tracking-widest transition-all h-6 px-2 rounded-md border border-transparent", unit === 'unit' ? "bg-white dark:bg-green-500 shadow-sm text-[#1b6b3e] dark:text-white" : "text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400")}>UNIT</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Current Stock</label>
                <Input
                  required
                  type="number"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  className="rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-12 px-6 font-black text-xs text-gray-900 dark:text-white shadow-inner transition-all placeholder:text-gray-300 dark:placeholder:text-gray-800 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#f0f7f0] dark:bg-green-500/5 rounded-[2rem] border border-[#e1eae1] dark:border-green-500/10 transition-colors shadow-inner">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0a0f0a] flex items-center justify-center shadow-lg border border-green-100/50 dark:border-green-500/20">
                  <Eye className="w-6 h-6 text-[#1b6b3e] dark:text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight font-serif italic uppercase tracking-tight">Show to Customers</p>
                  <p className="text-[8px] font-black text-gray-500 dark:text-gray-700 mt-0.5 uppercase tracking-[0.2em]">Visible to everyone browsing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={cn(
                  "relative w-16 h-8.5 rounded-full transition-all duration-500 shadow-inner",
                  isAvailable ? 'bg-[#1b6b3e] dark:bg-green-600' : 'bg-gray-200 dark:bg-white/10'
                )}
              >
                <div className={cn("absolute top-1.5 left-1.5 bg-white w-5.5 h-5.5 rounded-full transition-transform duration-500 shadow-xl", isAvailable && "translate-x-7.5")} />
              </button>
            </div>
          </div>

          <div className="p-8 pt-6 flex items-center justify-end gap-6 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 transition-colors">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-10 h-12 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[9px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(27,107,62,0.3)] dark:shadow-[0_0_40px_rgba(27,107,62,0.2)] transition-all active:scale-95"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
        className="h-10 w-10 flex items-center justify-center rounded-2xl text-gray-400 dark:text-gray-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 border-2 border-transparent hover:border-red-100 dark:hover:border-red-500/10 transition-all active:scale-95"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <DialogContent className="max-w-md rounded-[3.5rem] p-12 bg-white dark:bg-[#050a05] border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.4)] dark:shadow-none overflow-hidden" aria-describedby="delete-dialog-desc">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600/50 shadow-[0_4px_15px_rgba(220,38,38,0.3)]" />
        <DialogHeader className="pt-4">
          <DialogTitle className="text-3xl font-black text-gray-900 dark:text-white mb-4 font-serif italic tracking-tight uppercase leading-none">Purge <span className="text-red-600">Entity?</span></DialogTitle>
          <DialogDescription id="delete-dialog-desc" className="text-gray-400 dark:text-gray-700 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
            Irreversible deletion Protocol initiated for <span className="text-[#1b6b3e] dark:text-green-500">{productName}</span>. This will permanently detach the node from the commerce storefront.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 mt-12">
          <Button
            className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-[0.3em] h-16 shadow-xl shadow-red-900/40 active:scale-95"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Executing Purge...' : 'Confirm Destruction'}
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-2xl text-gray-400 dark:text-gray-800 hover:text-gray-900 dark:hover:text-white h-16 font-black uppercase tracking-[0.4em] text-[10px] transition-all"
            onClick={() => setOpen(false)}
          >
            Retain Record
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

    if (existingProduct && uploadedImageUrl && !existingProduct.image_url) {
      await updateProductImage(existingProduct.id, uploadedImageUrl)
    }

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
        className="rounded-[1.5rem] bg-[#1b6b3e] dark:bg-green-600 hover:bg-[#155430] dark:hover:bg-green-700 text-white px-10 h-12 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_50px_rgba(27,107,62,0.3)] dark:shadow-[0_0_40px_rgba(27,107,62,0.2)] gap-3 active:scale-95"
      >
        <Plus className="w-5 h-5" />
        Add New Product
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.4)] dark:shadow-none bg-white dark:bg-[#050a05]"
        >
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="px-8 pt-6 pb-0">
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white tracking-tight font-serif italic uppercase leading-none mb-1">Add New <span className="text-[#1b6b3e] dark:text-green-500">Product</span></DialogTitle>
              <DialogDescription id="add-listing-desc" className="text-[8px] text-gray-400 dark:text-gray-700 font-black uppercase tracking-[0.2em]">List a new item in your stall's inventory</DialogDescription>
            </div>

            {serverError && (
              <div className="mx-12 mt-6 p-4 bg-red-500/10 text-red-500 font-black text-[10px] rounded-2xl border border-red-500/20 uppercase tracking-[0.2em]">
                System Error: {serverError}
              </div>
            )}

            <div className="px-8 py-8 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Product Image</label>
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
                  className="w-full h-40 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-white/[0.03] bg-gray-50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-all group relative overflow-hidden"
                >
                  {previewUrl && (
                    <NextImage src={previewUrl} alt="Preview" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className={cn("relative z-10 flex flex-col items-center justify-center p-4", previewUrl && "bg-black/40 inset-0 absolute backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all")}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-500", previewUrl ? "bg-white/20 scale-90 group-hover:scale-100" : "bg-green-100 dark:bg-green-500/10")}>
                      <Camera className={cn("w-6 h-6", previewUrl ? "text-white" : "text-[#1b6b3e] dark:text-green-500")} />
                    </div>
                    <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", previewUrl ? "text-white" : "text-gray-400 dark:text-gray-700")}>
                      {file ? 'Change Image' : 'Upload product image'}
                    </p>
                    <p className={cn("text-[7.5px] mt-1 font-black uppercase tracking-widest opacity-40", previewUrl ? "text-gray-200" : "text-gray-300 dark:text-gray-800")}>Quality standards: PNG, JPG, or WEBP</p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Product Name</label>
                  <Input
                    required
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="e.g., Upland Rice"
                    className="rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-12 px-6 font-black text-xs text-gray-900 dark:text-white shadow-inner transition-all placeholder:text-gray-300 dark:placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Category</label>
                  <div className="relative">
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-14 rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] px-6 font-black text-xs text-gray-900 dark:text-white outline-none appearance-none cursor-pointer transition-all shadow-inner"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#050a05]">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-[#050a05]">{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-3.5 h-3.5 text-[#1b6b3e] dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Price</label>
                  <div className="flex items-center h-12 rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus-within:bg-white dark:focus-within:bg-white/[0.05] pl-6 pr-2 transition-all shadow-inner">
                    <span className="text-sm font-black text-gray-300 dark:text-gray-800 mr-2.5 font-serif">₱</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 h-full bg-transparent border-none outline-none font-black text-xs text-gray-900 dark:text-white min-w-[30px] placeholder:text-gray-300 dark:placeholder:text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                    />
                    <div className="flex items-center ml-2 bg-gray-100 dark:bg-white/[0.05] p-0.5 rounded-lg gap-0.5 flex-shrink-0">
                      <button type="button" onClick={() => setUnit('kg')} className={cn("text-[6.5px] font-black uppercase tracking-widest transition-all h-6 px-2 rounded-md border border-transparent", unit === 'kg' ? "bg-white dark:bg-green-500 shadow-sm text-[#1b6b3e] dark:text-white" : "text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400")}>KG</button>
                      <button type="button" onClick={() => setUnit('unit')} className={cn("text-[6.5px] font-black uppercase tracking-widest transition-all h-6 px-2 rounded-md border border-transparent", unit === 'unit' ? "bg-white dark:bg-green-500 shadow-sm text-[#1b6b3e] dark:text-white" : "text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400")}>UNIT</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-4">Initial Stock</label>
                  <div className="flex items-center h-12 rounded-2xl border-none bg-gray-50 dark:bg-white/[0.02] focus-within:bg-white dark:focus-within:bg-white/[0.05] px-6 transition-all shadow-inner">
                    <input
                      required
                      type="number"
                      value={stockQuantity}
                      onChange={e => setStockQuantity(e.target.value)}
                      placeholder="e.g., 50"
                      className="flex-1 bg-transparent border-none outline-none font-black text-xs text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-800 min-w-0 font-sans"
                    />
                    <span className="text-[8px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.1em] ml-4">Units</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-[#f0f7f0] dark:bg-green-500/5 rounded-[2rem] border border-[#e1eae1] dark:border-green-500/10 transition-colors shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0a0f0a] flex items-center justify-center shadow-lg border border-green-100/50 dark:border-green-500/20">
                    <Eye className="w-6 h-6 text-[#1b6b3e] dark:text-green-500" />
                  </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight font-serif italic uppercase tracking-tight">Status</p>
                  <p className="text-[8px] font-black text-gray-500 dark:text-gray-700 mt-0.5 uppercase tracking-[0.2em]">Show this item to all customers</p>
                </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={cn(
                    "relative w-16 h-8.5 rounded-full transition-all duration-500 shadow-inner",
                    isAvailable ? 'bg-[#1b6b3e] dark:bg-green-600' : 'bg-gray-200 dark:bg-white/10'
                  )}
                >
                  <div className={cn("absolute top-1.5 left-1.5 bg-white w-5.5 h-5.5 rounded-full transition-transform duration-500 shadow-xl", isAvailable && "translate-x-7.5")} />
                </button>
              </div>
            </div>

            <div className="p-8 pt-6 flex items-center justify-end gap-6 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 transition-colors">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-10 h-12 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[9px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(27,107,62,0.3)] dark:shadow-[0_0_40px_rgba(27,107,62,0.2)] transition-all active:scale-95"
              >
                {isSubmitting ? 'Creating...' : 'Add Product'}
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
    <div className="space-y-8 transition-colors duration-500">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1b6b3e] dark:group-focus-within:text-green-500 transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stall catalog..."
            className="h-14 pl-12 rounded-2xl bg-white dark:bg-[#0a0f0a] border-gray-100 dark:border-white/5 shadow-sm border focus-visible:ring-[#1b6b3e] dark:focus-visible:ring-green-500 text-sm font-black dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-800 transition-all"
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
                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 active:scale-95",
                activeCategory === cat
                  ? "bg-[#1b6b3e] dark:bg-green-600 text-white border-[#1b6b3e] dark:border-green-600 shadow-xl shadow-green-900/20 dark:shadow-[0_0_30px_rgba(27,107,62,0.2)]"
                  : "bg-white dark:bg-[#0a0f0a] text-gray-400 dark:text-gray-700 border-gray-100 dark:border-white/5 hover:border-[#1b6b3e]/30 dark:hover:border-green-500/30 hover:text-[#1b6b3e] dark:hover:text-green-500"
              )}
            >
              {cat === 'all' ? 'Everything' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0a0f0a] rounded-[3rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all">
        {initialListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-10">
            <div className="w-24 h-24 bg-gray-50 dark:bg-white/[0.02] rounded-full flex items-center justify-center mb-10 border border-gray-100 dark:border-white/5">
              <Package className="w-12 h-12 text-gray-200 dark:text-gray-800" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif mb-3 italic tracking-tight uppercase">Inventory <span className="text-[#1b6b3e] dark:text-green-500">Empty</span></h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-600 max-w-xs mb-12 leading-relaxed font-black uppercase tracking-[0.2em]">Deploy your first product listing to activate the commerce node.</p>

            <div className="flex flex-col gap-6">
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
                  className="text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] gap-3"
                  onClick={async () => {
                    const res = await seedInitialCatalog()
                    if (res.success) router.refresh()
                    else alert(res.error)
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Seed Universal Catalog
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-white/[0.01] hover:bg-gray-50/50 dark:hover:bg-white/[0.01] border-b border-gray-100 dark:border-white/5">
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] pl-12 py-8">Product Terminal</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] py-8">Procurement</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] py-8">Resources</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] py-8 text-center">Protocol</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] py-8">Last Sync</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-700 text-[11px] uppercase tracking-[0.2em] text-right pr-12 py-8">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-32 text-[11px] text-gray-300 dark:text-gray-800 font-black uppercase tracking-[0.4em] font-serif italic">
                      Null data for active classification.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((listing) => (
                    <TableRow key={listing.id} className="group hover:bg-[#f0f7f0]/30 dark:hover:bg-green-500/[0.02] transition-all duration-500 border-b border-gray-50 dark:border-white/5 last:border-0">
                      <TableCell className="pl-12 py-8">
                        <div className="flex items-center gap-6">
                          <div className="relative w-20 h-20 rounded-[2rem] bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 group-hover:border-[#1b6b3e]/30 dark:group-hover:border-green-500/30 transition-all duration-500">
                            {listing.products?.image_url ? (
                              <NextImage
                                src={listing.products.image_url}
                                alt={listing.products.name ?? 'product'}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-200 dark:text-gray-800" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight font-serif italic uppercase mb-1">{listing.products?.name ?? '—'}</p>
                            <div className="flex items-center gap-4">
                              <span className="inline-flex items-center bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors">
                                {listing.products?.categories?.name ?? 'Other'}
                              </span>
                              <span className="text-[10px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-tighter">
                                Per {listing.products?.unit ?? 'UNIT'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex items-center gap-1">
                          <InlinePriceEditor
                            listingId={listing.id}
                            initialPrice={listing.price}
                            onSuccess={() => { showToast('Valuation updated', 'success'); router.refresh() }}
                            onError={(msg) => showToast(msg, 'error')}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 dark:text-white text-lg font-serif">{listing.stock_quantity.toLocaleString()}</span>
                          <span className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] leading-none mt-1">Net Available</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-8 text-center">
                        <div className="flex justify-center">
                          <AvailabilityToggle
                            listingId={listing.id}
                            initial={listing.is_available}
                            onError={(msg) => showToast(msg, 'error')}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-tight">
                           <div className="w-1 h-1 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                           {relTime(listing.last_updated)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-12 py-8">
                        <div className="flex items-center justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all duration-300">
                          <EditListingDialog
                            listing={listing}
                            categories={categories}
                            onUpdated={(msg) => { showToast(msg, 'success'); router.refresh() }}
                          />
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
