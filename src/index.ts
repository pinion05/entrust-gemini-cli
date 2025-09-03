/**
 * 👋 Welcome to your Smithery project!
 * To run your server, run "npm run dev"
 *
 * You might find these resources useful:
 *
 * 🧑‍💻 MCP's TypeScript SDK (helps you define your server)
 * https://github.com/modelcontextprotocol/typescript-sdk
 *
 * 📝 smithery.yaml (defines user-level config, like settings or API keys)
 * https://smithery.ai/docs/build/project-config/smithery-yaml
 *
 * 💻 smithery CLI (run "npx @smithery/cli dev" or explore other commands below)
 * https://smithery.ai/docs/concepts/cli
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Optional: If you have user-level config, define it here
// This should map to the config in your smithery.yaml file
export const configSchema = z.object({
	debug: z.boolean().default(false).describe("Enable debug logging"),
})

export default function createServer({
	config,
}: {
	config: z.infer<typeof configSchema> // Define your config in smithery.yaml
}) {
	const server = new McpServer({
		name: "entrust-gemini-cli",
		version: "0.0.1",
	})

	server.registerTool(
		"health_check",
		{
			title: "Health Check",
			description: "Check Gemini CLI health by running a simple test",
			inputSchema: {},
		},
		async () => {
			try {
				console.log('🔵 [health_check] Starting Gemini CLI health check')
				// Try different methods to execute gemini
				let stdout: string = ''
				let stderr: string = ''
				
				try {
					// Method 1: Try direct npx
					const result = await execAsync('npx -y gemini -m gemini-2.5-flash -p "say hi"', { 
						timeout: 10000,
						env: { ...process.env }
					})
					stdout = result.stdout
					stderr = result.stderr
				} catch (npxError) {
					// Method 2: Try with shell
					try {
						const shellCommand = process.platform === 'win32' 
							? 'cmd /c npx -y gemini -m gemini-2.5-flash -p "say hi"'
							: 'sh -c \'npx -y gemini -m gemini-2.5-flash -p "say hi"\''
						const result = await execAsync(shellCommand, { timeout: 10000 })
						stdout = result.stdout
						stderr = result.stderr
					} catch (shellError) {
						throw new Error(`Failed to execute gemini. Please ensure gemini CLI is installed globally: npm install -g gemini`)
					}
				}
				
				if (stderr) {
					console.error('⚠️ [health_check] stderr output:', stderr)
				}
				
				console.log('✅ [health_check] Command executed successfully')
				console.log('📥 [health_check] Response:', stdout)
				
				return {
					content: [
						{ 
							type: "text", 
							text: `Health check successful!\n\nGemini response:\n${stdout}${stderr ? `\n\nWarnings:\n${stderr}` : ''}` 
						}
					],
				}
			} catch (error) {
				console.error('❌ [health_check] Error during health check:', error)
				return {
					content: [
						{ 
							type: "text", 
							text: `Health check failed!\n\nError: ${error instanceof Error ? error.message : String(error)}` 
						}
					],
				}
			}
		},
	)


	return server.server
}
