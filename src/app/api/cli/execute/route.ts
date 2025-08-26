import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    // Basic security: only allow specific CLI commands
    const allowedCommands = ['aiw', 'pc', 'wt']
    const commandParts = command.trim().split(' ')
    const baseCommand = commandParts[0]

    if (!allowedCommands.includes(baseCommand)) {
      return NextResponse.json(
        { error: 'Command not allowed' },
        { status: 403 }
      )
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      })

      return NextResponse.json({
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        command
      })
    }
  } catch (error) {
    console.error('Error executing command:', error)
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}
