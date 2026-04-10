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
        className="group flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800 transition-all font-serif"
      >
        ₱{Number(initialPrice).toFixed(2)}
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 text-left">
      <span className="text-gray-400 dark:text-gray-600 text-sm">₱</span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="h-8 w-24 text-sm font-bold rounded-lg bg-gray-50 dark:bg-white/5 border-none dark:text-white"
        autoFocus
      />
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#1b6b3e] text-white hover:bg-[#155430] transition-all disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
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
        className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#1d631d] hover:bg-[#f0f7f0] dark:hover:bg-white/5 transition-all"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-serif italic">Edit Listing</h2>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Full terminal update protocol</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block pl-1">Product Identity</label>
                <Input
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="rounded-2xl border-none bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 h-14 px-6 font-bold text-sm text-gray-900 dark:text-white shadow-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block pl-1">Classification</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-14 rounded-2xl border-none bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 px-6 font-bold text-sm text-gray-900 dark:text-white outline-none appearance-none cursor-pointer transition-all"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%231d631d' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 20px center' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#111111]">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image Update Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Sync Photo</label>
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
                className="w-full h-40 rounded-[1.5rem] border-2 border-dashed border-[#e6eee6] dark:border-white/5 bg-[#f8faf8] dark:bg-white/[0.02] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f0f7f0] dark:hover:bg-white/5 transition-all group relative overflow-hidden"
              >
                {previewUrl ? (
                  <>
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Camera className="w-6 h-6 text-white mb-2" />
                      <span className="text-white text-xs font-bold absolute bottom-4">Change Photo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-6 h-6 text-[#1d631d] dark:text-green-500 mb-2 opacity-40" />
                    <span className="text-xs font-bold text-gray-400">Upload product photo</span>
                  </div>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block pl-1">Procurement Price</label>
                <div className="flex items-center h-14 rounded-2xl border-none bg-gray-50 dark:bg-white/5 focus-within:bg-white dark:focus-within:bg-white/10 overflow-hidden px-6 transition-all">
                  <span className="text-sm font-bold text-gray-300 dark:text-gray-700 mr-2 font-serif">₱</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-gray-900 dark:text-white min-w-[50px] placeholder:text-gray-300 dark:placeholder:text-gray-700"
                  />
                  <div className="flex items-center ml-2 border-l border-gray-100 dark:border-white/10 pl-3 gap-3">
                    <button type="button" onClick={() => setUnit('kg')} className={cn("text-[10px] font-black uppercase tracking-tighter transition-all", unit === 'kg' ? "text-[#1b6b3e] dark:text-green-500 scale-110" : "text-gray-300 dark:gray-700")}>kg</button>
                    <button type="button" onClick={() => setUnit('unit')} className={cn("text-[10px] font-black uppercase tracking-tighter transition-all", unit === 'unit' ? "text-[#1b6b3e] dark:text-green-500 scale-110" : "text-gray-300 dark:gray-700")}>unit</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block pl-1">Stock Availability</label>
                <Input
                  required
                  type="number"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  className="rounded-2xl border-none bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 h-14 px-6 font-bold text-sm text-gray-900 dark:text-white shadow-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#f0f7f0] dark:bg-green-500/5 rounded-[2rem] border border-[#e1eae1] dark:border-green-500/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121212] flex items-center justify-center shadow-sm border border-green-50 dark:border-white/5">
                  <Eye className="w-6 h-6 text-[#1b6b3e] dark:text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-tight font-serif italic">Network Visibility</p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-500 mt-1 uppercase tracking-widest">Public Catalog Presence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={cn(
                  "relative w-14 h-7.5 rounded-full transition-all duration-300",
                  isAvailable ? 'bg-[#1b6b3e] dark:bg-green-600 shadow-lg shadow-green-900/10' : 'bg-gray-200 dark:bg-white/10'
                )}
              >
                <div className={cn("absolute top-1 left-1 bg-white w-5.5 h-5.5 rounded-full transition-transform duration-300 shadow-sm", isAvailable && "translate-x-6.5")} />
              </button>
            </div>
          </div>

          <div className="p-10 pt-4 flex items-center justify-end gap-10 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 transition-colors">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Abort Update
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-10 h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-green-900/20 transition-all active:scale-95"
            >
              {isSubmitting ? 'Synchronizing...' : 'Commit Changes'}
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
        className="h-9 w-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <DialogContent className="max-w-sm rounded-[2.5rem] p-10 bg-white dark:bg-[#111111] border-none shadow-3xl overflow-hidden" aria-describedby="delete-dialog-desc">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50" />
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-gray-900 dark:text-white mb-2 font-serif italic tracking-tight uppercase">Purge Listing?</DialogTitle>
          <DialogDescription id="delete-dialog-desc" className="text-gray-500 dark:text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            This will permanently remove <span className="text-[#1b6b3e] dark:text-green-500">{productName}</span> from the decentralized network storefront.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-8">
          <Button
            className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest h-14 shadow-xl shadow-red-900/20 active:scale-95"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Executing Purge...' : 'Confirm Destruction'}
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-2xl text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white h-14 font-black uppercase tracking-[0.2em] text-[10px] transition-all"
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

    // If the product already exists but had no image, update it with the uploaded one
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
        className="rounded-full bg-green-700 hover:bg-green-800 text-white px-6 h-11 text-sm font-bold transition-all shadow-lg shadow-green-700/20 gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Listing
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border border-gray-100 shadow-2xl" aria-describedby="add-listing-desc">
          {/* Header with visible title */}
          <div className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-bold text-gray-900">Add New Product to Your Stall</DialogTitle>
            <DialogDescription id="add-listing-desc" className="sr-only">Fill out the form below to add a new product listing.</DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="bg-white overflow-y-auto max-h-[85vh]">
            {serverError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 font-semibold text-xs rounded-xl border border-red-100">
                {serverError}
              </div>
            )}

            <div className="px-6 py-5 space-y-5">
              {/* Product Image Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Product Image</label>
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
                  className="w-full h-40 rounded-xl border-2 border-dashed border-green-200 bg-green-50/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50 transition-all group relative overflow-hidden"
                >
                  {previewUrl && (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  )}
                  <div className={cn("relative z-10 flex flex-col items-center justify-center p-4", previewUrl && "bg-black/40 inset-0 absolute backdrop-blur-sm")}>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-2", previewUrl ? "bg-white/20" : "bg-green-100")}>
                      <Camera className={cn("w-5 h-5", previewUrl ? "text-white" : "text-green-700")} />
                    </div>
                    <p className={cn("text-sm font-semibold", previewUrl ? "text-white" : "text-gray-700")}>
                      {file ? 'Change product photo' : 'Click to upload product photo'}
                    </p>
                    <p className={cn("text-xs mt-0.5", previewUrl ? "text-gray-200" : "text-gray-400")}>PNG, JPG or WEBP (Max. 5MB)</p>
                  </div>
                </button>
              </div>

              {/* 2-column: Product Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Product Name</label>
                  <Input
                    required
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="e.g., Upland Rice"
                    className="rounded-lg border border-gray-200 bg-gray-50 h-11 px-4 font-medium text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-green-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Category</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600 appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-column: Price + Stock Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Price</label>
                  <div className="flex items-center h-11 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="flex items-center pl-3 pr-1 font-semibold text-gray-500 text-sm shrink-0">₱</div>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 h-full bg-transparent border-none outline-none font-semibold text-sm text-gray-800 min-w-[50px] placeholder:text-gray-400"
                    />
                    <div className="flex items-center pr-1 gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setUnit('kg')}
                        className={cn("px-2 py-1 rounded text-[10px] font-bold transition-all", unit === 'kg' ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600")}
                      >
                        per kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit('unit')}
                        className={cn("px-2 py-1 rounded text-[10px] font-bold transition-all", unit === 'unit' ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600")}
                      >
                        per unit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Stock Quantity</label>
                  <div className="flex items-center h-11 rounded-lg border border-gray-200 bg-gray-50 px-4">
                    <input
                      required
                      type="number"
                      value={stockQuantity}
                      onChange={e => setStockQuantity(e.target.value)}
                      placeholder="e.g., 50"
                      className="flex-1 bg-transparent border-none outline-none font-medium text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
                    />
                    <span className="text-xs font-semibold text-gray-400 ml-2">Available</span>
                  </div>
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-green-50/60 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">Mark as Available</p>
                    <p className="text-xs text-gray-500">Product will be visible to buyers immediately</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors",
                    isAvailable ? 'bg-green-600' : 'bg-gray-300'
                  )}
                >
                  <div className={cn("absolute top-1 left-1 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-sm", isAvailable && "translate-x-5.5")} />
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 flex items-center justify-end gap-4 border-t border-gray-100 bg-white">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-10 px-5 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold text-sm"
              >
                {isSubmitting ? 'Processing...' : 'List Product'}
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
            className="h-12 pl-12 rounded-full bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/5 shadow-sm border focus-visible:ring-[#1b6b3e] dark:focus-visible:ring-green-500 text-sm font-medium dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
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
                  ? "bg-[#1b6b3e] dark:bg-green-600 text-white border-[#1b6b3e] dark:border-green-600 shadow-lg shadow-green-900/10"
                  : "bg-white dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:border-[#1b6b3e]/30 dark:hover:border-green-500/30 hover:text-[#1b6b3e] dark:hover:text-green-500"
              )}
            >
              {cat === 'all' ? 'Everything' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden transition-colors">
        {initialListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-gray-200 dark:text-gray-800" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white font-serif mb-2 italic">Inventory is Empty</h3>
            <p className="text-sm text-gray-400 dark:text-gray-600 max-w-xs mb-10 leading-relaxed font-medium">Add your first product listing to start selling to the Butuan community through the digital market network.</p>

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
                  className="text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 h-11 px-6 rounded-full font-bold text-xs uppercase tracking-widest gap-2"
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
                <TableRow className="bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest pl-10 py-6">Product Item</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest py-6">Price</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest py-6">Stock</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest py-6 text-center">Live</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest py-6">Updated</TableHead>
                  <TableHead className="font-black text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-widest text-right pr-10 py-6">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-sm text-gray-400 font-medium font-sans uppercase tracking-widest">
                      No matching products in this category.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((listing) => (
                    <TableRow key={listing.id} className="group hover:bg-[#f0f7f0]/30 transition-all duration-300 border-b border-gray-50 last:border-0">
                      <TableCell className="pl-10 py-5">
                        <div className="flex items-center gap-5">
                          <div className="relative w-16 h-16 rounded-2xl bg-[#f8faf8] border border-[#e6eee6] overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {listing.products?.image_url ? (
                              <Image
                                src={listing.products.image_url}
                                alt={listing.products.name ?? 'product'}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#f0f4f0]">
                                <Package className="w-6 h-6 text-[#4a7c4a] opacity-40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-sm tracking-tight">{listing.products?.name ?? '—'}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center bg-[#f0f7f0] text-[#1d631d] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#e1eae1]">
                                {listing.products?.categories?.name ?? 'Other'}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {listing.products?.unit ?? 'UNIT'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="font-bold text-green-700 font-sans">
                          ₱{Number(listing.price).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-sm">{listing.stock_quantity.toLocaleString()}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Available</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center">
                          <AvailabilityToggle
                            listingId={listing.id}
                            initial={listing.is_available}
                            onError={(msg) => showToast(msg, 'error')}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 uppercase tracking-tight">
                          {relTime(listing.last_updated)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10 py-5">
                        <div className="flex items-center justify-end gap-1 transition-opacity duration-300">
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
