import { describe, it, expect } from 'vitest'
import { getGrade, calcTrend, getMonthsBetween, getPreviousPeriod } from '~/server/utils/performance'

describe('getGrade', () => {
  it('score 95 → A+ success', () => {
    const result = getGrade(95)
    expect(result.grade).toBe('A+')
    expect(result.gradeColor).toBe('success')
    expect(result.score).toBe(95)
  })

  it('score 90 → A+ (boundary)', () => {
    expect(getGrade(90).grade).toBe('A+')
  })

  it('score 87 → A success', () => {
    const result = getGrade(87)
    expect(result.grade).toBe('A')
    expect(result.gradeColor).toBe('success')
  })

  it('score 85 → A (boundary)', () => {
    expect(getGrade(85).grade).toBe('A')
  })

  it('score 78 → B+ info', () => {
    const result = getGrade(78)
    expect(result.grade).toBe('B+')
    expect(result.gradeColor).toBe('info')
  })

  it('score 75 → B+ (boundary)', () => {
    expect(getGrade(75).grade).toBe('B+')
  })

  it('score 68 → B info', () => {
    const result = getGrade(68)
    expect(result.grade).toBe('B')
    expect(result.gradeColor).toBe('info')
  })

  it('score 65 → B (boundary)', () => {
    expect(getGrade(65).grade).toBe('B')
  })

  it('score 55 → C warn', () => {
    const result = getGrade(55)
    expect(result.grade).toBe('C')
    expect(result.gradeColor).toBe('warn')
  })

  it('score 50 → C (boundary)', () => {
    expect(getGrade(50).grade).toBe('C')
  })

  it('score 30 → D danger', () => {
    const result = getGrade(30)
    expect(result.grade).toBe('D')
    expect(result.gradeColor).toBe('danger')
  })

  it('score 0 → D danger', () => {
    const result = getGrade(0)
    expect(result.grade).toBe('D')
    expect(result.gradeColor).toBe('danger')
  })

  it('score 100 → A+', () => {
    expect(getGrade(100).grade).toBe('A+')
  })

  it('score 49 → D (just below C)', () => {
    expect(getGrade(49).grade).toBe('D')
  })

  it('score 89 → A (just below A+)', () => {
    expect(getGrade(89).grade).toBe('A')
  })

  it('score 84 → B+ (just below A)', () => {
    expect(getGrade(84).grade).toBe('B+')
  })

  it('score 64 → C (just below B)', () => {
    expect(getGrade(64).grade).toBe('C')
  })
})

describe('calcTrend', () => {
  it('increase > 5 → up', () => {
    expect(calcTrend(80, 70)).toBe('up')
  })

  it('decrease > 5 → down', () => {
    expect(calcTrend(70, 80)).toBe('down')
  })

  it('difference ≤ 5 → stable', () => {
    expect(calcTrend(75, 73)).toBe('stable')
  })

  it('exactly +5 → stable', () => {
    expect(calcTrend(75, 70)).toBe('stable')
  })

  it('exactly -5 → stable', () => {
    expect(calcTrend(70, 75)).toBe('stable')
  })

  it('+6 → up', () => {
    expect(calcTrend(76, 70)).toBe('up')
  })

  it('-6 → down', () => {
    expect(calcTrend(70, 76)).toBe('down')
  })

  it('same value → stable', () => {
    expect(calcTrend(50, 50)).toBe('stable')
  })
})

describe('getMonthsBetween', () => {
  it('same month → 1', () => {
    expect(getMonthsBetween(new Date('2026-03-01'), new Date('2026-03-20'))).toBe(1)
  })

  it('3 months apart → 3', () => {
    expect(getMonthsBetween(new Date('2026-01-01'), new Date('2026-04-01'))).toBe(3)
  })

  it('12 months → 12', () => {
    expect(getMonthsBetween(new Date('2025-03-01'), new Date('2026-03-01'))).toBe(12)
  })

  it('minimum is 1', () => {
    expect(getMonthsBetween(new Date('2026-03-15'), new Date('2026-03-15'))).toBe(1)
  })
})

describe('getPreviousPeriod', () => {
  it('returns a period of equal length before the given range', () => {
    const from = new Date('2026-03-01')
    const to = new Date('2026-03-31')
    const prev = getPreviousPeriod(from, to)
    expect(prev.to.getTime()).toBeLessThan(from.getTime())
    expect(prev.from.getTime()).toBeLessThan(prev.to.getTime())
  })
})
