import React, { useEffect, useState } from 'react'

interface Subscription {
    id: string
    userId: string
    status: string
    createdAt: string
}

export function AdminSubscriptions() {
    const [subs, setSubs] = useState<Subscription[]>([])

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/subscriptions`, {
            credentials: 'include',
        })
            .then((r) => r.json())
            .then(setSubs)
    }, [])

    return (
        <div className="min-h-full h-[81dvh] bg-[#f1fdf5] dark:bg-gray-900 px-4 py-4">
            <div className="overflow-auto bg-white dark:bg-gray-800 rounded shadow">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Usuário</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Criado em</th>
                    </tr>
                    </thead>
                    <tbody>
                    {subs.map((s) => (
                        <tr
                            key={s.id}
                            className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{s.id}</td>
                            <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{s.userId}</td>
                            <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{s.status}</td>
                            <td className="p-3 text-sm text-gray-900 dark:text-gray-100">
                                {new Date(s.createdAt).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
