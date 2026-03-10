## Packages
recharts | Beautiful, declarative charting for the monthly analytics
framer-motion | Essential for smooth, premium micro-interactions and modal animations
date-fns | Elegant date formatting for the expense list

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
The frontend assumes JWT tokens are provided on successful login/register and should be passed as 'Authorization: Bearer <token>' on all subsequent requests.
