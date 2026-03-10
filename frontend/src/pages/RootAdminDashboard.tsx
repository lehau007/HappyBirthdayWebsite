import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface AdminUser {
  id: number
  username: string
  created_at: string
}

export default function RootAdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loadError, setLoadError] = useState('')

  const loadAdmins = async () => {
    try {
      setLoadError('')
      const r = await api.get('/admin')
      setAdmins(r.data)
    } catch {
      setLoadError('Không thể tải danh sách admin.')
    }
  }

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xoá admin này?')) return
    setSuccess('')  // clear stale success banner (BUG-021)
    try {
      await api.delete(`/admin/${id}`)
      loadAdmins()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xoá admin thất bại.')
    }
  }

  useEffect(() => { loadAdmins() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data } = await api.post('/admin/create', newAdmin)
      setSuccess(`Đã tạo Admin "${data.username}" thành công.`)
      setNewAdmin({ username: '', password: '' })
      loadAdmins()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(
        !err.response ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
        : typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg).join(' ')
        : 'Tạo admin thất bại'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-yellow-400">Bảng Quản Trị Gốc</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">@{user?.username}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm transition">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold mb-6">Tạo Admin Mới</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Tên đăng nhập admin"
              value={newAdmin.username}
              onChange={e => setNewAdmin(p => ({ ...p, username: e.target.value }))}
              required
              maxLength={64}
              className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="password"
              placeholder="Mật khẩu admin"
              value={newAdmin.password}
              onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))}
              required
              maxLength={128}
              className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Đang tạo…' : '+ Tạo Admin'}
            </button>
          </form>
        </div>

        <p className="text-gray-600 text-xs text-center mt-8">
          Root Admin chỉ có thể tạo Admin. Admin quản lý người dùng thiệp sinh nhật.
        </p>

        {loadError && <p className="text-red-400 text-sm text-center mt-4">{loadError}</p>}
        {admins.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 mt-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Danh Sách Admin ({admins.length})</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="pb-2">Tên đăng nhập</th>
                  <th className="pb-2">Ngày tạo</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-2">{a.username}</td>
                    <td className="py-2 text-gray-400">{new Date(a.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteAdmin(a.id)}
                        className="text-red-400 hover:text-red-300 transition text-xs"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
