export const metadata = {
  title: 'Doctor Portal - HealthTrack',
  description: 'Secure access to patient records for healthcare providers',
};

export default function DoctorLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
}