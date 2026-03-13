'use client';
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
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
function Accordion(_a) {
    var props = __rest(_a, []);
    return _jsx(AccordionPrimitive.Root, Object.assign({ "data-slot": "accordion" }, props));
}
function AccordionItem(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx(AccordionPrimitive.Item, Object.assign({ "data-slot": "accordion-item", className: cn('border-b last:border-b-0', className) }, props)));
}
function AccordionTrigger(_a) {
    var { className, children } = _a, props = __rest(_a, ["className", "children"]);
    return (_jsx(AccordionPrimitive.Header, { className: "flex", children: _jsxs(AccordionPrimitive.Trigger, Object.assign({ "data-slot": "accordion-trigger", className: cn('focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180', className) }, props, { children: [children, _jsx(ChevronDownIcon, { className: "text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" })] })) }));
}
function AccordionContent(_a) {
    var { className, children } = _a, props = __rest(_a, ["className", "children"]);
    return (_jsx(AccordionPrimitive.Content, Object.assign({ "data-slot": "accordion-content", className: "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm" }, props, { children: _jsx("div", { className: cn('pt-0 pb-4', className), children: children }) })));
}
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
