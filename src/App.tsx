import { Outlet } from "react-router-dom";
import { Layout } from "@/Layout";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <Layout menu={<div className="text-sm text-gray-600">McPoker v1.0</div>}>
      <Outlet />
      <Toaster />
    </Layout>
  );
}
