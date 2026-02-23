/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY: string;
	readonly VITE_API_URL?: string;
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_API_FALLBACK_URL?: string;
	readonly VITE_ADMIN_CHECK_TIMEOUT_MS?: string;
	readonly VITE_EMERGENCY_ADMIN_BYPASS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
export {};