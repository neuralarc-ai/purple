import React from 'react';
import { Settings, Wrench, Server, BookOpen, Workflow, Zap } from 'lucide-react';
import { ExpandableMarkdownEditor } from '@/components/ui/expandable-markdown-editor';
import { AgentToolsConfiguration } from '../agent-tools-configuration';
import { AgentMCPConfiguration } from '../agent-mcp-configuration';
import { AgentKnowledgeBaseManager } from '../knowledge-base/agent-knowledge-base-manager';
import { AgentPlaybooksConfiguration } from '../playbooks/agent-playbooks-configuration';
import { AgentTriggersConfiguration } from '../triggers/agent-triggers-configuration';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { HeliumLogo } from '../../sidebar/helium-logo';

interface ConfigurationTabProps {
  agentId: string;
  displayData: {
    name: string;
    description: string;
    system_prompt: string;
    model?: string;
    agentpress_tools: any;
    configured_mcps: any[];
    custom_mcps: any[];
    is_default: boolean;
  };
  versionData?: {
    version_id: string;
    configured_mcps: any[];
    custom_mcps: any[];
    system_prompt: string;
    model?: string;
    agentpress_tools: any;
  };
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onMCPChange: (updates: { configured_mcps: any[]; custom_mcps: any[] }) => void;
  onSystemPromptSave?: (value: string) => void;
  onModelSave?: (model: string) => void;  // Add model save handler
  onToolsSave?: (tools: Record<string, boolean | { enabled: boolean; description: string }>) => void;
  initialAccordion?: string;
  agentMetadata?: {
    is_helium_default?: boolean;
    centrally_managed?: boolean;
    restrictions?: {
      system_prompt_editable?: boolean;
      tools_editable?: boolean;
      name_editable?: boolean;
      description_editable?: boolean;
      mcps_editable?: boolean;
    };
  };
  isLoading?: boolean;
}

export function ConfigurationTab({
  agentId,
  displayData,
  versionData,
  isViewingOldVersion,
  onFieldChange,
  onMCPChange,
  onSystemPromptSave,
  onModelSave,
  onToolsSave,
  initialAccordion,
  agentMetadata,
  isLoading = false,
}: ConfigurationTabProps) {
  const isHeliumAgent = agentMetadata?.is_helium_default || false;

  // Step-based navigation state - 6 steps for the 6 configuration sections
  const [currentStep, setCurrentStep] = React.useState<'system' | 'tools' | 'integrations' | 'knowledge' | 'playbooks' | 'triggers'>('system');

  const restrictions = agentMetadata?.restrictions || {};

  // Form state for step-based editing
  const [formData, setFormData] = React.useState({
    name: displayData.name,
    description: displayData.description,
    system_prompt: displayData.system_prompt,
    agentpress_tools: displayData.agentpress_tools,
    configured_mcps: displayData.configured_mcps,
    custom_mcps: displayData.custom_mcps,
  });

  // Update form data when displayData changes
  React.useEffect(() => {
    setFormData({
      name: displayData.name,
      description: displayData.description,
      system_prompt: displayData.system_prompt,
      agentpress_tools: displayData.agentpress_tools,
      configured_mcps: displayData.configured_mcps,
      custom_mcps: displayData.custom_mcps,
    });
  }, [displayData]);

  const handleFormFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isSystemPromptEditable = !isViewingOldVersion && (restrictions.system_prompt_editable !== false);
  const areToolsEditable = !isViewingOldVersion && (restrictions.tools_editable !== false);

  const handleSystemPromptChange = (value: string) => {
    if (!isSystemPromptEditable && isHeliumAgent) {
      toast.error("System prompt cannot be edited", {
        description: "Helium's system prompt is managed centrally and cannot be changed.",
      });
      return;
    }
    if (onSystemPromptSave) {
      onSystemPromptSave(value);
    } else {
      onFieldChange('system_prompt', value);
    }
  };

  const handleToolsChange = (tools: Record<string, boolean | { enabled: boolean; description: string }>) => {
    if (!areToolsEditable && isHeliumAgent) {
      toast.error("Tools cannot be modified", {
        description: "Helium's default tools are managed centrally and cannot be changed.",
      });
      return;
    }

    if (onToolsSave) {
      onToolsSave(tools);
    } else {
      onFieldChange('agentpress_tools', tools);
    }
  };

  const steps = [
    { id: 'system', label: 'System Info', number: 1, icon: Settings },
    { id: 'tools', label: 'Tools', number: 2, icon: Wrench },
    { id: 'integrations', label: 'Integrations', number: 3, icon: Server },
    { id: 'knowledge', label: 'Knowledge Base', number: 4, icon: BookOpen },
    { id: 'playbooks', label: 'Playbooks', number: 5, icon: Workflow },
    { id: 'triggers', label: 'Triggers', number: 6, icon: Zap },
  ];

  const handleContinue = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as any);
    }
  };

  const handleSaveAndContinue = () => {
    // Save current step data
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof typeof formData] !== displayData[key as keyof typeof displayData]) {
        onFieldChange(key, formData[key as keyof typeof formData]);
      }
    });

    // If we're on the last step (triggers), complete the configuration
    if (currentStep === 'triggers') {
      // Configuration is complete - you can add any completion logic here
      toast.success('Agent configuration completed successfully!');
      return;
    }

    handleContinue();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b">
        {/* Step Navigation */}
        <div className="flex items-center justify-center w-full max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Button */}
              <button
                onClick={() => setCurrentStep(step.id as any)}
                disabled={isLoading}
                className={`relative z-10 transition-all ${currentStep === step.id
                  ? 'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-foreground text-background'
                  : 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {currentStep === step.id ? (
                  <>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-background text-foreground">
                      {step.number}
                    </div>
                    {step.label}
                  </>
                ) : (
                  step.number
                )}
              </button>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-muted mx-2 min-w-8" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-4xl">
          {isHeliumAgent && (
            <div className="p-4 bg-primary/10 border border-primary-200 rounded-xl mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-primary-600">
                  <HeliumLogo size={20} />
                </div>
                <span className="font-semibold text-primary-800">Helium Default Agent</span>
              </div>
              <p className="text-sm text-primary-700">
                This is Helium's default agent with centrally managed system prompt and tools.
                You can customize integrations, knowledge base, playbooks, and triggers to personalize your experience.
              </p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'system' && !isHeliumAgent && (
            <div className="space-y-6">
              {/* Basic Info Section - Only visible on System Prompt step */}
              <div className="space-y-6 mb-8">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Name</h2>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFormFieldChange('name', e.target.value)}
                    placeholder="Enter agent name"
                    disabled={isLoading || isViewingOldVersion}
                    className="text-lg"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Instructions</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Control your agents behavior by adding custom instructions
                </p>
                <ExpandableMarkdownEditor
                  value={formData.system_prompt}
                  onSave={(value) => {
                    handleFormFieldChange('system_prompt', value);
                    handleSystemPromptChange(value);
                  }}
                  placeholder='Like "Answer all questions in Spanish" or "Always follow our specific tone of voice guideline"'
                  title="System Instructions"
                  disabled={!isSystemPromptEditable || isLoading}
                />
              </div>
            </div>
          )}

          {currentStep === 'tools' && !isHeliumAgent && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Default Tools</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure default agentpress tools
                </p>
                <AgentToolsConfiguration
                  tools={formData.agentpress_tools}
                  onToolsChange={(tools) => {
                    if (areToolsEditable) {
                      handleFormFieldChange('agentpress_tools', tools);
                      handleToolsChange(tools);
                    }
                  }}
                  disabled={!areToolsEditable}
                  isHeliumAgent={isHeliumAgent}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {currentStep === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Integrations</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect external services via MCPs
                </p>
                <AgentMCPConfiguration
                  configuredMCPs={formData.configured_mcps}
                  customMCPs={formData.custom_mcps}
                  onMCPChange={(updates) => {
                    handleFormFieldChange('configured_mcps', updates.configured_mcps);
                    handleFormFieldChange('custom_mcps', updates.custom_mcps);
                    onMCPChange(updates);
                  }}
                  agentId={agentId}
                  versionData={{
                    configured_mcps: formData.configured_mcps,
                    custom_mcps: formData.custom_mcps,
                    system_prompt: formData.system_prompt,
                    agentpress_tools: formData.agentpress_tools
                  }}
                  saveMode="callback"
                  versionId={versionData?.version_id}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {currentStep === 'knowledge' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Knowledge Base</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload and manage knowledge for the agent
                </p>
                <AgentKnowledgeBaseManager
                  agentId={agentId}
                  agentName={displayData.name || 'Agent'}
                />
              </div>
            </div>
          )}

          {currentStep === 'playbooks' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Playbooks</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Simple variable-driven runs
                </p>
                <AgentPlaybooksConfiguration
                  agentId={agentId}
                  agentName={displayData.name || 'Agent'}
                />
              </div>
            </div>
          )}

          {currentStep === 'triggers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Triggers</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up automated agent runs
                </p>
                <AgentTriggersConfiguration agentId={agentId} />
              </div>
            </div>
          )}

          {/* Show message for Helium agents on restricted steps */}
          {isHeliumAgent && (currentStep === 'system' || currentStep === 'tools') && (
            <div className="space-y-6">
              {/* Basic Info Section - Only visible on System Prompt step for Helium agents too */}
              {currentStep === 'system' && (
                <div className="space-y-6 mb-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Name</h2>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFormFieldChange('name', e.target.value)}
                      placeholder="Enter agent name"
                      disabled={isLoading || isViewingOldVersion}
                      className="text-lg"
                    />
                  </div>
                </div>
              )}

              <div className="p-6 border rounded-lg bg-muted/30 text-center">
                <h3 className="text-lg font-semibold mb-2">Centrally Managed</h3>
                <p className="text-muted-foreground">
                  {currentStep === 'system'
                    ? "System prompt is managed centrally for Helium agents and cannot be modified."
                    : "Default tools are managed centrally for Helium agents and cannot be modified."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t bg-background">
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAndContinue}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {currentStep === 'triggers' ? 'Complete' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}