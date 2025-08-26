import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    const status = {
      aiIntegration: false,
      personaManager: false,
      workflowTracker: false
    }

    // Check if AI Integration CLI is available
    try {
      await execAsync('which aiw')
      status.aiIntegration = true
    } catch (error) {
      // Command not found
    }

    // Check if Persona Manager CLI is available
    try {
      await execAsync('which pc')
      status.personaManager = true
    } catch (error) {
      // Command not found
    }

    // Check if Workflow Tracker CLI is available
    try {
      await execAsync('which wt')
      status.workflowTracker = true
    } catch (error) {
      // Command not found
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking CLI status:', error)
    return NextResponse.json(
      { error: 'Failed to check CLI status' },
      { status: 500 }
    )
  }
}
