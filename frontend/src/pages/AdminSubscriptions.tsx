// frontend/src/pages/AdminSubscriptions.tsx
import React, { useEffect, useState } from 'react'

interface Subscription { id:string; userId:string; status:string; createdAt:string }

export function AdminSubscriptions() {
    const [subs, setSubs] = useState<Subscription[]>([])
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/subscriptions`, { credentials:'include' })
            .then(r => r.json())
            .then(setSubs)
    }, [])
    return (
        <div className="overflow-auto bg-white rounded shadow">
            <table className="w-full text-left">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Criado em</th>
                </tr>
                </thead>
                <tbody>
                {subs.map(s=>(
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm">{s.id}</td>
                        <td className="p-3 text-sm">{s.userId}</td>
                        <td className="p-3 text-sm">{s.status}</td>
                        <td className="p-3 text-sm">{new Date(s.createdAt).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
