import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('super', 'admin'));

router.get('/', async (req: AuthRequest, res) => {
  try {
    const subAdmins = await prisma.subAdmin.findMany({
      include: { user: { select: { id: true, email: true, name: true, status: true, role: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ data: subAdmins });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.post('/', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const { email, name, phone, password, permissions, status } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'MissingFields' });
    if (password.length < 8) return res.status(400).json({ error: 'WeakPassword' });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        phone,
        role: 'sub',
        status: status || 'active',
        password_hash: passwordHash,
      },
    });

    const subAdmin = await prisma.subAdmin.create({
      data: {
        user_id: user.id,
        name,
        email: user.email,
        phone,
        permissions: JSON.stringify(permissions || []),
        status: status || 'active',
      },
      include: { user: true },
    });

    broadcastAdminUpdate({ action: 'sub_admin_created', subAdminId: subAdmin.id, email: user.email });
    res.status(201).json({ data: subAdmin, message: 'تم إنشاء المشرف الفرعي' });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'DuplicateEmail', message: 'البريد مستخدم مسبقاً' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.put('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const { name, phone, permissions, status } = req.body;
    const subAdmin = await prisma.subAdmin.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(permissions && { permissions: JSON.stringify(permissions) }),
        ...(status && { status }),
      },
      include: { user: true },
    });

    if (status) {
      await prisma.user.update({
        where: { id: subAdmin.user_id },
        data: { status },
      });
    }

    broadcastAdminUpdate({ action: 'sub_admin_updated', subAdminId: subAdmin.id });
    res.json({ data: subAdmin, message: 'تم التحديث' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.delete('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const subAdmin = await prisma.subAdmin.delete({ where: { id: req.params.id } });
    await prisma.user.delete({ where: { id: subAdmin.user_id } }).catch(() => {});
    broadcastAdminUpdate({ action: 'sub_admin_deleted', subAdminId: req.params.id });
    res.json({ message: 'تم حذف المشرف الفرعي' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
