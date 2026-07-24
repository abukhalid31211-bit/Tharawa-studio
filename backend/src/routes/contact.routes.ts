/**
 * Tharwah Capital — Public Contact Form Route
 * لا يتطلب مصادقة — يحفظ في PlatformData 'messages' ليظهر في لوحة الإدارة
 */
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate } from '../lib/socket.js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'تم تجاوز حد الطلبات المسموح به، يرجى المحاولة لاحقاً' },
});

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().default(''),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

router.post('/', contactLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'InvalidInput', message: 'بيانات النموذج غير صالحة' });
  }

  const { name, email, phone, subject, message } = parsed.data;

  try {
    // قراءة الرسائل الحالية من PlatformData
    let currentMessages: any[] = [];
    const existing = await prisma.platformData.findUnique({ where: { key: 'messages' } });
    if (existing?.value && Array.isArray(existing.value)) {
      currentMessages = existing.value as any[];
    }

    // بناء رسالة جديدة بنفس شكل SupportMessage المستخدم في لوحة الإدارة
    const now = new Date();
    const newMsg = {
      id: `CT-${now.getTime().toString(36).toUpperCase()}`,
      clientId: 'contact',
      subject: subject,
      text: `[${name}] — [${email}]${phone ? ` — [${phone}]` : ''}\n\n${message}`,
      date: now.toISOString().slice(0, 10),
      status: 'pending',
      priority: 'medium',
      replies: [],
      _source: 'contact',
      _contactName: name,
      _contactEmail: email,
      _contactPhone: phone || '',
    };

    const updatedMessages = [newMsg, ...currentMessages];

    await prisma.platformData.upsert({
      where: { key: 'messages' },
      update: { value: updatedMessages as any },
      create: { key: 'messages', value: updatedMessages as any },
    });

    // إشعار لوحة الإدارة في الوقت الفعلي
    broadcastAdminUpdate({ action: 'message_created', source: 'contact', from: name });

    return res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح' });
  } catch (error) {
    console.error('[Contact] Error saving contact message:', error);
    return res.status(500).json({ error: 'ServerError', message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' });
  }
});

export default router;
