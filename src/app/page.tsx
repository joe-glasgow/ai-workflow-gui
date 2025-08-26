'use client'

import { useState, useEffect } from 'react'

interface CLIStatus {
  aiIntegration: boolean
  personaManager: boolean
  workflowTracker: boolean
}

export default function Home() {
  const [cliStatus, setCLIStatus] = useState<CLIStatus>({
    aiIntegration: false,
    personaManager: false,
    workflowTracker: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCLIStatus()
  }, [])

  const checkCLIStatus = async () => {
    try {
      const response = await fetch('/api/cli/status')
      const data = await response.json()
      setCLIStatus(data)
    } catch (error) {
      console.error('Failed to check CLI status:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeCommand = async (command: string) => {
    try {
      const response = await fetch('/api/cli/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })
      const result = await response.json()
      console.log('Command result:', result)
      return result
    } catch (error) {
      console.error('Failed to execute command:', error)
      return { error: 'Failed to execute command' }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            AI Development Workflow GUI
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Manage your AI development workflow with an intuitive interface
          </p>
        </div>

        {/* CLI Status Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">CLI Tools Status</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Checking CLI status...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                title="AI Integration"
                status={cliStatus.aiIntegration}
                command="aiw"
              />
              <StatusCard
                title="Persona Manager"
                status={cliStatus.personaManager}
                command="pc"
              />
              <StatusCard
                title="Workflow Tracker"
                status={cliStatus.workflowTracker}
                command="wt"
              />
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton
              title="Create Persona"
              description="Create a new AI persona"
              onClick={() => executeCommand('pc create')}
              icon="👤"
            />
            <ActionButton
              title="Start Workflow"
              description="Initialize a new workflow"
              onClick={() => executeCommand('wt start')}
              icon="🚀"
            />
            <ActionButton
              title="AI Integration"
              description="Configure AI settings"
              onClick={() => executeCommand('aiw config')}
              icon="🤖"
            />
            <ActionButton
              title="List Personas"
              description="View all personas"
              onClick={() => executeCommand('pc list')}
              icon="📋"
            />
            <ActionButton
              title="Workflow Status"
              description="Check workflow progress"
              onClick={() => executeCommand('wt status')}
              icon="📊"
            />
            <ActionButton
              title="Help"
              description="View available commands"
              onClick={() => executeCommand('--help')}
              icon="❓"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500">
          <p>AI Development Workflow GUI v0.1.0</p>
        </div>
      </div>
    </div>
  )
}

interface StatusCardProps {
  title: string
  status: boolean
  command: string
}

function StatusCard({ title, status, command }: StatusCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      <p className="text-sm text-gray-600 mt-1">Command: {command}</p>
      <p className={`text-sm mt-2 ${status ? 'text-green-600' : 'text-red-600'}`}>
        {status ? 'Available' : 'Not Available'}
      </p>
    </div>
  )
}

interface ActionButtonProps {
  title: string
  description: string
  onClick: () => void
  icon: string
}

function ActionButton({ title, description, onClick, icon }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left"
    >
      <div className="flex items-center mb-2">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}
