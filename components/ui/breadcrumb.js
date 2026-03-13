var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
function Breadcrumb(_a) {
    var props = __rest(_a, []);
    return _jsx("nav", Object.assign({ "aria-label": "breadcrumb", "data-slot": "breadcrumb" }, props));
}
function BreadcrumbList(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("ol", Object.assign({ "data-slot": "breadcrumb-list", className: cn('text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5', className) }, props)));
}
function BreadcrumbItem(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("li", Object.assign({ "data-slot": "breadcrumb-item", className: cn('inline-flex items-center gap-1.5', className) }, props)));
}
function BreadcrumbLink(_a) {
    var { asChild, className } = _a, props = __rest(_a, ["asChild", "className"]);
    const Comp = asChild ? Slot : 'a';
    return (_jsx(Comp, Object.assign({ "data-slot": "breadcrumb-link", className: cn('hover:text-foreground transition-colors', className) }, props)));
}
function BreadcrumbPage(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("span", Object.assign({ "data-slot": "breadcrumb-page", role: "link", "aria-disabled": "true", "aria-current": "page", className: cn('text-foreground font-normal', className) }, props)));
}
function BreadcrumbSeparator(_a) {
    var { children, className } = _a, props = __rest(_a, ["children", "className"]);
    return (_jsx("li", Object.assign({ "data-slot": "breadcrumb-separator", role: "presentation", "aria-hidden": "true", className: cn('[&>svg]:size-3.5', className) }, props, { children: children !== null && children !== void 0 ? children : _jsx(ChevronRight, {}) })));
}
function BreadcrumbEllipsis(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsxs("span", Object.assign({ "data-slot": "breadcrumb-ellipsis", role: "presentation", "aria-hidden": "true", className: cn('flex size-9 items-center justify-center', className) }, props, { children: [_jsx(MoreHorizontal, { className: "size-4" }), _jsx("span", { className: "sr-only", children: "More" })] })));
}
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, };
