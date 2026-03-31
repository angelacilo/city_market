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
        className="group flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800 transition-all font-serif italic"
      >
        ₱{Number(initialPrice).toFixed(2)}
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 text-left">
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

// ── Edit listing dialog ───────────────────────────────────────────────

function EditListingDialog({
  listing,
  onUpdated,
}: {
  listing: Listing
  onUpdated: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)
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
        className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#1d631d] hover:bg-[#f0f7f0] transition-all"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit} className="bg-white overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Edit Product</h2>
                <p className="text-xs text-gray-400 font-medium">Update listing details for {listing.products?.name}</p>
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
                className="w-full h-40 rounded-[1.5rem] border-2 border-dashed border-[#e6eee6] bg-[#f8faf8] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f0f7f0] transition-all group relative overflow-hidden"
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
                    <Camera className="w-6 h-6 text-[#1d631d] mb-2 opacity-40" />
                    <span className="text-xs font-bold text-gray-400">Upload product photo</span>
                  </div>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Price (₱)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="rounded-xl border-none bg-[#e9f0e9] focus:bg-[#e1eae1] h-12 px-5 font-bold text-sm text-gray-700 shadow-none ring-0 focus-visible:ring-0"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Stock</label>
                  <Input
                    required
                    type="number"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    className="rounded-xl border-none bg-[#e9f0e9] focus:bg-[#e1eae1] h-12 px-5 font-bold text-sm text-gray-700 shadow-none ring-0 focus-visible:ring-0"
                  />
               </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#f0f7f0] rounded-2xl border border-[#e1eae1]">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Eye className="w-5 h-5 text-[#1d631d]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Live on Market</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Visible to public catalog</p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors",
                    isAvailable ? 'bg-[#1d631d]' : 'bg-gray-300'
                  )}
               >
                  <div className={cn("absolute top-1 left-1 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-sm", isAvailable && "translate-x-5.5")} />
               </button>
            </div>
          </div>

          <div className="p-8 pt-4 flex items-center justify-end gap-6 bg-[#f8faf8]">
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-8 h-12 rounded-xl bg-[#1d631d] hover:bg-[#164d16] text-white font-bold text-sm shadow-lg shadow-[#1d631d]/20 transition-all font-sans"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
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
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" aria-describedby="add-listing-desc">
        {/* Header - Hidden or integrated into the form for a cleaner look as per Image 1 */}
        <div className="hidden">
           <DialogTitle>Add Product</DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="bg-white overflow-y-auto max-h-[90vh] no-scrollbar">
          {serverError && (
            <div className="m-8 p-4 bg-red-50 text-red-600 font-bold text-xs rounded-2xl border border-red-100">
              {serverError}
            </div>
          )}

          <div className="p-8 space-y-6">
            {/* Product Image Section - Top Full Width */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Product Image</label>
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
                className="w-full h-52 rounded-[1.5rem] border-2 border-dashed border-[#e6eee6] bg-[#f8faf8] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f0f7f0] transition-all group relative overflow-hidden"
              >
                {previewUrl && (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                )}
                <div className={cn("relative z-10 flex flex-col items-center justify-center p-4", previewUrl && "bg-black/30 inset-0 absolute backdrop-blur-[2px]")}>
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all", previewUrl ? "bg-white/20" : "bg-[#ecf2ec]")}>
                    <Camera className={cn("w-6 h-6", previewUrl ? "text-white" : "text-[#4a7c4a]")} />
                  </div>
                  <p className={cn("text-sm font-bold", previewUrl ? "text-white" : "text-gray-900")}>
                    {file ? 'Change product photo' : 'Click to upload product photo'}
                  </p>
                  <p className={cn("text-xs mt-1", previewUrl ? "text-gray-200" : "text-gray-400")}>PNG, JPG or WEBP (Max. 5MB)</p>
                </div>
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Product Name</label>
                <Input
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g., Upland Rice"
                  className="rounded-xl border-none bg-[#e9f0e9] focus:bg-[#e1eae1] h-12 px-5 font-bold text-sm text-gray-700 placeholder:text-gray-400 border-0 shadow-none ring-0 focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Category</label>
                <div className="relative">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-12 w-full rounded-xl bg-[#e9f0e9] border-none focus:bg-[#e1eae1] text-sm font-bold px-5 pr-12 outline-none appearance-none transition-all text-gray-700"
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Price</label>
                <div className="flex h-12 rounded-xl bg-[#e9f0e9] overflow-hidden">
                  <div className="flex items-center px-4 font-bold text-gray-500 text-sm">₱</div>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-gray-700 min-w-0"
                  />
                  <div className="flex items-center p-1.5 gap-1">
                     <button 
                       type="button"
                       onClick={() => setUnit('kg')}
                       className={cn("px-3 h-full rounded-lg text-[10px] font-black uppercase transition-all", unit === 'kg' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/50")}
                     >
                       per kg
                     </button>
                     <button 
                       type="button"
                       onClick={() => setUnit('unit')}
                       className={cn("px-3 h-full rounded-lg text-[10px] font-black uppercase transition-all", unit === 'unit' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/50")}
                     >
                       per unit
                     </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Stock Quantity</label>
                <div className="relative flex items-center h-12 rounded-xl bg-[#e9f0e9] px-5">
                  <input
                    required
                    type="number"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    placeholder="e.g., 50"
                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-gray-700 placeholder:text-gray-400 min-w-0"
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight ml-2">Available</span>
                </div>
              </div>
            </div>

            {/* Availability Section */}
            <div className="flex items-center justify-between p-5 bg-[#f0f7f0] rounded-2xl border border-[#e1eae1]">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#e9f0e9] flex items-center justify-center shadow-sm">
                    <Eye className="w-5 h-5 text-[#4a7c4a]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Mark as Available</p>
                    <p className="text-xs text-gray-500 mt-0.5">Product will be visible to buyers immediately</p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors",
                    isAvailable ? 'bg-[#2d7a2d]' : 'bg-gray-300'
                  )}
               >
                  <div className={cn("absolute top-1 left-1 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-sm", isAvailable && "translate-x-5.5")} />
               </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 pt-4 flex items-center justify-end gap-6 bg-[#f8faf8]">
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-8 h-12 rounded-xl bg-[#1d631d] hover:bg-[#164d16] text-white font-bold text-sm shadow-lg shadow-[#1d631d]/20 transition-all"
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
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest pl-10 py-6">Product Item</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Price</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Stock</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6 text-center">Live</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest py-6">Updated</TableHead>
                  <TableHead className="font-black text-gray-400 text-[10px] uppercase tracking-widest text-right pr-10 py-6">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-sm text-gray-400 font-medium font-serif italic">
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
                        <InlinePriceEditor
                          listingId={listing.id}
                          initialPrice={listing.price}
                          onSuccess={() => { showToast('Price updated!', 'success'); router.refresh() }}
                          onError={(msg) => showToast(msg, 'error')}
                        />
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <EditListingDialog 
                            listing={listing} 
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
