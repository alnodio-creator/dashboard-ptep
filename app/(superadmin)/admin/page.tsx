import AdminDatabase from "./_components/admin";

export const metadata = {
  title: "Database Monitoring",
  description: "Perubahan Database",
};

export default function Admin() {
  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto">
      <AdminDatabase />
    </div>
  );
}
