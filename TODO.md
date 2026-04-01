# Fix Auth Verification Link Expiry Issue

✅ **Step 1**: Create this TODO.md (done)

✅ **Step 2**: Update `app/auth/callback/route.js` to preserve ALL Supabase error query params when redirecting to verify page

✅ **Step 3**: Enhance `app/auth/verify/page.js`:
  - Parse all searchParams (error, error_code=otp_expired, error_description)
  - Handle specific errors with better UX (pre-fill email, suggest resend)
  - Add direct `verifyOtp()` support for tokens
  - Improve error mapping and resend logic

⏳ **Step 4**: Minor updates if needed:
  - app/auth/sign-up/page.js (consistent redirectTo)
  - Remove/hide dev bypass logs

⏳ **Step 5**: Test full flow:
  - Sign up → check-email → wait expiry → click link → verify graceful handling
  - Run `pnpm dev` or `npm run dev`

⏳ **Step 6**: Complete task & cleanup TODO.md

**Notes**:
- Supabase default OTP expiry: 1 hour
- Test on localhost:3000
- Check console logs during testing

