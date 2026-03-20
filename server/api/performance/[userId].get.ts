import prisma from '~/server/utils/prisma'
import {
  calcSaleMetrics, calcDesignMetrics, calcConstructionMetrics,
  calcSaleScore, calcDesignScore, calcConstructionScore,
  getGrade, calcTrend, getPreviousPeriod
} from '~/server/utils/performance'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  const query = getQuery(event)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user ID' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, status: true }
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const now = new Date()
  const from = query.from ? new Date(query.from as string) : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = query.to ? new Date(query.to as string) : now

  let metrics: any
  let score: number
  let prevScore = 0
  const prevPeriod = getPreviousPeriod(from, to)

  if (user.role === 'Sale') {
    metrics = await calcSaleMetrics(userId, from, to)
    score = calcSaleScore(metrics)
    const prevMetrics = await calcSaleMetrics(userId, prevPeriod.from, prevPeriod.to)
    prevScore = calcSaleScore(prevMetrics)
  } else if (user.role === 'Design') {
    metrics = await calcDesignMetrics(userId, from, to)
    score = calcDesignScore(metrics)
    const prevMetrics = await calcDesignMetrics(userId, prevPeriod.from, prevPeriod.to)
    prevScore = calcDesignScore(prevMetrics)
  } else if (user.role === 'Construction') {
    metrics = await calcConstructionMetrics(userId, from, to)
    score = calcConstructionScore(metrics)
    const prevMetrics = await calcConstructionMetrics(userId, prevPeriod.from, prevPeriod.to)
    prevScore = calcConstructionScore(prevMetrics)
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role for performance' })
  }

  const gradeInfo = getGrade(score)
  const trend = calcTrend(score, prevScore)

  const teamMembers = await prisma.user.findMany({
    where: { role: user.role, status: 'active' },
    select: { id: true }
  })

  let teamScores: number[] = []
  for (const member of teamMembers) {
    let memberScore = 0
    if (user.role === 'Sale') {
      const mMetrics = await calcSaleMetrics(member.id, from, to)
      memberScore = calcSaleScore(mMetrics)
    } else if (user.role === 'Design') {
      const mMetrics = await calcDesignMetrics(member.id, from, to)
      memberScore = calcDesignScore(mMetrics)
    } else {
      const mMetrics = await calcConstructionMetrics(member.id, from, to)
      memberScore = calcConstructionScore(mMetrics)
    }
    teamScores.push(memberScore)
  }

  teamScores.sort((a, b) => b - a)
  const userRank = teamScores.indexOf(score) + 1
  const teamAvgScore = teamScores.reduce((a, b) => a + b, 0) / teamScores.length

  const recentActivities = await prisma.activityLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 10
  })

  let recentLeads: any[] = []
  let recentTasks: any[] = []

  if (user.role === 'Sale') {
    recentLeads = await prisma.customerLead.findMany({
      where: {
        sale_user_id: userId,
        created_at: { gte: from, lte: to }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })
  }

  if (user.role === 'Design' || user.role === 'Construction') {
    recentTasks = await prisma.projectTask.findMany({
      where: {
        assignee_id: userId,
        created_at: { gte: from, lte: to }
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        project: { select: { name: true } }
      }
    })
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    },
    period: { from: from.toISOString(), to: to.toISOString() },
    score,
    grade: gradeInfo.grade,
    grade_color: gradeInfo.gradeColor,
    trend,
    prev_score: prevScore,
    team_comparison: {
      team_size: teamScores.length,
      your_rank: userRank,
      team_avg_score: Math.round(teamAvgScore),
      your_score: score,
      percentile: Math.round(((teamScores.length - userRank) / teamScores.length) * 100)
    },
    metrics,
    recent_activities: recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      created_at: a.created_at
    })),
    recent_leads: recentLeads.map(l => ({
      id: l.id,
      customer_name: l.customer_name,
      construction_value: l.construction_value,
      status: l.status,
      created_at: l.created_at
    })),
    recent_tasks: recentTasks.map(t => ({
      id: t.id,
      title: t.title,
      project_name: t.project?.name,
      status: t.status,
      deadline: t.deadline,
      created_at: t.created_at
    }))
  }
})
