'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

const ISSUE_TYPES = [
  'Feature request',
  'Task report',
  'Phone number verification',
  'Membership and payment issue',
  'Account issue',
  'Cannot be shared publicly',
  'Connectors',
  'Other',
];

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    sharedLink: '',
    email: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setScreenshot(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file (JPG or PNG)');
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Please log in to submit feedback');
        return;
      }

      // Create FormData for API submission
      const submitData = new FormData();
      submitData.append('issueType', formData.issueType);
      submitData.append('description', formData.description);
      submitData.append('sharedLink', formData.sharedLink);
      submitData.append('email', formData.email);
      
      if (screenshot) {
        submitData.append('screenshot', screenshot);
      }

      // Submit to API endpoint
      console.log('Submitting feedback with data:', {
        issueType: formData.issueType,
        description: formData.description,
        sharedLink: formData.sharedLink,
        email: formData.email,
        hasScreenshot: !!screenshot,
        screenshotName: screenshot?.name,
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      // Log form data to console as requested
      console.log('Feedback Form Data:', {
        ...formData,
        feedbackId: result.feedbackId,
        screenshot: screenshot ? {
          name: screenshot.name,
          size: screenshot.size,
          type: screenshot.type,
        } : null,
      });

      // Reset form
      setFormData({
        issueType: '',
        description: '',
        sharedLink: '',
        email: '',
      });
      setScreenshot(null);
      setScreenshotPreview(null);
      
      toast.success('Feedback submitted successfully! We\'ll get back to you soon.');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background  flex items-center justify-center p-4">
      <div className="w-full  max-w-xl">
        {/* Back to App Link */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Link>
        </div>

        {/* Feedback Form Card */}
        <Card className="shadow-lg border-0 bg-card justify-center ">
          <CardHeader className="relative pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Feedback
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-muted"
              onClick={() => router.back()}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div className="space-y-2 ">
                <label htmlFor="issueType" className="text-md font-medium">
                  Issue Type
                </label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => handleInputChange('issueType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-md font-medium">
                  Issue Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Please describe your issue or feedback..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[120px] resize-none"
                  required
                />
                
                {/* Screenshot Upload */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="screenshot"
                    accept="image/jpeg,image/png"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('screenshot')?.click()}
                    className="h-8 px-3"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Screenshot
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    JPG or PNG only
                  </span>
                </div>

                {/* Screenshot Preview */}
                {screenshotPreview && (
                  <div className="relative inline-block">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-w-full h-32 object-contain border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={removeScreenshot}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Shared Link */}
              <div className="space-y-2">
                <label htmlFor="sharedLink" className="text-md font-medium">
                  Shared Link (optional)
                </label>
                <Input
                  id="sharedLink"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.sharedLink}
                  onChange={(e) => handleInputChange('sharedLink', e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-md font-medium">
                  Your Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/80 transition-colors"
                disabled={isSubmitting || !formData.issueType || !formData.description || !formData.email}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
