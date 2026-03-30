'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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

// ── Zod schema ───────────────────────────────────────────────────────

const addSchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Price must be a positive number')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Maximum two decimal places'),
  is_available: z.boolean(),
})
type AddForm = z.infer<typeof addSchema>

// ── Toast helper ─────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-lg text-white transition-all ${
        type === 'success' ? 'bg-green-600' : 'bg-red-500'
      }`}
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
        className="group flex items-center gap-1.5 text-sm font-black text-green-700 hover:text-green-800 transition-all"
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
        className="h-8 w-24 text-sm font-bold"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
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
      className={`relative flex-shrink-0 w-10 h-6 rounded-full border-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
        checked ? 'bg-green-600 border-green-600' : 'bg-gray-200 border-gray-200'
      } disabled:opacity-60`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
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
      <DialogTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" aria-describedby="delete-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-gray-900">Delete this listing?</DialogTitle>
          <DialogDescription id="delete-dialog-desc" className="sr-only">Confirm deletion of the selected listing.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-500 leading-relaxed">
          This will permanently remove <span className="font-bold text-gray-700">{productName}</span> from your listings.
          Buyers will no longer see this product in your stall.
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Add listing dialog (New Design based on User Mockup) ─────────────────────

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

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open])
  
  // Local state for the complex UI
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

    // Check if the typed product name exactly matches an existing product in the catalog
    const existingProduct = allProducts.find(
      (p) => p.name.toLowerCase() === productName.trim().toLowerCase()
    )

    const finalProductId = existingProduct?.id

    let uploadedImageUrl: string | undefined = undefined
    if (file) {
      try {
        const supabase = createBrowserSupabase()
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'jpg'
        const path = `products/${vendorId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: false, contentType: file.type || `image/${safeExt}` })

        if (uploadError) throw uploadError
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
        uploadedImageUrl = pub.publicUrl
      } catch (err: any) {
        // Don't block listing creation if storage isn't configured yet.
        setServerError(
          `Image upload skipped. Create a Supabase Storage bucket named "product-images" to enable uploads. ${err?.message || ''}`.trim()
        )
        uploadedImageUrl = undefined
      }
    }

    const result = await addListing({
      vendor_id: vendorId,
      market_id: marketId,
      product_id: finalProductId || productName, // Using name as fallback for the action to handle
      price: parseFloat(price),
      is_available: isAvailable,
      // Pass the extra requested fields to the backend Action
      custom_product_name: existingProduct ? undefined : productName.trim(),
      custom_category_id: existingProduct ? undefined : categoryId,
      unit: unit,
      stock_quantity: parseInt(stockQuantity) || 0,
      image_url: existingProduct ? undefined : uploadedImageUrl,
    } as any) // Typecast for temporary expanded fields

    setIsSubmitting(false)

    if (result?.error) {
      setServerError(result.error)
    } else {
      // Optional: if user chose an existing product and uploaded an image, try to set it (requires policy)
      if (existingProduct && uploadedImageUrl) {
        await updateProductImage(existingProduct.id, uploadedImageUrl)
      }
      setOpen(false)
      // Reset logic
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 rounded-xl shadow-lg shadow-green-600/30 gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Product
      </button>

      {open && (
        <div className="fixed inset-0 z-50 isolate">
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[calc(100%-2rem)] sm:max-w-lg -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white overflow-hidden border-0 rounded-[1.5rem] shadow-2xl">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Add New Product to Your Stall</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 bg-white overflow-y-auto max-h-[75vh]">
          {serverError && (
            <div className="p-4 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100">
               {serverError}
            </div>
          )}

          {/* Product Image */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                if (f && f.size > 5 * 1024 * 1024) {
                  setServerError('Image must be 5MB or smaller.')
                  e.target.value = ''
                  setFile(null)
                  return
                }
                setFile(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-2xl border-2 border-dashed border-green-100 bg-green-50/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50 transition-colors group relative overflow-hidden"
            >
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt="Product preview"
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                )}
                <div className={previewUrl ? "absolute inset-0 bg-black/20" : ""} />
                <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Camera className="w-5 h-5 text-green-600" />
                </div>
                <p className={previewUrl ? "text-xs font-bold text-white drop-shadow" : "text-xs font-bold text-gray-900"}>
                  {file ? 'Change photo' : 'Click to upload product photo'}
                </p>
                <p className={previewUrl ? "text-[10px] text-white/90 drop-shadow mt-1" : "text-[10px] text-gray-400 mt-1"}>
                  PNG, JPG or WEBP (Max. 5MB)
                </p>
                </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Name</label>
                <Input
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g., Upland Rice"
                  className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-green-500 focus:bg-white font-medium text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</label>
                <div className="relative">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-12 w-full rounded-xl bg-gray-50 border border-transparent focus:border-green-500 focus:bg-white hover:bg-gray-100 text-sm font-medium px-4 pr-10 outline-none"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Price</label>
                <div className="flex bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                   <div className="pl-4 pr-1 flex items-center text-gray-500 font-bold text-sm">₱</div>
                   <Input
                     required
                     type="number"
                     step="0.01"
                     value={price}
                     onChange={e => setPrice(e.target.value)}
                     placeholder="0.00"
                     className="h-12 bg-transparent border-0 focus-visible:ring-0 px-1 font-bold text-sm"
                   />
                   <div className="flex border-l border-gray-200">
                      <button type="button" onClick={() => setUnit('kg')} className={`px-3 text-[10px] font-bold ${unit === 'kg' ? 'bg-white text-gray-900 border border-gray-200 rounded-md m-1 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>per kg</button>
                      <button type="button" onClick={() => setUnit('unit')} className={`px-2 text-[10px] font-bold ${unit === 'unit' ? 'bg-white text-gray-900 border border-gray-200 rounded-md m-1 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>per unit</button>
                   </div>
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Stock Quantity</label>
                <div className="relative">
                  <Input
                    required
                    type="number"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    placeholder="e.g., 50"
                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-green-500 focus:bg-white font-medium text-sm pr-20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                     Available
                  </div>
                </div>
              </div>
          </div>

          {/* Mark as Available Toggle */}
          <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                   <Eye className="w-4 h-4 text-green-700" />
                </div>
                <div>
                   <p className="text-sm font-black text-green-900 leading-tight">Mark as Available</p>
                   <p className="text-[10px] text-green-600 font-medium">Product will be visible to buyers immediately</p>
                </div>
             </div>
             <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isAvailable ? 'bg-green-600' : 'bg-gray-300'}`}
             >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isAvailable ? 'translate-x-6' : ''}`} />
             </button>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-50">
             <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 font-bold text-gray-500 hover:text-gray-900 rounded-xl">
               Cancel
             </Button>
             <Button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl bg-green-700 hover:bg-green-800 text-white font-black shadow-lg shadow-green-700/30">
               {isSubmitting ? 'Listing...' : 'List Product'}
             </Button>
          </div>
              </form>
            </div>
          </div>
        </div>
      )}
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

  // Derive categories from listings (for filter tabs)
  const listingCategories = Array.from(
    new Set(initialListings.map((l) => l.products?.categories?.name ?? 'Other'))
  ).sort()

  const existingProductIds = new Set(initialListings.map((l) => l.product_id))

  const filtered = initialListings.filter((l) => {
    const matchSearch = search === '' || (l.products?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || (l.products?.categories?.name ?? 'Other') === activeCategory
    return matchSearch && matchCat
  })

  function relTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">My Products</h1>
          <p className="text-xs text-gray-400 mt-0.5">{initialListings.length} total listing{initialListings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="h-11 pl-9 w-full sm:w-48 text-sm"
            />
          </div>
          <AddListingDialog
            vendorId={vendorId}
            marketId={marketId}
            allProducts={allProducts}
            categories={categories}
            onAdded={() => router.refresh()}
          />
        </div>
      </div>

      {/* Category filter tabs */}
      {listingCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...listingCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`h-8 px-4 rounded-full text-xs font-bold border transition-all capitalize ${
                activeCategory === cat
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {initialListings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-base font-bold text-gray-500 mb-1">No listings yet</p>
          <p className="text-sm text-gray-400 mb-6">Add your first product to get started.</p>
          
          <div className="flex flex-col gap-3 w-64">
            <AddListingDialog
              vendorId={vendorId}
              marketId={marketId}
              allProducts={allProducts}
              categories={categories}
              onAdded={() => router.refresh()}
            />
            
            {allProducts.length === 0 && (
              <Button 
                variant="outline"
                className="gap-2 text-xs font-bold border-dashed h-11 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                onClick={async () => {
                  const res = await seedInitialCatalog()
                  if (res.success) router.refresh()
                  else alert(res.error)
                }}
              >
                <Sparkles className="w-4 h-4" />
                Seed Master Catalog
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop table */}
      {initialListings.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">Product</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">Unit</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">Price</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest text-center">Stock</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">Available</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">Updated</TableHead>
                  <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-gray-400">
                      No listings match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((listing) => (
                    <TableRow key={listing.id} className="hover:bg-gray-50">
                      <TableCell>
                        <p className="font-bold text-sm text-gray-900">{listing.products?.name ?? '—'}</p>
                        <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] font-bold mt-1">
                          {listing.products?.categories?.name ?? 'Uncategorised'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{listing.products?.unit ?? '—'}</TableCell>
                      <TableCell>
                        <InlinePriceEditor
                          listingId={listing.id}
                          initialPrice={listing.price}
                          onSuccess={() => { showToast('Price updated!', 'success'); router.refresh() }}
                          onError={(msg) => showToast(msg, 'error')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] font-bold border-gray-100 bg-gray-50">
                          {listing.stock_quantity || 0} left
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AvailabilityToggle
                          listingId={listing.id}
                          initial={listing.is_available}
                          onError={(msg) => showToast(msg, 'error')}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{relTime(listing.last_updated)}</TableCell>
                      <TableCell className="text-right">
                        <DeleteDialog
                          listingId={listing.id}
                          productName={listing.products?.name ?? 'this product'}
                          onDeleted={() => { showToast('Listing deleted', 'success'); router.refresh() }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">No listings match your search.</p>
            ) : (
              filtered.map((listing) => (
                <Card key={listing.id} className="border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{listing.products?.name ?? '—'}</p>
                        <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] font-bold mt-1">
                          {listing.products?.categories?.name ?? 'Uncategorised'}
                        </Badge>
                      </div>
                      <AvailabilityToggle
                        listingId={listing.id}
                        initial={listing.is_available}
                        onError={(msg) => showToast(msg, 'error')}
                      />
                    </div>
                    <div className="mb-3">
                      <InlinePriceEditor
                        listingId={listing.id}
                        initialPrice={listing.price}
                        onSuccess={() => { showToast('Price updated!', 'success'); router.refresh() }}
                        onError={(msg) => showToast(msg, 'error')}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">per {listing.products?.unit ?? 'unit'}</p>
                        <p className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{listing.stock_quantity || 0} in stock</p>
                      </div>
                    </div>
                    <Separator className="mb-3" />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Updated {relTime(listing.last_updated)}</p>
                      <DeleteDialog
                        listingId={listing.id}
                        productName={listing.products?.name ?? 'this product'}
                        onDeleted={() => { showToast('Listing deleted', 'success'); router.refresh() }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
