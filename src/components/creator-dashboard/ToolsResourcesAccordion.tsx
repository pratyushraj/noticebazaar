

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
        <div className="space-y-2 text-sm text-foreground/70">
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Contract Template
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Invoice Template
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Payment Reminder Template
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Link Announcement Template
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Brand Communication Template
          </div>
        </div>
      ),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-foreground/70">
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Getting Started Guide
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            FAQ
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Contact Support
          </div>
        </div>
      ),
    },
    {
      id: 'guides',
      title: 'Guides & Best Practices',
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-foreground/70">
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Optimizing Instagram Bio
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Promoting Your CreatorArmour Link
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Professional Communication Templates
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Indian Market Specifics
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-2 text-sm text-foreground/70">
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Account Settings
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Notifications
          </div>
          <div className="p-2 rounded-lg bg-card hover:bg-secondary/50 cursor-pointer">
            Integrations
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-border/5 rounded-2xl">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tools & Resources</h3>
        
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
                      "bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-foreground/60">{section.icon}</div>
                      <span className="text-sm font-medium text-foreground">{section.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-foreground/50" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-foreground/50" />
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

