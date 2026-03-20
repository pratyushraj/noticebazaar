"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, HelpCircle, BookOpen, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ToolsResourcesAccordion: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenSections(newOpen);
  };

  const sections: AccordionSection[] = [
    {
      id: 'templates',
      title: 'Templates',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-white/70">
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Contract Template
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Invoice Template
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Payment Reminder Template
          </div>
        </div>
      ),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-white/70">
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Getting Started Guide
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            FAQ
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Contact Support
          </div>
        </div>
      ),
    },
    {
      id: 'learn',
      title: 'Learn More',
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-white/70">
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Best Practices
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Legal Resources
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Video Tutorials
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-white/70">
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Account Settings
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Notifications
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
            Integrations
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Tools & Resources</h3>
        
        <div className="space-y-2">
          {sections.map((section) => {
            const isOpen = openSections.has(section.id);
            return (
              <Collapsible
                key={section.id}
                open={isOpen}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      "bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-white/60">{section.icon}</div>
                      <span className="text-sm font-medium text-white">{section.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-white/50" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/50" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  {section.content}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolsResourcesAccordion;

