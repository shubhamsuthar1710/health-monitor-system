import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sidebar } from "@/components/dashboard/sidebar";
export default function DashboardLayout({ children, }) {
    return (_jsxs("div", { className: "flex min-h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 lg:pl-0 pl-0", children: _jsx("div", { className: "container mx-auto px-4 py-6 lg:px-8 lg:py-8 pt-16 lg:pt-8", children: children }) })] }));
}