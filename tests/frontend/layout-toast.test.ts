import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('default layout toast outlet', () => {
  it('renders a PrimeVue Toast container in the default layout', () => {
    const filePath = resolve(__dirname, '../../layouts/default.vue')
    const content = readFileSync(filePath, 'utf-8')

    expect(content).toContain('<Toast position="top-right" />')
  })
})