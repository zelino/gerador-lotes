"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <button
            onClick={handleLogout}
            className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700 focus:outline-none"
        >
            Sair
        </button>
    )
}