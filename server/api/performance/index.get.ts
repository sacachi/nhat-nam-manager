import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'
import {
  calcSaleMetrics, calcDesignMetrics, calcConstructionMetrics,
  calcSaleScore, calcDesignScore, calcConstructionScore,
  getGrade, calcTrend, getPreviousPeriod
} from '~/server/utils/performance'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const query = getQuery(event)

  const now = new Date()
  const from = query.from ? new Date(query.from as string) : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = query.to ? new Date(query.to as string) : now

  const users = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, role: true }
  })

  const performanceData = []
  const prevPeriod = getPreviousPeriod(from, to)

  for (const user of users) {
    if (user.role === 'Admin') continue

    let metrics: any
    let score: number
    let prevScore = 0

    if (user.role === 'Sale') {
      metrics = await calcSaleMetrics(user.id, from, to)
      score = calcSaleScore(metrics)
      const prevMetrics = await calcSaleMetrics(user.id, prevPeriod.from, prevPeriod.to)
      prevScore = calcSaleScore(prevMetrics)
    } else if (user.role === 'Design') {
      metrics = await calcDesignMetrics(user.id, from, to)
      score = calcDesignScore(metrics)
      const prevMetrics = await calcDesignMetrics(user.id, prevPeriod.from, prevPeriod.to)
      prevScore = calcDesignScore(prevMetrics)
    } else if (user.role === 'Construction') {
      metrics = await calcConstructionMetrics(user.id, from, to)
      score = calcConstructionScore(metrics)
      const prevMetrics = await calcConstructionMetrics(user.id, prevPeriod.from, prevPeriod.to)
      prevScore = calcConstructionScore(prevMetrics)
    } else {
      continue
    }

    const gradeInfo = getGrade(score)

    performanceData.push({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      score,
      grade: gradeInfo.grade,
      grade_color: gradeInfo.gradeColor,
      trend: calcTrend(score, prevScore),
      prev_score: prevScore,
      metrics
    })
  }

  performanceData.sort((a, b) => b.score - a.score)

  const byRole = {
    Sale: performanceData.filter(p => p.role === 'Sale'),
    Design: performanceData.filter(p => p.role === 'Design'),
    Construction: performanceData.filter(p => p.role === 'Construction')
  }

  const avgScore = performanceData.length > 0
    ? performanceData.reduce((sum, p) => sum + p.score, 0) / performanceData.length
    : 0

  const gradeDistribution = {
    'A+': performanceData.filter(p => p.grade === 'A+').length,
    'A': performanceData.filter(p => p.grade === 'A').length,
    'B+': performanceData.filter(p => p.grade === 'B+').length,
    'B': performanceData.filter(p => p.grade === 'B').length,
    'C': performanceData.filter(p => p.grade === 'C').length,
    'D': performanceData.filter(p => p.grade === 'D').length
  }

  const topPerformers = performanceData.slice(0, 3)
  const needsAttention = performanceData.filter(p => p.grade === 'D' || p.trend === 'down')

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      total_users: performanceData.length,
      avg_score: Math.round(avgScore),
      grade_distribution: gradeDistribution
    },
    top_performers: topPerformers.map(p => ({
      user_id: p.user_id,
      user_name: p.user_name,
      role: p.role,
      score: p.score,
      grade: p.grade
    })),
    needs_attention: needsAttention.slice(0, 3).map(p => ({
      user_id: p.user_id,
      user_name: p.user_name,
      role: p.role,
      score: p.score,
      grade: p.grade,
      trend: p.trend
    })),
    by_role: {
      Sale: byRole.Sale.map((p, i) => ({ rank: i + 1, ...p })),
      Design: byRole.Design.map((p, i) => ({ rank: i + 1, ...p })),
      Construction: byRole.Construction.map((p, i) => ({ rank: i + 1, ...p }))
    },
    all: performanceData.map((p, i) => ({ rank: i + 1, ...p }))
  }
})
