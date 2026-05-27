const fs = require('fs')
let c = fs.readFileSync('app/agenda/page.tsx', 'utf8')
c = c.replace(
  `async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id); load()
  }`,
  `async function completeTask(id: string) {
    const task = tasks.find((t:any) => t.id === id)
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    if (task?.is_recurring && task?.recurrence && task?.date) {
      const d = new Date(task.date + 'T12:00:00')
      if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
      else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7)
      else d.setDate(d.getDate() + 1)
      await supabase.from('tasks').insert({id:crypto.randomUUID(),title:task.title,date:d.toISOString().split('T')[0],time:task.time||null,priority:task.priority,category:task.category,type:'task',status:'PENDING',is_recurring:true,recurrence:task.recurrence,amount:task.amount||null,financial_type:task.financial_type||null,financial_category:task.financial_category||null,notes:task.notes||null,user_id:USER_ID})
    }
    if (task?.amount && task?.financial_type) {
      const ex = await supabase.from('transactions').select('id').eq('task_id', id).single()
      if (!ex.data) await supabase.from('transactions').insert({id:crypto.randomUUID(),title:task.title,amount:parseFloat(task.amount),type:task.financial_type,category:task.financial_category||'outros',date:task.date||new Date().toISOString().split('T')[0],notes:task.notes||null,task_id:id,user_id:USER_ID})
    }
    load()
  }`
)
fs.writeFileSync('app/agenda/page.tsx', c)
console.log('OK')
