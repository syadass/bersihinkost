import { z } from 'zod'

export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Nama pelanggan wajib diisi').max(100),
  customer_wa: z.string().min(8, 'Nomor WhatsApp wajib diisi').max(20).regex(/^[0-9+]+$/, 'Nomor WhatsApp tidak valid'),
  alamat: z.string().min(1, 'Alamat wajib diisi').max(500),
  tanggal_usulan: z.string().min(1, 'Tanggal usulan wajib diisi'),
  jam_usulan: z.string().min(1, 'Jam usulan wajib diisi'),
  items: z.array(
    z.object({
      service_id: z.string().min(1, 'Layanan wajib dipilih'),
      qty: z.coerce.number().int().min(1, 'Qty minimal 1').max(20, 'Qty maksimal 20'),
    })
  ).min(1, 'Minimal pilih satu layanan'),
})

export const orderUpdateSchema = z.object({
  customer_name: z.string().min(1).max(100),
  customer_wa: z.string().max(20).optional().or(z.literal('')),
  alamat: z.string().min(1).max(500),
  tanggal_usulan: z.string().min(1),
  jam_usulan: z.string().min(1),
  catatan_admin: z.string().nullable().optional(),
  items: z.array(
    z.object({
      service_id: z.string().min(1),
      qty: z.coerce.number().int().min(1).max(20),
    })
  ).min(1),
})

export const manualOrderSchema = z.object({
  customer_name: z.string().min(1).max(100),
  customer_wa: z.string().max(20).optional().or(z.literal('')),
  alamat: z.string().min(1).max(500),
  tanggal_fix: z.string().min(1),
  jam_fix: z.string().min(1),
  items: z.array(
    z.object({
      service_id: z.string().min(1),
      qty: z.coerce.number().int().min(1).max(20),
    })
  ).min(1),
})

export const accRescheduleSchema = z.object({
  tanggal_fix: z.string().min(1),
  jam_fix: z.string().min(1),
})

export const cancelSchema = z.object({
  alasan_batal: z.string().min(1, 'Alasan pembatalan wajib diisi').max(500),
})

export const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  price: z.coerce.number().int().min(0),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
})

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
})

export const renameCategorySchema = z.object({
  old: z.string().min(1).max(50),
  new: z.string().min(1).max(50),
})

export const deleteCategorySchema = z.object({
  category: z.string().min(1).max(50),
})

export const profilSchema = z.object({
  business_name: z.string().min(1).max(100),
  operator_name: z.string().min(1).max(100),
  admin_wa_number: z.string().min(1).max(20),
})

export const operasionalSchema = z.object({
  is_open: z.boolean(),
  jam_mulai: z.string().min(1).max(5),
  jam_selesai: z.string().min(1).max(5),
  catatan_publik: z.string().max(500).nullable().optional(),
})

export const accountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  email_confirmation: z.string().email().max(100),
  password: z.string().optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.email !== data.email_confirmation) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email_confirmation'], message: 'Konfirmasi email tidak sama.' })
  }
  const pw = data.password || ''
  const pwc = data.password_confirmation || ''
  if (pw || pwc) {
    if (pw.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Kata sandi minimal 8 karakter.' })
    }
    if (pw !== pwc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password_confirmation'], message: 'Konfirmasi kata sandi tidak sama.' })
    }
  }
})

export const holidaySchema = z.object({
  tanggal: z.string().min(1),
  keterangan: z.string().max(100).nullable().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})
