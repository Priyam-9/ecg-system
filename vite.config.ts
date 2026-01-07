///IN MY device
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
//vite.dev changes made by me
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
