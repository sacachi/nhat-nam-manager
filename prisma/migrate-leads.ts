import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting lead migration...\n')

  const leads = await prisma.customerLead.findMany()

  let migrated = 0
  let skipped = 0

  for (const lead of leads) {
    const updates: any = {}

    if (lead.status === 'pending') {
      updates.status = 'pending'
      updates.design_status = 'not_assigned'
      migrated++
    } else if (lead.status === 'reviewed') {
      updates.status = 'reviewed'
      updates.design_status = 'approved'
      migrated++
    } else if (lead.status === 'converted') {
      updates.design_status = 'approved'
      migrated++
    } else if (lead.status === 'rejected') {
      updates.design_status = 'not_assigned'
      migrated++
    } else {
      skipped++
      continue
    }

    if (Object.keys(updates).length > 0) {
      await prisma.customerLead.update({
        where: { id: lead.id },
        data: updates
      })
      console.log(`✓ Lead #${lead.id}: status=${lead.status} → ${updates.status}, design_status → ${updates.design_status || 'unchanged'}`)
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Migrated: ${migrated}`)
  console.log(`Skipped: ${skipped}`)
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
