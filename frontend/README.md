# CloudMind console

Next.js 16 / React 19 / TypeScript. Run `npm ci` and `npm run dev`, or `npm run build` for the production bundle. The Dockerfile uses Next.js standalone output.

Set `NEXT_PUBLIC_API_URL` before building; default is `http://localhost:8000`. `app/page.tsx` retains the resource management console. `app/Operations.tsx` contains telemetry, forecasts, scaling, investigation and activity screens. `app/api.ts` handles bearer authentication, single-flight refresh and structured API errors.

Public registration creates developers. An operator creates administrators through the backend management command. Operations has a demo-workspace button when enabled by the server. All simulated measurements are labelled. Browser state is not an authorization boundary; the API checks every environment request.
