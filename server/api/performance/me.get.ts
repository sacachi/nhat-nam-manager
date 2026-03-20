import { getAuthUser } from '~/server/utils/auth'
import {
  calcSaleMetrics, calcDesignMetrics, calcConstructionMetrics,
  calcSaleScore, calcDesignScore, calcConstructionScore,
  getGrade, calcTrend, getPreviousPeriod
} from '~/server/utils/performance'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)

  const now = new Date()
  const from = query.from ? new Date(query.from as string) : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = query.to ? new Date(query.to as string) : now

  if (user.role === 'Admin') {
    throw createError({ statusCode: 400, statusMessage: 'Admin không có hiệu suất cá nhân' })
  }

  let metrics: any
  let score: number
  let prevScore = 0
  const prevPeriod = getPreviousPeriod(from, to)

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
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
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
    metrics,
    team_comparison: {
      team_size: teamScores.length,
      your_rank: userRank,
      team_avg_score: Math.round(teamAvgScore),
      your_score: score,
      percentile: Math.round(((teamScores.length - userRank) / teamScores.length) * 100)
    }
  }
})
