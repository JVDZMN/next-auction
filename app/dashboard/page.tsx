"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role: string;
  rating: number;
  ratingCount: number;
  createdAt: string;
  cars: Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    status: string;
    currentPrice: number;
    auctionEndDate: string;
  }>;
  bids: Array<{
    id: string;
    car: {
      id: string;
      brand: string;
      model: string;
      year: number;
      status: string;
      currentPrice: number;
      auctionEndDate: string;
    };
    amount: number;
    createdAt: string;
  }>;
}

export default function UserDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/dashboard");
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center text-red-600">{error || "Failed to load user data"}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-6">
            {user.image && (
              <img src={user.image} alt={user.name || user.email} className="w-20 h-20 rounded-full object-cover border" />
            )}
            <div>
              <h2 className="text-2xl font-semibold">{user.name || user.email}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⭐ {user.rating.toFixed(1)} ({user.ratingCount} ratings)</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Role: {user.role}</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3">My Listings</h3>
          {user.cars.length === 0 ? (
            <p className="text-gray-500">You have not listed any cars for auction yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {user.cars.map((car) => (
                <div key={car.id} className="bg-white rounded shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold">{car.year} {car.brand} {car.model}</p>
                      <p className="text-xs text-gray-500">Status: {car.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold">${car.currentPrice.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Ends: {new Date(car.auctionEndDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/cars/${car.id}`)}
                    className="text-blue-600 hover:underline text-sm mt-2"
                  >
                    View Auction
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Bids */}
        <div>
          <h3 className="text-xl font-bold mb-3">My Bids</h3>
          {user.bids.length === 0 ? (
            <p className="text-gray-500">You have not placed any bids yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {user.bids.map((bid) => (
                <div key={bid.id} className="bg-white rounded shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold">{bid.car.year} {bid.car.brand} {bid.car.model}</p>
                      <p className="text-xs text-gray-500">Status: {bid.car.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold">Bid: ${bid.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Ends: {new Date(bid.car.auctionEndDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/cars/${bid.car.id}`)}
                    className="text-blue-600 hover:underline text-sm mt-2"
                  >
                    View Auction
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
