// frontend/src/pages/AdminUsers.tsx
import React, { useEffect, useState } from 'react'
import {useNavigate} from "react-router-dom";

type Role = 'admin' | 'user'

interface User {
  id: string
  email: string
  role: Role
  status?: string
  createdAt: string
  lastLogin?: string
}

export function AdminUsers() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // estado do modal de criação/edição
  const [isModalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]       = useState<User | null>(null)
  const [form, setForm]             = useState({
    email:    '',
    password: '',
    role:     'user' as Role
  })

  // carregamento inicial
  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/admin/users`,
          { credentials: 'include' }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setUsers(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const navigate = useNavigate();

  function openChat() {
    navigate('/chat');
  }

  function openNew() {
    setEditing(null)
    setForm({ email: '', password: '', role: 'user' })
    setModalOpen(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ email: u.email, password: '', role: u.role })
    setModalOpen(true)
  }

  async function handleSave() {
    try {
      const url    = editing
          ? `${import.meta.env.VITE_API_BASE_URL}/admin/users/${editing.id}`
          : `${import.meta.env.VITE_API_BASE_URL}/admin/users`
      const method = editing ? 'PUT' : 'POST'
      const body: any = { email: form.email, role: form.role }
      if (form.password) body.password = form.password

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar usuário')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este usuário?')) return
    try {
      const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/admin/user/${id}`,
          {
            method: 'DELETE',
            credentials: 'include'
          }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao excluir')
      }
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <p className="p-6">Carregando usuários...</p>
  if (error)   return <p className="p-6 text-red-500">Erro: {error}</p>

  return (
      <div className="px-1 sm:px-2 md:px-3 lg:px-4 py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={openNew}
          >
            + Novo Usuário
          </button>

          <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={openChat}
          >
            💬 Chat
          </button>
        </div>

        <div className="overflow-auto bg-white rounded shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Papel</th>
              <th className="p-3">Status</th>
              <th className="p-3">Criado em</th>
              <th className="p-3">Último login</th>
              <th className="p-3">Ações</th>
            </tr>
            </thead>
            <tbody>
            {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm">{u.id}</td>
                  <td className="p-3 text-sm">{u.email}</td>
                  <td className="p-3 text-sm">{u.role}</td>
                  <td className="p-3 text-sm">{u.status ?? '—'}</td>
                  <td className="p-3 text-sm">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm">
                    {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleString()
                        : '—'}
                  </td>
                  <td className="flex gap-2">
                    <button
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => openEdit(u)}
                    >
                      Editar
                    </button>
                    <button
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                        onClick={() => handleDelete(u.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded shadow-lg w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 space-y-4">
                <h2 className="text-xl font-bold">
                  {editing ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>

                <label className="block">
                  <span>E-mail</span>
                  <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="mt-1 w-full border rounded p-2"
                  />
                </label>

                <label className="block">
                  <span>Senha {editing && '(deixe em branco para não alterar)'}</span>
                  <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="mt-1 w-full border rounded p-2"
                  />
                </label>

                <label className="block">
                  <span>Papel</span>
                  <select
                      value={form.role}
                      onChange={(e) =>
                          setForm((f) => ({ ...f, role: e.target.value as Role }))
                      }
                      className="mt-1 w-full border rounded p-2"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                      className="px-4 py-2 rounded border hover:bg-gray-100"
                      onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                      onClick={handleSave}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
