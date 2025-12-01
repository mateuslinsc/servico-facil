import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Helper function to generate ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// === AUTH ROUTES ===

// Sign up
app.post('/make-server-4ede0739/signup', async (c) => {
  try {
    const { email, password, name, type } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, type },
      email_confirm: true // Auto-confirm email
    })
    
    if (error) throw error
    
    // Create user profile in KV store
    const userId = data.user.id
    const userProfile = {
      id: userId,
      email,
      name,
      type, // 'client' or 'institution'
      createdAt: new Date().toISOString(),
      favorites: []
    }
    
    // If institution, set institutionId to userId
    if (type === 'institution') {
      userProfile.institutionId = userId
    }
    
    await kv.set(`user:${userId}`, userProfile)
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Error during sign up:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get current user profile
app.get('/make-server-4ede0739/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const profile = await kv.get(`user:${user.id}`)
    return c.json({ profile })
  } catch (error) {
    console.log('Error fetching profile:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === INSTITUTION ROUTES ===

// Create institution profile (requires auth)
app.post('/make-server-4ede0739/institutions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const institutionData = await c.req.json()
    const institutionId = generateId()
    
    const institution = {
      id: institutionId,
      userId: user.id,
      ...institutionData,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`institution:${institutionId}`, institution)
    
    // Update user profile with institution ID
    const userProfile = await kv.get(`user:${user.id}`)
    if (userProfile) {
      userProfile.institutionId = institutionId
      await kv.set(`user:${user.id}`, userProfile)
    }
    
    return c.json({ success: true, institution })
  } catch (error) {
    console.log('Error creating institution:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get all institutions
app.get('/make-server-4ede0739/institutions', async (c) => {
  try {
    const institutions = await kv.getByPrefix('institution:')
    return c.json({ institutions })
  } catch (error) {
    console.log('Error fetching institutions:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get institution by ID
app.get('/make-server-4ede0739/institutions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const institution = await kv.get(`institution:${id}`)
    
    if (!institution) {
      return c.json({ error: 'Institution not found' }, 404)
    }
    
    return c.json({ institution })
  } catch (error) {
    console.log('Error fetching institution:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === SERVICE ROUTES ===

// Create service (requires auth and institution)
app.post('/make-server-4ede0739/services', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const serviceData = await c.req.json()
    const serviceId = generateId()
    
    const service = {
      id: serviceId,
      ...serviceData,
      createdAt: new Date().toISOString(),
      reviews: [],
      rating: 0
    }
    
    await kv.set(`service:${serviceId}`, service)
    
    return c.json({ success: true, service })
  } catch (error) {
    console.log('Error creating service:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get all services
app.get('/make-server-4ede0739/services', async (c) => {
  try {
    const search = c.req.query('search')
    const category = c.req.query('category')
    
    let services = await kv.getByPrefix('service:')
    
    // Filter by search term
    if (search) {
      services = services.filter(s => 
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.category?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Filter by category
    if (category && category !== 'all') {
      services = services.filter(s => s.category === category)
    }
    
    return c.json({ services })
  } catch (error) {
    console.log('Error fetching services:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get service by ID
app.get('/make-server-4ede0739/services/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const service = await kv.get(`service:${id}`)
    
    if (!service) {
      return c.json({ error: 'Service not found' }, 404)
    }
    
    return c.json({ service })
  } catch (error) {
    console.log('Error fetching service:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Update service (requires auth)
app.put('/make-server-4ede0739/services/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const id = c.req.param('id')
    const updates = await c.req.json()
    
    const service = await kv.get(`service:${id}`)
    if (!service) {
      return c.json({ error: 'Service not found' }, 404)
    }
    
    const updatedService = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`service:${id}`, updatedService)
    
    return c.json({ success: true, service: updatedService })
  } catch (error) {
    console.log('Error updating service:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Delete service (requires auth)
app.delete('/make-server-4ede0739/services/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const id = c.req.param('id')
    await kv.del(`service:${id}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting service:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === APPOINTMENT ROUTES ===

// Create appointment (requires auth)
app.post('/make-server-4ede0739/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const appointmentData = await c.req.json()
    const appointmentId = generateId()
    
    const appointment = {
      id: appointmentId,
      userId: user.id,
      ...appointmentData,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`appointment:${appointmentId}`, appointment)
    
    // Create notification for appointment
    const notificationId = generateId()
    const notification = {
      id: notificationId,
      userId: user.id,
      type: 'appointment',
      title: 'Agendamento Confirmado',
      message: `Seu agendamento para ${appointmentData.serviceName} foi criado com sucesso!`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: appointmentId
    }
    await kv.set(`notification:${notificationId}`, notification)
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Error creating appointment:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get user appointments (requires auth)
app.get('/make-server-4ede0739/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const allAppointments = await kv.getByPrefix('appointment:')
    const userAppointments = allAppointments.filter(a => a.userId === user.id)
    
    return c.json({ appointments: userAppointments })
  } catch (error) {
    console.log('Error fetching appointments:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Update appointment status (requires auth)
app.put('/make-server-4ede0739/appointments/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const id = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointment = await kv.get(`appointment:${id}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    appointment.status = status
    appointment.updatedAt = new Date().toISOString()
    
    await kv.set(`appointment:${id}`, appointment)
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Error updating appointment:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === REVIEW ROUTES ===

// Create review (requires auth)
app.post('/make-server-4ede0739/reviews', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { serviceId, rating, comment } = await c.req.json()
    const reviewId = generateId()
    
    const review = {
      id: reviewId,
      userId: user.id,
      serviceId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`review:${reviewId}`, review)
    
    // Update service rating
    const service = await kv.get(`service:${serviceId}`)
    if (service) {
      const allReviews = await kv.getByPrefix('review:')
      const serviceReviews = allReviews.filter(r => r.serviceId === serviceId)
      
      const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
      service.rating = avgRating
      service.reviewCount = serviceReviews.length
      
      await kv.set(`service:${serviceId}`, service)
    }
    
    return c.json({ success: true, review })
  } catch (error) {
    console.log('Error creating review:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get reviews for a service
app.get('/make-server-4ede0739/reviews/:serviceId', async (c) => {
  try {
    const serviceId = c.req.param('serviceId')
    const allReviews = await kv.getByPrefix('review:')
    const serviceReviews = allReviews.filter(r => r.serviceId === serviceId)
    
    return c.json({ reviews: serviceReviews })
  } catch (error) {
    console.log('Error fetching reviews:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === FAVORITES ROUTES ===

// Toggle favorite (requires auth)
app.post('/make-server-4ede0739/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { serviceId } = await c.req.json()
    
    const userProfile = await kv.get(`user:${user.id}`)
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404)
    }
    
    if (!userProfile.favorites) {
      userProfile.favorites = []
    }
    
    const index = userProfile.favorites.indexOf(serviceId)
    if (index > -1) {
      userProfile.favorites.splice(index, 1)
    } else {
      userProfile.favorites.push(serviceId)
    }
    
    await kv.set(`user:${user.id}`, userProfile)
    
    return c.json({ success: true, favorites: userProfile.favorites })
  } catch (error) {
    console.log('Error toggling favorite:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get user favorites (requires auth)
app.get('/make-server-4ede0739/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const userProfile = await kv.get(`user:${user.id}`)
    const favoriteIds = userProfile?.favorites || []
    
    const allServices = await kv.getByPrefix('service:')
    const favoriteServices = allServices.filter(s => favoriteIds.includes(s.id))
    
    return c.json({ favorites: favoriteServices })
  } catch (error) {
    console.log('Error fetching favorites:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === ANALYTICS ROUTES ===

// Get admin analytics (requires auth)
app.get('/make-server-4ede0739/analytics', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const services = await kv.getByPrefix('service:')
    const appointments = await kv.getByPrefix('appointment:')
    const reviews = await kv.getByPrefix('review:')
    const users = await kv.getByPrefix('user:')
    
    // Calculate stats
    const totalServices = services.length
    const totalAppointments = appointments.length
    const totalReviews = reviews.length
    const totalUsers = users.length
    
    // Appointments by status
    const appointmentsByStatus = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {})
    
    // Services by category
    const servicesByCategory = services.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1
      return acc
    }, {})
    
    // Monthly appointments (last 6 months)
    const now = new Date()
    const monthlyAppointments = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
      const count = appointments.filter(a => {
        const appointmentDate = new Date(a.date)
        return appointmentDate.getMonth() === date.getMonth() && 
               appointmentDate.getFullYear() === date.getFullYear()
      }).length
      monthlyAppointments.push({ month: monthName, count })
    }
    
    return c.json({
      totalServices,
      totalAppointments,
      totalReviews,
      totalUsers,
      appointmentsByStatus,
      servicesByCategory,
      monthlyAppointments
    })
  } catch (error) {
    console.log('Error fetching analytics:', error)
    return c.json({ error: error.message }, 400)
  }
})

// === NOTIFICATION ROUTES ===

// Get user notifications (requires auth)
app.get('/make-server-4ede0739/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const allNotifications = await kv.getByPrefix('notification:')
    const userNotifications = allNotifications
      .filter(n => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ notifications: userNotifications })
  } catch (error) {
    console.log('Error fetching notifications:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Mark notification as read (requires auth)
app.put('/make-server-4ede0739/notifications/:id/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const id = c.req.param('id')
    const notification = await kv.get(`notification:${id}`)
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404)
    }
    
    notification.read = true
    await kv.set(`notification:${id}`, notification)
    
    return c.json({ success: true, notification })
  } catch (error) {
    console.log('Error marking notification as read:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Mark all notifications as read (requires auth)
app.put('/make-server-4ede0739/notifications/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const allNotifications = await kv.getByPrefix('notification:')
    const userNotifications = allNotifications.filter(n => n.userId === user.id)
    
    for (const notification of userNotifications) {
      notification.read = true
      await kv.set(`notification:${notification.id}`, notification)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error marking all as read:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Delete notification (requires auth)
app.delete('/make-server-4ede0739/notifications/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const id = c.req.param('id')
    await kv.del(`notification:${id}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting notification:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Create notification (internal use)
app.post('/make-server-4ede0739/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const notificationData = await c.req.json()
    const notificationId = generateId()
    
    const notification = {
      id: notificationId,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`notification:${notificationId}`, notification)
    
    return c.json({ success: true, notification })
  } catch (error) {
    console.log('Error creating notification:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Clean services without images (admin only)
app.delete('/make-server-4ede0739/services/clean-no-images', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const allServices = await kv.getByPrefix('service:')
    let deletedCount = 0
    
    for (const service of allServices) {
      if (!service.image) {
        await kv.del(`service:${service.id}`)
        deletedCount++
      }
    }
    
    return c.json({ success: true, deletedCount })
  } catch (error) {
    console.log('Error cleaning services:', error)
    return c.json({ error: error.message }, 400)
  }
})

Deno.serve(app.fetch)