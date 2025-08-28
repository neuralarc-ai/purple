'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, CheckCircle, Book } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedPrompt {
  id: number;
  content: string;
}

export default function PromptLibraryPage() {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const generatePrompts = async () => {
    if (!role.trim() || !task.trim()) {
      toast.error('Please fill in both role and task fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, task }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts);
      toast.success('Prompts generated successfully!');
    } catch (error) {
      console.error('Error generating prompts:', error);
      toast.error('Failed to generate prompts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setRole('');
    setTask('');
    setPrompts([]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Book className="h-8 w-8" />
          Prompt Library
        </h1>
        <p className="text-muted-foreground">
          Generate and manage your AI prompts for different roles and tasks.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Prompts</CardTitle>
          <CardDescription>
            Enter a role and task to generate AI prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="e.g., Marketing Specialist, Software Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task">Task</Label>
            <Textarea
              id="task"
              placeholder="e.g., Write a social media post about our new product"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={generatePrompts} 
              disabled={isLoading || !role.trim() || !task.trim()}
              className="flex-1 md:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Prompts'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {prompts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Generated Prompts</h2>
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">{prompt.content}</pre>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(prompt.content, prompt.id)}
                      className="shrink-0"
                    >
                      {copiedId === prompt.id ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
