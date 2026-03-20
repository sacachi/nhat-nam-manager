import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = process.env.ADMIN_PASSWORD || '123456@Abc'
  const hashedPassword = await bcrypt.hash(password, 10)

  console.log('\n========== SEEDING USERS ==========')
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, role: 'Admin' },
    create: {
      name: 'Quản trị viên',
      username: 'admin',
      email: 'admin@nhatnam.vn',
      password: hashedPassword,
      role: 'Admin',
      status: 'active'
    }
  })
  console.log('✓ Admin:', admin.username)

  const saleUsers = [
    { name: 'Nguyễn Văn Sale', username: 'sale_1', email: 'sale1@nhatnam.vn' },
    { name: 'Trần Thị Sale', username: 'sale_2', email: 'sale2@nhatnam.vn' },
  ]
  for (const u of saleUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: 'Sale' },
      create: { ...u, password: hashedPassword, role: 'Sale', status: 'active' }
    })
  }
  console.log('✓ Sale users:', saleUsers.length)

  const designUsers = [
    { name: 'Lê Văn Design', username: 'design_1', email: 'design1@nhatnam.vn' },
    { name: 'Phạm Thị Design', username: 'design_2', email: 'design2@nhatnam.vn' },
  ]
  for (const u of designUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: 'Design' },
      create: { ...u, password: hashedPassword, role: 'Design', status: 'active' }
    })
  }
  console.log('✓ Design users:', designUsers.length)

  const constructionUsers = [
    { name: 'Hoàng Văn Construction', username: 'construction_1', email: 'construction1@nhatnam.vn' },
    { name: 'Đặng Văn Construction', username: 'construction_2', email: 'construction2@nhatnam.vn' },
  ]
  for (const u of constructionUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: 'Construction' },
      create: { ...u, password: hashedPassword, role: 'Construction', status: 'active' }
    })
  }
  console.log('✓ Construction users:', constructionUsers.length)

  const accountingUsers = [
    { name: 'Phan Văn Kế toán', username: 'accounting_1', email: 'accounting1@nhatnam.vn' },
  ]
  for (const u of accountingUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: 'Accounting' },
      create: { ...u, password: hashedPassword, role: 'Accounting', status: 'active' }
    })
  }
  console.log('✓ Accounting users:', accountingUsers.length)

  console.log('\n========== SEEDING CUSTOMERS ==========')

  const customers = [
    { id: 'cust_1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@email.com', address: '123 Đường ABC, Quận 1, TP.HCM' },
    { id: 'cust_2', name: 'Trần Thị B', phone: '0912345678', email: 'tranthib@email.com', address: '456 Đường XYZ, Quận 2, TP.HCM' },
    { id: 'cust_3', name: 'Lê Văn C', phone: '0923456789', email: 'levanc@email.com', address: '789 Đường DEF, Quận 3, TP.HCM' },
    { id: 'cust_4', name: 'Phạm Thị D', phone: '0934567890', email: 'phamthid@email.com', address: '321 Đường GHI, Quận 4, TP.HCM' },
    { id: 'cust_5', name: 'Hoàng Văn E', phone: '0945678901', email: 'hoangvane@email.com', address: '654 Đường JKL, Quận 5, TP.HCM' },
  ]
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: c,
      create: c
    })
  }
  console.log('✓ Customers:', customers.length)

  console.log('\n========== SEEDING PROJECTS ==========')

  const dbCustomers = await prisma.customer.findMany()
  const sale = await prisma.user.findFirst({ where: { role: 'Sale' } })

  const projects = [
    { name: 'Công trình Nguyễn Văn A - Tủ Bếp', contract_value: 85000000, status: 'đang thi công' },
    { name: 'Công trình Trần Thị B - Tủ Áo', contract_value: 65000000, status: 'đã hoàn thành' },
    { name: 'Công trình Lê Văn C - Tủ Bếp + Tủ Áo', contract_value: 120000000, status: 'đang thi công' },
    { name: 'Công trình Phạm Thị D - Ốp Tường', contract_value: 45000000, status: 'tạm dừng' },
    { name: 'Công trình Hoàng Văn E - Tủ Tivi', contract_value: 55000000, status: 'đang thi công' },
  ]

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const customer = dbCustomers[i]
    const created = await prisma.project.upsert({
      where: { id: `project_${i + 1}` },
      update: {
        name: project.name,
        customer_id: customer?.id,
        contract_value: project.contract_value,
        status: project.status,
        start_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      },
      create: {
        id: `project_${i + 1}`,
        name: project.name,
        customer_id: customer?.id || null,
        contract_value: project.contract_value,
        status: project.status,
        start_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      }
    })
    console.log('✓ Project:', created.name)
  }

  console.log('\n========== SEEDING RECEIPTS ==========')

  const dbProjects = await prisma.project.findMany()
  const allUsers = await prisma.user.findMany()

  let receiptCount = 0
  for (const project of dbProjects) {
    const numReceipts = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < numReceipts; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)]
      const receipt = {
        project_id: project.id,
        amount: Math.floor(Math.random() * 30000000) + 10000000,
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        note: `Thu tiền đợt ${i + 1}`,
        created_by: user.id
      }
      await prisma.receipt.create({ data: receipt })
      receiptCount++
    }
  }
  console.log('✓ Receipts:', receiptCount)

  console.log('\n========== SEEDING EXPENSES ==========')

  let expenseCount = 0
  for (const project of dbProjects) {
    const materialExpense = {
      project_id: project.id,
      type: 'material',
      amount: Math.floor(Math.random() * 20000000) + 5000000,
      date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      note: 'Chi vật tư',
      created_by: allUsers[0].id
    }
    await prisma.expense.create({ data: materialExpense })
    expenseCount++

    const laborExpense = {
      project_id: project.id,
      type: 'labor',
      amount: Math.floor(Math.random() * 10000000) + 3000000,
      date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      note: 'Chi khoán thợ',
      created_by: allUsers[0].id
    }
    await prisma.expense.create({ data: laborExpense })
    expenseCount++
  }
  console.log('✓ Expenses:', expenseCount)

  console.log('\n========== SEEDING CUSTOMER LEADS ==========')

  const leadStatuses = ['pending', 'pending', 'pending', 'reviewed', 'converted', 'rejected']
  const designStatuses = ['not_assigned', 'assigned', 'in_progress', 'review_requested', 'approved', 'rejected']
  const designUser = await prisma.user.findFirst({ where: { role: 'Design' } })
  const designUser2 = await prisma.user.findFirst({ where: { role: 'Design' }, skip: 1 })
  const leads = [
    {
      customer_name: 'Võ Thị Khách Hàng Mới 1',
      phone: '0987654321',
      address: '111 Đường Mới 1, Quận 6, TP.HCM',
      construction_categories: JSON.stringify(['Kitchen', 'Wardrobe']),
      description: 'Khách hàng muốn làm tủ bếp và tủ áo cho căn hộ mới 70m2. Yêu cầu gỗ công nghiệp bền đẹp.',
      construction_value: 95000000,
      status: 'pending',
      design_status: 'not_assigned',
      designer_id: null
    },
    {
      customer_name: 'Bùi Văn Khách Hàng Mới 2',
      phone: '0977654321',
      address: '222 Đường Mới 2, Quận 7, TP.HCM',
      construction_categories: JSON.stringify(['Kitchen']),
      description: 'Cần làm tủ bếp chữ L cho nhà phố. Kích thước khoảng 3m x 2m.',
      construction_value: 72000000,
      status: 'pending',
      design_status: 'not_assigned',
      designer_id: null
    },
    {
      customer_name: 'Đỗ Thị Khách Hàng Mới 3',
      phone: '0967654321',
      address: '333 Đường Mới 3, Quận 8, TP.HCM',
      construction_categories: JSON.stringify(['WallPanels', 'Ceiling']),
      description: 'Ốp tường phòng khách và trần thạch cao. Phong cách hiện đại.',
      construction_value: 58000000,
      status: 'reviewed',
      design_status: 'in_progress',
      designer_id: designUser?.id || null,
      design_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      customer_name: 'Trịnh Văn Khách Hàng Mới 4',
      phone: '0957654321',
      address: '444 Đường Mới 4, Quận 9, TP.HCM',
      construction_categories: JSON.stringify(['TVCabinet', 'Wardrobe']),
      description: 'Làm tủ tivi phòng khách và tủ áo phòng ngủ master.',
      construction_value: 88000000,
      status: 'converted',
      design_status: 'approved',
      designer_id: designUser2?.id || null,
      design_deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      customer_name: 'Lý Thị Khách Hàng Mới 5',
      phone: '0947654321',
      address: '555 Đường Mới 5, Quận 10, TP.HCM',
      construction_categories: JSON.stringify(['Staircase']),
      description: 'Cần làm cầu thang gỗ cho nhà 3 tầng. Yêu cầu thiết kế hiện đại.',
      construction_value: 110000000,
      status: 'rejected',
      design_status: 'not_assigned',
      designer_id: null
    },
  ]

  for (const lead of leads) {
    await prisma.customerLead.create({
      data: {
        ...lead,
        sale_user_id: sale?.id || admin.id,
        design_submission_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
  }
  console.log('✓ Customer Leads:', leads.length)

  console.log('\n========== SEEDING PROJECT TASKS ==========')

  const allProjects = await prisma.project.findMany()
  const constructionUser = await prisma.user.findFirst({ where: { role: 'Construction' } })
  const constructionUser2 = await prisma.user.findFirst({ where: { role: 'Construction' }, skip: 1 })
  const designUser3 = await prisma.user.findFirst({ where: { role: 'Design' } })

  const tasks = [
    { project_idx: 0, title: 'Đo đạc hiện trường', type: 'inspection', priority: 'high', status: 'completed' },
    { project_idx: 0, title: 'Thiết kế 3D nội thất', type: 'design', priority: 'high', status: 'in_progress' },
    { project_idx: 0, title: 'Đóng tủ bếp', type: 'construction', priority: 'medium', status: 'pending' },
    { project_idx: 0, title: 'Hoàn thiện bề mặt', type: 'construction', priority: 'medium', status: 'pending' },
    { project_idx: 1, title: 'Lắp đặt tủ áo', type: 'construction', priority: 'medium', status: 'completed' },
    { project_idx: 1, title: 'Kiểm tra hoàn thiện', type: 'inspection', priority: 'low', status: 'pending' },
    { project_idx: 2, title: 'Thiết kế nội thất tổng thể', type: 'design', priority: 'high', status: 'in_progress' },
    { project_idx: 2, title: 'Đóng tủ bếp + tủ áo', type: 'construction', priority: 'high', status: 'pending' },
    { project_idx: 2, title: 'Kiểm tra điện nước', type: 'inspection', priority: 'medium', status: 'pending' },
    { project_idx: 3, title: 'Ốp tường phòng khách', type: 'construction', priority: 'medium', status: 'pending' },
    { project_idx: 4, title: 'Lắp đặt tủ tivi', type: 'construction', priority: 'medium', status: 'in_progress' },
  ]

  let taskCount = 0
  const createdTasks = []
  for (const task of tasks) {
    const project = allProjects[task.project_idx]
    if (project) {
      const isOverdue = Math.random() > 0.7
      const deadline = isOverdue 
        ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000)
      
      const createdTask = await prisma.projectTask.create({
        data: {
          project_id: project.id,
          title: task.title,
          description: `Mô tả công việc: ${task.title}`,
          type: task.type,
          priority: task.priority,
          status: task.status,
          assignee_id: task.type === 'design' ? designUser3?.id : (Math.random() > 0.5 ? constructionUser?.id : constructionUser2?.id),
          deadline,
          created_by: admin.id,
          completed_at: task.status === 'completed' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null
        }
      })
      createdTasks.push(createdTask)
      taskCount++
    }
  }
  console.log('✓ Project Tasks:', taskCount)

  console.log('\n========== SEEDING NOTIFICATIONS ==========')

  const notificationTypes = ['task_assigned', 'task_overdue', 'task_completed', 'project_update', 'reminder']
  let notifCount = 0

  for (const user of allUsers) {
    const numNotifications = Math.floor(Math.random() * 5) + 2
    for (let i = 0; i < numNotifications; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      let title = '', message = '', link = '/my-tasks'
      
      switch (type) {
        case 'task_assigned':
          title = 'Công việc mới được giao'
          message = 'Bạn có công việc mới cần xử lý'
          break
        case 'task_overdue':
          title = 'Công việc quá hạn'
          message = 'Một số công việc đã quá hạn xử lý'
          break
        case 'task_completed':
          title = 'Công việc đã hoàn thành'
          message = 'Công việc được đánh dấu hoàn thành'
          break
        case 'project_update':
          title = 'Cập nhật công trình'
          message = 'Có thông tin mới về công trình bạn tham gia'
          break
        case 'reminder':
          title = 'Nhắc nhở'
          message = 'Bạn có công việc cần xử lý trong hôm nay'
          break
      }
      
      await prisma.notification.create({
        data: {
          user_id: user.id,
          type,
          title,
          message,
          link,
          is_read: Math.random() > 0.5,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })
      notifCount++
    }
  }
  console.log('✓ Notifications:', notifCount)

  console.log('\n========== SEEDING ACTIVITY LOGS ==========')

  let logCount = 0
  const logActions = ['create', 'update', 'delete']
  const logEntities = ['customer', 'project', 'receipt', 'expense', 'project_task', 'customer_lead']
  
  for (const project of allProjects) {
    const numLogs = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < numLogs; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)]
      const action = logActions[Math.floor(Math.random() * logActions.length)]
      const entity = logEntities[Math.floor(Math.random() * logEntities.length)]
      
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action,
          entity,
          entity_id: project.id,
          new_data: JSON.stringify({ name: project.name, status: project.status }),
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      })
      logCount++
    }
  }
  console.log('✓ Activity Logs:', logCount)

  console.log('\n========== SEEDING SUPPLIERS ==========')

  const suppliers = [
    { code: 'NCC001', name: 'Công ty TNHH Gỗ An Phú', phone: '02812345678', email: 'contact@anphuwood.vn', address: '123 Đường CN 5, KCN Tân Bình, TP.HCM', note: 'Liên hệ: Nguyễn Văn Phú' },
    { code: 'NCC002', name: 'Ván ép Hoàng Gia', phone: '02823456789', email: 'info@hoanggiavenep.vn', address: '456 Đường CN 7, KCN Bình Chiểu, TP.HCM', note: 'Liên hệ: Trần Thị Hoa' },
    { code: 'NCC003', name: 'Sơn công nghiệp Thanh Sơn', phone: '02834567890', email: 'sonthanhtoan@gmail.com', address: '789 Đường Lê Văn Việt, Quận 9, TP.HCM', note: 'Liên hệ: Lê Văn Sơn' },
    { code: 'NCC004', name: 'Phụ kiện nội thất Phú Thịnh', phone: '02845678901', email: 'phuthinh.pk@gmail.com', address: '321 Đường Số 1, KCN Hiệp Bình Phước, TP.HCM', note: 'Liên hệ: Phạm Văn Thịnh' },
    { code: 'NCC005', name: 'Tấm laminate Hùng Phát', phone: '02856789012', email: 'hungphatlaminate@yahoo.com', address: '654 Đường CN 3, KCN Vĩnh Lộc, TP.HCM', note: 'Liên hệ: Đặng Văn Phát' },
  ]

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: { name: s.name, phone: s.phone, email: s.email, address: s.address, note: s.note },
      create: { ...s }
    })
  }
  console.log('✓ Suppliers:', suppliers.length)

  console.log('\n========== SEEDING MATERIALS ==========')

  const materials = [
    { code: 'VT001', name: 'Gỗ MDF phủ melamine', unit: 'Tấm', min_stock_level: 50, description: '1220x2440x18mm - Gỗ MDF phủ melamine trắng, chống ẩm' },
    { code: 'VT002', name: 'Gỗ MDF phủ veneer', unit: 'Tấm', min_stock_level: 30, description: '1220x2440x18mm - Gỗ MDF phủ veneer sồi tự nhiên' },
    { code: 'VT003', name: 'Gỗ Plywood', unit: 'Tấm', min_stock_level: 20, description: '1220x2440x12mm - Gỗ Plywood chịu lực tốt' },
    { code: 'VT004', name: 'Tấm HDF', unit: 'Tấm', min_stock_level: 15, description: '1220x2440x6mm - Tấm HDF lót sàn' },
    { code: 'VT005', name: 'Lamington trắng', unit: 'Thanh', min_stock_level: 100, description: '3000x100x18mm - Lamington trắng pure' },
    { code: 'VT006', name: 'Lamington vân gỗ', unit: 'Thanh', min_stock_level: 80, description: '3000x100x18mm - Lamington vân sồi' },
    { code: 'VT007', name: 'Ray trượt ngăn kéo', unit: 'Bộ', min_stock_level: 50, description: '500mm - Ray trượt Blum soft close' },
    { code: 'VT008', name: 'Bản lề cửa', unit: 'Cái', min_stock_level: 100, description: '35mm - Bản lề giảm chấn' },
    { code: 'VT009', name: 'Tay nắm cửa', unit: 'Cái', min_stock_level: 80, description: '160mm - Tay nắm Inox304' },
    { code: 'VT010', name: 'Sơn lót PU', unit: 'Thùng', min_stock_level: 10, description: '5kg/thùng - Sơn lót PU hệ nước' },
    { code: 'VT011', name: 'Sơn hoàn thiện PU', unit: 'Thùng', min_stock_level: 10, description: '5kg/thùng - Sơn hoàn thiện PU bóng' },
    { code: 'VT012', name: 'Sơn màu NC', unit: 'Thùng', min_stock_level: 5, description: '2.5kg/thùng - Sơn màu NC trắng' },
    { code: 'VT013', name: 'Bạt giấy mịn', unit: 'Kg', min_stock_level: 20, description: '280# - Bạt giấy mịn cho sơn NC' },
    { code: 'VT014', name: 'Dung môi NC', unit: 'Lít', min_stock_level: 30, description: 'Dung môi pha sơn NC' },
    { code: 'VT015', name: 'Bông vải', unit: 'Kg', min_stock_level: 10, description: 'Bông vải đánh bóng gỗ' },
  ]

  for (const m of materials) {
    const stock = Math.floor(Math.random() * 200) + 20
    const avgCost = Math.floor(Math.random() * 500000) + 100000
    await prisma.material.upsert({
      where: { code: m.code },
      update: { name: m.name, unit: m.unit, min_stock_level: m.min_stock_level, description: m.description },
      create: {
        ...m,
        current_stock: stock,
        avg_cost: avgCost,
        stock_value: stock * avgCost
      }
    })
  }
  console.log('✓ Materials:', materials.length)

  console.log('\n========== SEEDING STOCK IN ==========')

  const existingStockIns = await prisma.stockIn.count()
  if (existingStockIns > 0) {
    console.log('  Stock Ins already exist, skipping...')
  } else {
    const dbMaterials = await prisma.material.findMany()
    const dbSuppliers = await prisma.supplier.findMany()

    const stockInData = [
      { supplier_idx: 0, items: [{ mat_idx: 0, qty: 20, price: 350000 }, { mat_idx: 1, qty: 10, price: 420000 }] },
      { supplier_idx: 1, items: [{ mat_idx: 2, qty: 15, price: 280000 }, { mat_idx: 3, qty: 8, price: 180000 }] },
      { supplier_idx: 2, items: [{ mat_idx: 9, qty: 5, price: 450000 }, { mat_idx: 10, qty: 5, price: 520000 }] },
    ]

    let stockInCount = 0
    for (let i = 0; i < stockInData.length; i++) {
      const si = stockInData[i]
      const supplier = dbSuppliers[si.supplier_idx]
      if (!supplier) continue

      const totalAmount = si.items.reduce((sum, item) => {
        const mat = dbMaterials[item.mat_idx]
        return sum + (item.qty * item.price)
      }, 0)

      const stockIn = await prisma.stockIn.create({
        data: {
          code: `PNK${String(i + 1).padStart(5, '0')}`,
          supplier_id: supplier.id,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          total_amount: totalAmount,
          paid_amount: Math.floor(totalAmount * 0.3),
          note: 'Nhập kho ban đầu',
          created_by: admin.id
        }
      })

      for (const item of si.items) {
        const mat = dbMaterials[item.mat_idx]
        if (!mat) continue

        await prisma.stockInItem.create({
          data: {
            stock_in_id: stockIn.id,
            material_id: mat.id,
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.qty * item.price,
            avg_cost_before: mat.avg_cost,
            avg_cost_after: item.price
          }
        })

        await prisma.material.update({
          where: { id: mat.id },
          data: {
            current_stock: mat.current_stock + item.qty,
            avg_cost: item.price,
            stock_value: (mat.current_stock + item.qty) * item.price
          }
        })

        await prisma.stockLog.create({
          data: {
            material_id: mat.id,
            type: 'IN',
            reference_id: stockIn.id,
            reference_code: stockIn.code,
            quantity: item.qty,
            unit_price: item.price,
            stock_before: mat.current_stock,
            stock_after: mat.current_stock + item.qty,
            avg_cost_before: mat.avg_cost,
            avg_cost_after: item.price,
            value_before: mat.current_stock * mat.avg_cost,
            value_after: (mat.current_stock + item.qty) * item.price
          }
        })
      }

      stockInCount++
    }
    console.log('✓ Stock Ins:', stockInCount)
  }

  console.log('\n========== SEED COMPLETE ==========')
  console.log('Login credentials:')
  console.log('  Admin: admin /', password)
  console.log('  Sale: sale_1 /', password)
  console.log('  Design: design_1 /', password)
  console.log('  Construction: construction_1 /', password)
  console.log('  Accounting: accounting_1 /', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
