export const metadata = {
  title: 'Doctor Portal - HealthTrack',
  description: 'Secure access to patient records for healthcare providers',
};

export default function DoctorLayout({ children }) {
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}