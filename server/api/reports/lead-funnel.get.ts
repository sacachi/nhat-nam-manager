import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const leads = await prisma.customerLead.findMany({
    include: {
      sale_user: { select: { id: true, name: true } }
    },
    orderBy: { created_at: 'desc' }
  })

  const funnel = {
    total: leads.length,
    pending: 0,
    reviewed: 0,
    assigned: 0,
    approved: 0,
    converted: 0,
    rejected: 0
  }

  leads.forEach((lead: { status: string }) => {
    switch (lead.status) {
      case 'pending': funnel.pending++; break
      case 'reviewed': funnel.reviewed++; break
      case 'assigned': funnel.assigned++; break
      case 'approved': funnel.approved++; break
      case 'converted': funnel.converted++; break
      case 'rejected': funnel.rejected++; break
    }
  })

  const conversionRate = funnel.total > 0 
    ? Math.round((funnel.converted / funnel.total) * 100) 
    : 0

  const rejectionRate = funnel.total > 0 
    ? Math.round((funnel.rejected / funnel.total) * 100) 
    : 0

  const leadsByMonth = leads.reduce<Record<string, { total: number; converted: number; rejected: number }>>((acc, lead) => {
    const month = lead.created_at.toISOString().slice(0, 7)
    if (!acc[month]) {
      acc[month] = { total: 0, converted: 0, rejected: 0 }
    }
    acc[month].total++
    if (lead.status === 'converted') acc[month].converted++
    if (lead.status === 'rejected') acc[month].rejected++
    return acc
  }, {})

  const monthlyFunnel = Object.entries(leadsByMonth)
    .map(([month, data]) => ({
      month,
      ...data,
      conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)

  const leadsBySale = leads.reduce<Record<string, { total: number; converted: number; rejected: number }>>((acc, lead) => {
    const saleName = lead.sale_user?.name || 'Unknown'
    if (!acc[saleName]) {
      acc[saleName] = { total: 0, converted: 0, rejected: 0 }
    }
    acc[saleName].total++
    if (lead.status === 'converted') acc[saleName].converted++
    if (lead.status === 'rejected') acc[saleName].rejected++
    return acc
  }, {})

  const salePerformance = Object.entries(leadsBySale)
    .map(([name, data]) => ({
      name,
      ...data,
      conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0
    }))
    .sort((a, b) => b.converted - a.converted)

  const recentLeads = leads.slice(0, 20).map((lead: { id: string; customer_name: string; phone: string; status: string; construction_value: number; created_at: Date; sale_user: { name: string } | null }) => ({
    id: lead.id,
    customer_name: lead.customer_name,
    phone: lead.phone,
    status: lead.status,
    construction_value: lead.construction_value,
    created_at: lead.created_at,
    sale_name: lead.sale_user?.name
  }))

  return {
    funnel,
    conversionRate,
    rejectionRate,
    monthlyFunnel,
    salePerformance,
    recentLeads
  }
})
