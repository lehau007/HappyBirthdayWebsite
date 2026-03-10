import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface User {
  id: number
  username: string
  birthday_info: string | null
  created_at: string
}

interface FeedbackItem {
  id: number
  username: string
  feedback_type: string
  content: string
  created_at: string
  is_read: boolean
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'users' | 'inbox'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [inbox, setInbox] = useState<FeedbackItem[]>([])
  const [newUser, setNewUser] = useState({ username: '', password: '', birthday_info: '' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadUsers = async () => {
    try {
      setLoadError('')
      const r = await api.get('/users')
      setUsers(r.data)
    } catch {
      setLoadError('Không thể tải danh sách người dùng.')
    }
  }

  const loadInbox = async () => {
    try {
      setLoadError('')
      const r = await api.get('/inbox')
      setInbox(r.data)
    } catch {
      setLoadError('Không thể tải hộp thư.')
    }
  }

  useEffect(() => { loadUsers(); loadInbox() }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      await api.post('/users/create', newUser)
      setNewUser({ username: '', password: '', birthday_info: '' })
      loadUsers()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setCreateError(
        !err.response ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
        : typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg).join(' ')
        : 'Tạo người dùng thất bại'
      )
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xoá người dùng này?')) return
    try {
      await api.delete(`/users/${id}`)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xoá người dùng thất bại. Vui lòng thử lại.')
    }
  }

  const markRead = async (id: number) => {
    try {
      await api.patch(`/inbox/${id}/read`)
      setInbox(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f))
    } catch {
      alert('Không thể đánh dấu đã đọc. Vui lòng thử lại.')
    }
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-cyan-400">Bảng Quản Trị</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">@{user?.username}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm transition">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {(['users', 'inbox'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'inbox') loadInbox() }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
              tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t === 'users' ? '👥 Người dùng' : `📬 Hộp thư (${inbox.filter(f => !f.is_read).length})`}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {loadError && (
          <p className="text-red-400 text-sm mb-4 text-center">{loadError}</p>
        )}
        {/* Users tab */}
        {tab === 'users' && (
          <div className="flex flex-col gap-6">
            {/* Create user form */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Tạo người dùng thiệp sinh nhật</h2>
              <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={newUser.username}
                    onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                    required
                    maxLength={64}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    required
                    maxLength={128}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Thông tin sinh nhật (tuỳ chọn — dùng để cá nhân hoá bài thơ AI)"
                  value={newUser.birthday_info}
                  onChange={e => setNewUser(p => ({ ...p, birthday_info: e.target.value }))}
                  maxLength={512}
                  className="bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                />
                {createError && <p className="text-red-400 text-sm">{createError}</p>}
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {createLoading ? 'Đang tạo (đang tạo bài thơ…)' : '+ Tạo người dùng'}
                </button>
              </form>
            </div>

            {/* User list */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Người dùng của tôi ({users.length})</h2>
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có người dùng nào.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-800">
                      <th className="pb-2">Tên đăng nhập</th>
                      <th className="pb-2">Thông tin sinh nhật</th>
                      <th className="pb-2">Ngày tạo</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                        <td className="py-2">{u.username}</td>
                        <td className="py-2 text-gray-400">{u.birthday_info || '—'}</td>
                        <td className="py-2 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-2">
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-400 hover:text-red-300 transition text-xs"
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Inbox tab */}
        {tab === 'inbox' && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Hộp thư phản hồi</h2>
            {inbox.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có tin nhắn nào.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {inbox.map(item => {
                  const cfg: Record<string, { icon: string; label: string; unread: string; read: string; contentClass: string }> = {
                    punch:    { icon: '\uD83D\uDC4A', label: 'Đấm',      unread: 'bg-orange-900/70 ring-1 ring-orange-400', read: 'bg-orange-950/40',  contentClass: 'text-4xl' },
                    thankyou: { icon: '\uD83D\uDE4F', label: 'Cảm ơn',  unread: 'bg-yellow-900/60 ring-1 ring-yellow-400', read: 'bg-yellow-950/40', contentClass: 'text-yellow-200 font-medium' },
                    reaction: { icon: '\uD83D\uDE0A', label: 'Biểu cảm', unread: 'bg-purple-900/60 ring-1 ring-purple-400', read: 'bg-purple-950/40', contentClass: 'text-4xl' },
                    text:     { icon: '\u270D\uFE0F', label: 'Lời nhắn', unread: 'bg-gray-700 ring-1 ring-cyan-500',          read: 'bg-gray-800',         contentClass: 'text-gray-200' },
                  }
                  const style = cfg[item.feedback_type] ?? cfg.text
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl p-4 transition ${
                        item.is_read ? style.read : `${style.unread} cursor-pointer`
                      }`}
                      onClick={() => { if (!item.is_read) markRead(item.id) }}
                      title={item.is_read ? undefined : 'Nhấn để đánh dấu đã đọc'}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">@{item.username}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span>{style.icon} {style.label}</span>
                          <span>·</span>
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </span>
                      </div>
                      <p className={style.contentClass}>{item.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
