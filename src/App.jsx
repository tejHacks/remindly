import { useState, useEffect } from 'react'
import { Bell, Plus, Check, X, Clock, Trash2, Edit3 } from 'lucide-react'

function App() {
  const [tasks, setTasks] = useState([])
  const [taskName, setTaskName] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState(5)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('remindly-tasks')
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        setTasks(parsedTasks)
        // Set up existing reminders
        parsedTasks.forEach(task => {
          if (!task.completed && task.reminderTime) {
            scheduleReminder(task)
          }
        })
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('remindly-tasks', JSON.stringify(tasks))
  }, [tasks])

  // Schedule reminder notification
  const scheduleReminder = (task) => {
    if (!task.reminderTime || task.completed) return

    const now = new Date().getTime()
    const reminderTime = new Date(task.reminderTime).getTime()
    const delay = reminderTime - now

    if (delay > 0) {
      setTimeout(() => {
        showNotification(task)
      }, delay)
    }
  }

  // Show notification with vibration
  const showNotification = (task) => {
    // Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }

    // Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`⏰ Remindly - Task Reminder`, {
        body: `Time for: ${task.name}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="m13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        tag: `task-${task.id}`,
        requireInteraction: true
      })

      // Auto close notification after 10 seconds
      setTimeout(() => notification.close(), 10000)

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }

    // Fallback alert for browsers without notification support
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      alert(`⏰ Reminder: ${task.name}`)
    }
  }

  // Add new task
  const addTask = () => {
    
    if (!taskName.trim()) {
      alert('Please enter a task name')
      return
    }

    if (!taskTime) {
      alert('Please select a time')
      return
    }

    const taskDateTime = new Date(taskTime)
    const now = new Date()

    if (taskDateTime <= now) {
      alert('Please select a future time')
      return
    }

    // Calculate reminder time
    const reminderTime = new Date(taskDateTime.getTime() - (reminderMinutes * 60 * 1000))

    if (editingTask) {
      // Update existing task
      const updatedTask = {
        ...editingTask,
        name: taskName,
        time: taskTime,
        reminderMinutes,
        reminderTime: reminderTime.toISOString(),
      }

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ))
      
      // Schedule the updated reminder
      scheduleReminder(updatedTask)
      
      setEditingTask(null)
    } else {
      // Create new task
      const newTask = {
        id: Date.now(),
        name: taskName,
        time: taskTime,
        reminderMinutes,
        reminderTime: reminderTime.toISOString(),
        completed: false,
        createdAt: new Date().toISOString()
      }

      setTasks(prev => [...prev, newTask])
      
      // Schedule the reminder
      scheduleReminder(newTask)
    }

    // Reset form
    setTaskName('')
    setTaskTime('')
    setReminderMinutes(5)
    setIsFormVisible(false)

    // Show success message
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }

  // Edit task
  const editTask = (task) => {
    setTaskName(task.name)
    setTaskTime(task.time)
    setReminderMinutes(task.reminderMinutes)
    setEditingTask(task)
    setIsFormVisible(true)
  }

  // Cancel editing
  const cancelEdit = () => {
    setTaskName('')
    setTaskTime('')
    setReminderMinutes(5)
    setEditingTask(null)
    setIsFormVisible(false)
  }

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
    
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // Delete task
  const deleteTask = (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(task => task.id !== id))
      
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50])
      }
    }
  }

  // Test notification
  const testNotification = () => {
    const testTask = { name: 'Test Notification', id: 'test' }
    showNotification(testTask)
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Sort tasks by time
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.time) - new Date(b.time))
  const pendingTasks = sortedTasks.filter(task => !task.completed)
  const completedTasks = sortedTasks.filter(task => task.completed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Remindly
            </h1>
          </div>
          <p className="text-gray-600">Your smart task reminder app with notifications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => {
              if (!isFormVisible) {
                setEditingTask(null)
                setTaskName('')
                setTaskTime('')
                setReminderMinutes(5)
              }
              setIsFormVisible(!isFormVisible)
            }}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </button>
          
          <button
            onClick={testNotification}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Bell className="w-5 h-5 mr-2" />
            Test Notification
          </button>
        </div>

        {/* Add Task Form */}
        {isFormVisible && (
          <div className="bg-white rounded-2xl shadow-xl border mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label id='taskNameLabel' className="block text-sm font-medium text-gray-700 mb-2">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter task name..."
                    required
                    id='taskNameInput'
                  />
                </div>

                <div>
                  <label id='taskTime' className="block text-sm font-medium text-gray-700 mb-2">
                    Task Time *
                  </label>
                  <input
                  id='tasktimeInput'
                    type="datetime-local"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label id='taskTimeReminderLabel' className="block text-sm font-medium text-gray-700 mb-2">
                    Remind me (minutes before)
                  </label>
                  <select
                  id='taskTime'
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value={1}>1 minute before</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addTask}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Display */}
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl text-gray-500 mb-2">No tasks yet!</h3>
            <p className="text-gray-400">Click "Add Task" to create your first reminder</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-orange-600" />
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="grid gap-4">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl shadow-md border border-orange-100 p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(task.time)}
                            </p>
                            <p className="flex items-center">
                              <Bell className="w-4 h-4 mr-1" />
                              Reminder: {task.reminderMinutes} min before
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => editTask(task)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit task"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Mark as completed"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Check className="w-6 h-6 mr-2 text-green-600" />
                  Completed Tasks ({completedTasks.length})
                </h2>
                <div className="grid gap-4">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl shadow-md border border-green-100 p-6 opacity-75 hover:opacity-100 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-through decoration-green-500">
                            {task.name}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(task.time)}
                            </p>
                            <p className="text-green-600 font-medium">✅ Completed</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => editTask(task)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit task"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                            title="Mark as pending"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Remindly - Stay organized with smart notifications 🔔</p>
          <p className="mt-1">All data is stored locally in your browser</p>
        </div>
      </div>
    </div>
  )
}

export default App