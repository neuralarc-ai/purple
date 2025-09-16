"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import Terminal from '@/components/magicui/terminal';

export default function PromptMessage({ className }: { className?: string }) {
  return (
    <section className={cn('w-full px-4 md:px-8 lg:px-12 mt-12 md:mt-28', className)}>
      <div className="mx-auto max-w-6xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-stretch gap-10 md:gap-16">
          <div className="flex-1">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Prompt-Powered Automation</h2>
              <p className="text-white/80 max-w-3xl md:max-w-none mx-auto md:mx-0 flex flex-col gap-1">
                Instead of manually switching between apps, just tell Helium what you need,
                <span className="font-extrabold text-lg">Below are some examples of how you can use Helium to automate your workflow:</span>
              </p>
            </div>

            <div className="mt-6 text-white/85">
              <div className="flex flex-col md:flex-row md:flex-wrap gap-4 md:gap-6 items-start justify-start text-base md:text-lg">
                <span className="max-w-xl">"Check Salesforce for leads from this week, create follow-up tasks in Asana, and send personalized emails through Mailchimp"</span>
                <span className="max-w-xl">"Pull yesterday's revenue from Stripe, update our financial dashboard in Google Sheets, and post a summary in our #sales Slack channel"</span>
                <span className="max-w-xl">"Monitor our website analytics, identify top-performing content, and schedule social media posts about it"</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <Terminal title='he2' className="w-full">
              <div className="space-y-3 text-sm md:text-base">
                <div className="space-y-4">
                  <h3 className="text-lg md:text-xl font-bold">Setup in Minutes, Not Months</h3>
                  <p className="text-white/85">
                    <span className="font-semibold">Traditional Integration:</span> Weeks of developer time, complex APIs, ongoing maintenance
                    <br />
                    <span className="font-semibold">Helium Integration:</span> 3 clicks, instant connection, prompt-based control
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-white/85">
                    <li>
                      <span className="font-medium">Click Connect</span> → Choose your app from our integration library
                    </li>
                    <li>
                      <span className="font-medium">Authenticate</span> → One-time secure login to grant permissions
                    </li>
                    <li>
                      <span className="font-medium">Start Automating</span> → Use natural language to control your connected tools
                    </li>
                  </ol>
                </div>
              </div>
            </Terminal>
          </div>
        </div>
      </div>
    </section>
  );
}


