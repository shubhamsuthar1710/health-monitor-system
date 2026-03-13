"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function TestPage() {
    var _a, _b, _c, _d, _e;
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const testConnection = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            // Use route1.ts
            const response = yield fetch('/api/test-supabase');
            const data = yield response.json();
            setResult(data);
            if (!response.ok) {
                setError(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    });
    const testDirectHealthEntries = () => __awaiter(this, void 0, void 0, function* () {
        const url = 'https://rkatlmcfikwqpkedqdth.supabase.co/rest/v1/health_entries';
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXRsbWNmaWt3cXBrZWRxZHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzcwODAsImV4cCI6MjA4NDU1MzA4MH0.CyR3mlJdAOPaqChWIR8gvEQwk5ZOR3d2_8NskkZNZlA';
        try {
            const response = yield fetch(url, {
                method: 'GET', // Change to POST if you want to test insert
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = yield response.json();
            console.log('Direct health_entries fetch:', {
                status: response.status,
                statusText: response.statusText,
                data
            });
            alert(`Health entries: ${response.status} ${response.statusText}\nSee console for details`);
        }
        catch (err) {
            console.error('Direct fetch error:', err);
            alert('Direct fetch failed: ' + err.message);
        }
    });
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Supabase Connection Test" }), _jsxs("div", { className: "mb-4 p-4 bg-gray-50 rounded", children: [_jsx("h3", { className: "font-bold mb-2", children: "Your Environment Variables:" }), _jsxs("div", { className: "text-sm", children: [_jsxs("div", { children: [_jsx("strong", { children: "URL:" }), " ", process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING'] }), _jsxs("div", { children: [_jsx("strong", { children: "API Key:" }), " ", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ PRESENT' : '❌ MISSING'] })] })] }), _jsxs("div", { className: "space-y-4 mb-8", children: [_jsx("button", { onClick: testConnection, disabled: loading, className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50", children: loading ? 'Testing...' : 'Test Supabase API Route' }), _jsx("button", { onClick: testDirectHealthEntries, className: "ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700", children: "Test health_entries Table" })] }), error && (_jsxs("div", { className: "p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded", children: [_jsx("h2", { className: "font-bold", children: "Error" }), _jsx("pre", { className: "mt-2 whitespace-pre-wrap text-sm", children: error })] })), result && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "p-4 bg-gray-100 rounded", children: [_jsx("h2", { className: "font-bold mb-2", children: "Test Results" }), _jsx("pre", { className: "whitespace-pre-wrap text-sm", children: JSON.stringify(result, null, 2) })] }), _jsxs("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded", children: [_jsx("h3", { className: "font-bold mb-2", children: "Quick Diagnosis:" }), _jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [_jsxs("li", { children: [_jsx("strong", { children: "Environment vars:" }), " ", ((_a = result.envCheck) === null || _a === void 0 ? void 0 : _a.keyExists) ? '✅ Present' : '❌ Missing'] }), _jsxs("li", { children: [_jsx("strong", { children: "Direct fetch:" }), " ", ((_b = result.directFetchTest) === null || _b === void 0 ? void 0 : _b.status) === 200 ? '✅ Success' :
                                                `❌ Failed (${(_c = result.directFetchTest) === null || _c === void 0 ? void 0 : _c.status})`] }), _jsxs("li", { children: [_jsx("strong", { children: "Supabase client:" }), " ", ((_d = result.supabaseClientTest) === null || _d === void 0 ? void 0 : _d.success) ? '✅ Connected' :
                                                `❌ Error: ${(_e = result.supabaseClientTest) === null || _e === void 0 ? void 0 : _e.error}`] })] })] })] })), _jsxs("div", { className: "mt-8 p-4 bg-gray-50 rounded", children: [_jsx("h3", { className: "font-bold mb-2", children: "Quick Browser Console Test:" }), _jsx("pre", { className: "text-sm bg-black text-white p-3 rounded", children: `// Copy and paste in browser console:
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXRsbWNmaWt3cXBrZWRxZHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzcwODAsImV4cCI6MjA4NDU1MzA4MH0.CyR3mlJdAOPaqChWIR8gvEQwk5ZOR3d2_8NskkZNZlA'

fetch('https://rkatlmcfikwqpkedqdth.supabase.co/rest/v1/profiles', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => console.log(r.status, r.statusText))
.then(d => console.log(d))
.catch(e => console.error(e))` })] })] }));
}
