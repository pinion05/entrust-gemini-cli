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
		name: "Say Hello",
		version: "1.0.0",
	})

	// Add a tool
	server.registerTool(
		"hello",
		{
			title: "Hello Tool",
			description: "Say hello to someone",
			inputSchema: { name: z.string().describe("Name to greet") },
		},
		async ({ name }) => ({
			content: [{ type: "text", text: `Hello, ${name}!` }],
		}),
	)

	// Add health_check tool
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
				
				const command = 'gemini -m gemini-2.5-flash -p "say hi"'
				console.log('🌐 [health_check] Executing command:', command)
				
				const { stdout, stderr } = await execAsync(command, { timeout: 10000 })
				
				if (stderr) {
					console.error('❌ [health_check] stderr output:', stderr)
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

	// Add a resource
	server.registerResource(
		"hello-world-history",
		"history://hello-world",
		{
			title: "Hello World History",
			description: "The origin story of the famous 'Hello, World' program",
		},
		async uri => ({
			contents: [
				{
					uri: uri.href,
					text: '"Hello, World" first appeared in a 1972 Bell Labs memo by Brian Kernighan and later became the iconic first program for beginners in countless languages.',
					mimeType: "text/plain",
				},
			],
		}),
	)

	// Add a prompt
	server.registerPrompt(
		"greet",
		{
			title: "Hello Prompt",
			description: "Say hello to someone",
			argsSchema: {
				name: z.string().describe("Name of the person to greet"),
			},
		},
		async ({ name }) => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `Say hello to ${name}`,
						},
					},
				],
			}
		},
	)

	return server.server
}
