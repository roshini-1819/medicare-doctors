"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DoctorDashboard() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [doctor, setDoctor] = useState<Record<string, any>>({});

  useEffect(() => {
    const data = localStorage.getItem("doctor_data");
    if (!data) {
      router.push("/doctor-login");
      return;
    }
    setDoctor(JSON.parse(data));
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // doctorId is stored in the login response as "doctorId"
      const doctorId = doctor?.doctorId;

      if (doctorId) {
        await fetch(`http://localhost:8081/api/doctors/doctor-signout/${doctorId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.warn("Backend logout failed:", error);
    } finally {
      localStorage.removeItem("doctor_token");
      localStorage.removeItem("doctor_data");
      router.push("/doctor-login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome, Dr. {doctor.doctorName || doctor.fullName || "Doctor"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Username: {doctor.username}</p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`px-6 py-2.5 rounded-xl text-white font-medium transition-colors ${
              loggingOut ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">You are currently logged in and active.</p>
          <p className="text-xs text-gray-400 mt-2">
            Your session is being tracked. Clicking Logout will record your logout time and
            mark your status as offline in the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}
