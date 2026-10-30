import { defineTrack } from '@/core/tracks'
import { routes } from './routes'

export default defineTrack({
  id: 'maintenance-tickets',
  title: 'Maintenance Tickets',
  description: 'आवाज (Avaaj) - Student Grievance Cell & Campus Maintenance FixIt System for Team 21',
  team: 'Team 21',
  icon: '🛠️',
  routes,
})
